import { useState, useEffect, ReactNode } from 'react';
import { Settings, defaultSettings } from './settingsTypes';
import { SettingsContext } from './settingsContext';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem('wallet_settings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('wallet_settings', JSON.stringify(settings));
  }, [settings]);

  const addRpcEndpoint = (endpoint: string) => {
    if (!settings.rpcEndpoints.includes(endpoint)) {
      setSettings(prev => ({
        ...prev,
        rpcEndpoints: [...prev.rpcEndpoints, endpoint],
      }));
    }
  };

  const removeRpcEndpoint = (endpoint: string) => {
    if (settings.rpcEndpoints.length > 1) {
      setSettings(prev => ({
        ...prev,
        rpcEndpoints: prev.rpcEndpoints.filter(e => e !== endpoint),
      }));
    }
  };

  const setBalanceReloadInterval = (interval: number) => {
    setSettings(prev => ({
      ...prev,
      balanceReloadInterval: interval,
    }));
  };

  const setAutoLogoutDuration = (duration: number) => {
    setSettings(prev => ({
      ...prev,
      autoLogoutDuration: duration,
    }));
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        addRpcEndpoint,
        removeRpcEndpoint,
        setBalanceReloadInterval,
        setAutoLogoutDuration,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}