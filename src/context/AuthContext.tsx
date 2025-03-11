import { useState, ReactNode } from 'react';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(
    localStorage.getItem('wallet_initialized') === 'true'
  );
  const [currentWallet, setCurrentWallet] = useState<WalletData | null>(null);

  console.log('currentWallet', currentWallet);

  const login = async (password: string) => {
    try {
      const encryptedData = getStoredWalletData();
      if (!encryptedData) {
        throw new Error('No wallet data found');
      }

      const decryptedData = await decryptWalletData(encryptedData, password);
      const walletData: WalletData = JSON.parse(decryptedData);
      setCurrentWallet(walletData);
      setIsAuthenticated(true);
    } catch (error) {
      throw new Error('Invalid password or corrupted wallet data: ' + error);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentWallet(null);
  };

  const resetWallet = () => {
    localStorage.removeItem('wallet_initialized');
    localStorage.removeItem('wallet_data');
    setIsInitialized(false);
    setIsAuthenticated(false);
    setCurrentWallet(null);
  };

  const initializeWallet = async (password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
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

      const encryptedData = await encryptWalletData(JSON.stringify(walletData), password);
      storeWalletData(encryptedData);
      localStorage.setItem('wallet_initialized', 'true');

      setCurrentWallet(walletData);
      setIsInitialized(true);
      setIsAuthenticated(true);
    } catch (error) {
      throw new Error('Failed to create wallet: ' + error);
    }
  };

  const importWallet = async (params: ImportWalletParams) => {
    if (params.password !== params.confirmPassword) {
      throw new Error('Passwords do not match');
    }
    if (params.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
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