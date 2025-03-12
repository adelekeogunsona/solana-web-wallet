import { createContext } from 'react';

export interface WalletData {
  id: string;
  name?: string;
  mnemonic?: string;
  privateKey: string;
  publicKey: string;
  isFavorite?: boolean;
  lastUsed?: string;
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
  login: (pin: string) => Promise<void>;
  logout: () => void;
  resetWallet: () => void;
  initializeWallet: (pin: string, confirmPin: string) => Promise<void>;
  importWallet: (params: ImportWalletParams) => Promise<void>;
  addWallet: (params: ImportWalletParams) => Promise<void>;
  removeWallet: (walletId: string) => Promise<void>;
  switchWallet: (walletId: string) => void;
  changePin: (currentPin: string, newPin: string) => Promise<void>;
  toggleFavorite: (walletId: string) => Promise<void>;
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
  changePin: async () => {},
  toggleFavorite: async () => {},
});