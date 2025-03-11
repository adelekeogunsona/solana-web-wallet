import { createContext } from 'react';

export interface WalletData {
  mnemonic?: string;
  privateKey: string;
  publicKey: string;
}

export interface ImportWalletParams {
  type: 'seed' | 'private';
  seedPhrase?: string;
  privateKey?: string;
  password: string;
  confirmPassword: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isInitialized: boolean;
  currentWallet: WalletData | null;
  login: (password: string) => Promise<void>;
  logout: () => void;
  initializeWallet: (password: string, confirmPassword: string) => Promise<void>;
  importWallet: (params: ImportWalletParams) => Promise<void>;
  resetWallet: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isInitialized: false,
  currentWallet: null,
  login: async () => {},
  logout: () => {},
  initializeWallet: async () => {},
  importWallet: async () => {},
  resetWallet: () => {},
});