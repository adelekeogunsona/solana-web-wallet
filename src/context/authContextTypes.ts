import { createContext } from 'react';

export interface ImportWalletParams {
  type: 'seed' | 'private-key';
  seedPhrase?: string;
  privateKey?: string;
  password: string;
  confirmPassword: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (password: string) => Promise<void>;
  logout: () => void;
  initializeWallet: (password: string, confirmPassword: string) => Promise<void>;
  importWallet: (params: ImportWalletParams) => Promise<void>;
  resetWallet: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);