import { useState, ReactNode } from 'react';
import { AuthContext, ImportWalletParams } from './authContextTypes';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(
    localStorage.getItem('wallet_initialized') === 'true'
  );

  const login = async (password: string) => {
    // Dummy authentication
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    if (password.length < 8) {
      throw new Error('Invalid password');
    }
    setIsAuthenticated(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const resetWallet = () => {
    // Clear all wallet data from localStorage
    localStorage.removeItem('wallet_initialized');
    // Add any other wallet-related data that needs to be cleared
    setIsInitialized(false);
    setIsAuthenticated(false);
  };

  const initializeWallet = async (password: string, confirmPassword: string) => {
    // Dummy initialization
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    if (password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    localStorage.setItem('wallet_initialized', 'true');
    setIsInitialized(true);
    setIsAuthenticated(true);
  };

  const importWallet = async (params: ImportWalletParams) => {
    // Dummy import
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

    if (params.password !== params.confirmPassword) {
      throw new Error('Passwords do not match');
    }
    if (params.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (params.type === 'seed') {
      if (!params.seedPhrase) {
        throw new Error('Seed phrase is required');
      }
      const words = params.seedPhrase.trim().split(/\s+/);
      if (words.length !== 12 && words.length !== 24) {
        throw new Error('Invalid seed phrase length. Must be 12 or 24 words');
      }
    } else {
      if (!params.privateKey) {
        throw new Error('Private key is required');
      }
      if (params.privateKey.length < 64) {
        throw new Error('Invalid private key length');
      }
    }

    localStorage.setItem('wallet_initialized', 'true');
    setIsInitialized(true);
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isInitialized,
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