export interface Settings {
  rpcEndpoints: string[];
  balanceReloadInterval: number; // in milliseconds
  autoLogoutDuration: number; // in milliseconds
}

export interface SettingsContextType {
  settings: Settings;
  addRpcEndpoint: (endpoint: string) => void;
  removeRpcEndpoint: (endpoint: string) => void;
  setBalanceReloadInterval: (interval: number) => void;
  setAutoLogoutDuration: (duration: number) => void;
}

export const defaultSettings: Settings = {
  rpcEndpoints: [],
  balanceReloadInterval: 10000, // 10 seconds by default
  autoLogoutDuration: 900000, // 15 minutes by default
};