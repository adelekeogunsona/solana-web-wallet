import { createContext } from 'react';

export interface WalletData {
  id: string;
  name?: string;
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
  name?: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isInitialized: boolean;
  currentWallet: WalletData | null;
  wallets: WalletData[];
  login: (password: string) => Promise<void>;
  logout: () => void;
  initializeWallet: (password: string, confirmPassword: string) => Promise<void>;
  importWallet: (params: ImportWalletParams) => Promise<void>;
  addWallet: (params: ImportWalletParams) => Promise<void>;
  switchWallet: (walletId: string) => void;
  removeWallet: (walletId: string) => Promise<void>;
  resetWallet: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isInitialized: false,
  currentWallet: null,
  wallets: [],
  login: async () => {},
  logout: () => {},
  initializeWallet: async () => {},
  importWallet: async () => {},
  addWallet: async () => {},
  switchWallet: () => {},
  removeWallet: async () => {},
  resetWallet: () => {},
});