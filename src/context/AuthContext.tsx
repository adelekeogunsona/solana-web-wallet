import { useState, ReactNode, useEffect, useContext } from 'react';
import { AuthContext, ImportWalletParams, WalletData } from './authContextTypes';
import { SettingsContext } from './settingsContext';
import { defaultSettings } from './settingsTypes';
import {
  generateNewWallet,
  getKeypairFromMnemonic,
  getKeypairFromPrivateKey,
  encryptWalletData,
  decryptWalletData,
  storeWalletData,
  getStoredWalletData,
  uint8ArrayToHex
} from '../utils/wallet';
import { Keypair } from '@solana/web3.js';
import { v4 as uuidv4 } from 'uuid';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(
    localStorage.getItem('wallet_initialized') === 'true'
  );
  const [currentWallet, setCurrentWallet] = useState<WalletData | null>(null);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [currentPin, setCurrentPin] = useState<string>('');
  const settingsContext = useContext(SettingsContext);
  const settings = settingsContext?.settings || defaultSettings;

  // Check session validity on component mount and after any authentication state change
  useEffect(() => {
    const checkSession = () => {
      const sessionTimestamp = localStorage.getItem('session_timestamp');
      const encryptedWallets = localStorage.getItem('encrypted_wallets');
      const sessionPin = localStorage.getItem('session_pin');

      if (sessionTimestamp && encryptedWallets && sessionPin) {
        const now = Date.now();
        const lastActivity = parseInt(sessionTimestamp, 10);

        if (now - lastActivity < settings.autoLogoutDuration) {
          // Session is still valid
          const walletsData: WalletData[] = JSON.parse(encryptedWallets);
          setWallets(walletsData);
          // Set the first wallet as current if none is selected
          if (!currentWallet && walletsData.length > 0) {
            setCurrentWallet(walletsData[0]);
          }
          setIsAuthenticated(true);
          setCurrentPin(sessionPin); // Restore the PIN from session
          // Update the timestamp
          localStorage.setItem('session_timestamp', now.toString());
        } else {
          // Session has expired
          handleSessionExpiry();
        }
      }
    };

    checkSession();

    // Set up interval to check session every minute
    const intervalId = setInterval(checkSession, 60000);

    return () => clearInterval(intervalId);
  }, [currentWallet, settings.autoLogoutDuration]);

  const handleSessionExpiry = () => {
    localStorage.removeItem('session_timestamp');
    localStorage.removeItem('encrypted_wallets');
    localStorage.removeItem('session_pin');
    setIsAuthenticated(false);
    setCurrentWallet(null);
    setWallets([]);
    setCurrentPin('');
  };

  const updateSessionTimestamp = (updatedWallets: WalletData[], pin?: string) => {
    localStorage.setItem('session_timestamp', Date.now().toString());
    localStorage.setItem('encrypted_wallets', JSON.stringify(updatedWallets));
    // Use provided pin or existing currentPin
    const pinToUse = pin || currentPin;
    if (pinToUse) {
      localStorage.setItem('session_pin', pinToUse);
    }
  };

  const login = async (pin: string) => {
    try {
      if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
        throw new Error('Invalid PIN format');
      }

      const encryptedData = getStoredWalletData();
      if (!encryptedData) {
        throw new Error('No wallet data found');
      }

      const decryptedData = await decryptWalletData(encryptedData, pin);
      const walletsData: WalletData[] = JSON.parse(decryptedData);
      setWallets(walletsData);

      // Set the first wallet as current if available
      if (walletsData.length > 0) {
        setCurrentWallet(walletsData[0]);
      }

      setIsAuthenticated(true);
      setCurrentPin(pin); // Store the PIN for later use
      localStorage.setItem('session_pin', pin); // Store PIN in session
      updateSessionTimestamp(walletsData, pin);
    } catch (error) {
      throw new Error('Invalid PIN or corrupted wallet data: ' + error);
    }
  };

  const logout = () => {
    handleSessionExpiry();
    setCurrentPin(''); // Clear the stored PIN
  };

  const resetWallet = () => {
    localStorage.removeItem('wallet_initialized');
    localStorage.removeItem('wallet_data');
    localStorage.removeItem('session_timestamp');
    localStorage.removeItem('encrypted_wallets');
    setIsInitialized(false);
    setIsAuthenticated(false);
    setCurrentWallet(null);
    setWallets([]);
  };

  const initializeWallet = async (pin: string, confirmPin: string) => {
    if (pin !== confirmPin) {
      throw new Error('PINs do not match');
    }
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      throw new Error('PIN must be exactly 6 digits');
    }

    try {
      const { mnemonic, keypair } = generateNewWallet();
      const walletData: WalletData = {
        id: uuidv4(),
        name: 'Main Wallet',
        mnemonic,
        privateKey: uint8ArrayToHex(keypair.secretKey),
        publicKey: keypair.publicKey.toBase58()
      };

      const walletsData = [walletData];
      const encryptedData = await encryptWalletData(JSON.stringify(walletsData), pin);
      storeWalletData(encryptedData);
      localStorage.setItem('wallet_initialized', 'true');

      setWallets(walletsData);
      setCurrentWallet(walletData);
      setIsInitialized(true);
      setIsAuthenticated(true);
      setCurrentPin(pin); // Set the current PIN
      updateSessionTimestamp(walletsData, pin);
    } catch (error) {
      throw new Error('Failed to create wallet: ' + error);
    }
  };

  const createWalletData = async (params: ImportWalletParams): Promise<WalletData> => {
    let keypair: Keypair;
    let mnemonic: string | undefined;

    if (params.type === 'seed') {
      if (!params.seedPhrase) {
        throw new Error('Seed phrase is required');
      }
      const words = params.seedPhrase.trim().split(/\s+/);
      if (words.length !== 12 && words.length !== 24) {
        throw new Error('Invalid seed phrase length. Must be 12 or 24 words');
      }
      keypair = getKeypairFromMnemonic(params.seedPhrase);
      mnemonic = params.seedPhrase;
    } else {
      if (!params.privateKey) {
        throw new Error('Private key is required');
      }
      keypair = getKeypairFromPrivateKey(params.privateKey);
    }

    return {
      id: uuidv4(),
      name: params.name || `Wallet ${wallets.length + 1}`,
      mnemonic,
      privateKey: uint8ArrayToHex(keypair.secretKey),
      publicKey: keypair.publicKey.toBase58()
    };
  };

  const importWallet = async (params: ImportWalletParams) => {
    if (params.password !== params.confirmPassword) {
      throw new Error('PINs do not match');
    }
    if (params.password.length !== 6 || !/^\d{6}$/.test(params.password)) {
      throw new Error('PIN must be exactly 6 digits');
    }

    try {
      const walletData = await createWalletData(params);
      const walletsData = [walletData];

      const encryptedData = await encryptWalletData(JSON.stringify(walletsData), params.password);
      storeWalletData(encryptedData);
      localStorage.setItem('wallet_initialized', 'true');

      setWallets(walletsData);
      setCurrentWallet(walletData);
      setIsInitialized(true);
      setIsAuthenticated(true);
      setCurrentPin(params.password); // Set the current PIN
      updateSessionTimestamp(walletsData, params.password);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to import wallet: ' + error);
    }
  };

  const addWallet = async (params: ImportWalletParams) => {
    try {
      const sessionPin = localStorage.getItem('session_pin');
      if (!sessionPin) {
        throw new Error('No active session found. Please log in again.');
      }

      const walletData = await createWalletData(params);

      // Check if wallet with same public key already exists
      if (wallets.some(w => w.publicKey === walletData.publicKey)) {
        throw new Error('Wallet with this address already exists');
      }

      const updatedWallets = [...wallets, walletData];
      const encryptedData = await encryptWalletData(JSON.stringify(updatedWallets), sessionPin);
      storeWalletData(encryptedData);

      setWallets(updatedWallets);
      setCurrentWallet(walletData);
      updateSessionTimestamp(updatedWallets, sessionPin);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to add wallet: ' + error);
    }
  };

  const switchWallet = (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) {
      // Update lastUsed timestamp
      const updatedWallets = wallets.map(w =>
        w.id === walletId
          ? { ...w, lastUsed: new Date().toISOString() }
          : w
      );
      setWallets(updatedWallets);
      setCurrentWallet(wallet);
      updateSessionTimestamp(updatedWallets);
    }
  };

  const toggleFavorite = async (walletId: string) => {
    try {
      const sessionPin = localStorage.getItem('session_pin');
      if (!sessionPin) {
        throw new Error('No active session found. Please log in again.');
      }

      const updatedWallets = wallets.map(w =>
        w.id === walletId
          ? { ...w, isFavorite: !w.isFavorite }
          : w
      );

      const encryptedData = await encryptWalletData(JSON.stringify(updatedWallets), sessionPin);
      storeWalletData(encryptedData);

      setWallets(updatedWallets);
      updateSessionTimestamp(updatedWallets);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update wallet favorite status: ' + error);
    }
  };

  const removeWallet = async (walletId: string) => {
    try {
      // Prevent removing the last wallet
      if (wallets.length <= 1) {
        throw new Error('Cannot remove the last wallet');
      }

      const updatedWallets = wallets.filter(w => w.id !== walletId);
      const encryptedData = await encryptWalletData(JSON.stringify(updatedWallets), ''); // We'll need to pass the PIN here
      storeWalletData(encryptedData);

      setWallets(updatedWallets);

      // If removing current wallet, switch to the first available
      if (currentWallet?.id === walletId) {
        setCurrentWallet(updatedWallets[0]);
      }

      updateSessionTimestamp(updatedWallets);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to remove wallet: ' + error);
    }
  };

  const changePin = async (currentPin: string, newPin: string) => {
    try {
      // Verify current PIN
      const encryptedData = getStoredWalletData();
      if (!encryptedData) {
        throw new Error('No wallet data found');
      }

      // Try to decrypt with current PIN
      const decryptedData = await decryptWalletData(encryptedData, currentPin);

      // Re-encrypt with new PIN
      const newEncryptedData = await encryptWalletData(decryptedData, newPin);
      storeWalletData(newEncryptedData);

      // Update session with new PIN
      setCurrentPin(newPin);
      localStorage.setItem('session_pin', newPin);

      // Re-encrypt wallets array with new PIN
      const walletsJson = JSON.stringify(wallets);
      const newEncryptedWallets = await encryptWalletData(walletsJson, newPin);
      localStorage.setItem('encrypted_wallets', newEncryptedWallets);

      return;
    } catch (error) {
      throw new Error('Failed to change PIN: ' + error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isInitialized,
        currentWallet,
        wallets,
        login,
        logout,
        resetWallet,
        initializeWallet,
        importWallet,
        addWallet,
        removeWallet,
        switchWallet,
        toggleFavorite,
        changePin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };