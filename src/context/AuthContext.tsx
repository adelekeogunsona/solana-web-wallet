import { useState, ReactNode, useEffect } from 'react';
import { AuthContext, ImportWalletParams, WalletData } from './authContextTypes';
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

const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(
    localStorage.getItem('wallet_initialized') === 'true'
  );
  const [currentWallet, setCurrentWallet] = useState<WalletData | null>(null);

  // Check session validity on component mount and after any authentication state change
  useEffect(() => {
    const checkSession = () => {
      const sessionTimestamp = localStorage.getItem('session_timestamp');
      const encryptedWallet = localStorage.getItem('encrypted_wallet');

      if (sessionTimestamp && encryptedWallet) {
        const now = Date.now();
        const lastActivity = parseInt(sessionTimestamp, 10);

        if (now - lastActivity < SESSION_TIMEOUT) {
          // Session is still valid
          const walletData: WalletData = JSON.parse(encryptedWallet);
          setCurrentWallet(walletData);
          setIsAuthenticated(true);
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
  }, []);

  const handleSessionExpiry = () => {
    localStorage.removeItem('session_timestamp');
    localStorage.removeItem('encrypted_wallet');
    setIsAuthenticated(false);
    setCurrentWallet(null);
  };

  const updateSessionTimestamp = (wallet: WalletData) => {
    localStorage.setItem('session_timestamp', Date.now().toString());
    localStorage.setItem('encrypted_wallet', JSON.stringify(wallet));
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
      const walletData: WalletData = JSON.parse(decryptedData);
      setCurrentWallet(walletData);
      setIsAuthenticated(true);
      updateSessionTimestamp(walletData);
    } catch (error) {
      throw new Error('Invalid PIN or corrupted wallet data: ' + error);
    }
  };

  const logout = () => {
    handleSessionExpiry();
  };

  const resetWallet = () => {
    localStorage.removeItem('wallet_initialized');
    localStorage.removeItem('wallet_data');
    localStorage.removeItem('session_timestamp');
    localStorage.removeItem('encrypted_wallet');
    setIsInitialized(false);
    setIsAuthenticated(false);
    setCurrentWallet(null);
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
        mnemonic,
        privateKey: uint8ArrayToHex(keypair.secretKey),
        publicKey: keypair.publicKey.toBase58()
      };

      // Store the mnemonic temporarily for the next step
      localStorage.setItem('temp_wallet_data', JSON.stringify({ mnemonic }));

      const encryptedData = await encryptWalletData(JSON.stringify(walletData), pin);
      storeWalletData(encryptedData);
      localStorage.setItem('wallet_initialized', 'true');

      setCurrentWallet(walletData);
      setIsInitialized(true);
      setIsAuthenticated(true);
      updateSessionTimestamp(walletData);
    } catch (error) {
      throw new Error('Failed to create wallet: ' + error);
    }
  };

  const importWallet = async (params: ImportWalletParams) => {
    if (params.password !== params.confirmPassword) {
      throw new Error('PINs do not match');
    }
    if (params.password.length !== 6 || !/^\d{6}$/.test(params.password)) {
      throw new Error('PIN must be exactly 6 digits');
    }

    try {
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

      const walletData: WalletData = {
        mnemonic,
        privateKey: uint8ArrayToHex(keypair.secretKey),
        publicKey: keypair.publicKey.toBase58()
      };

      const encryptedData = await encryptWalletData(JSON.stringify(walletData), params.password);
      storeWalletData(encryptedData);
      localStorage.setItem('wallet_initialized', 'true');

      setCurrentWallet(walletData);
      setIsInitialized(true);
      setIsAuthenticated(true);
      updateSessionTimestamp(walletData);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to import wallet: ' + error);
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isInitialized,
      currentWallet,
      login,
      logout,
      initializeWallet,
      importWallet,
      resetWallet,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };