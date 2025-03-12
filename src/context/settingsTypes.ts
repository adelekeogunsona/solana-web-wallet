export interface Settings {
  rpcEndpoints: string[];
  balanceReloadInterval: number; // in milliseconds
}

export interface SettingsContextType {
  settings: Settings;
  addRpcEndpoint: (endpoint: string) => void;
  removeRpcEndpoint: (endpoint: string) => void;
  setBalanceReloadInterval: (interval: number) => void;
}

export const defaultSettings: Settings = {
  rpcEndpoints: [],
  balanceReloadInterval: 10000, // 10 seconds by default
};