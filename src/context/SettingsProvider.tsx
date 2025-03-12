import { useState, useEffect, ReactNode } from 'react';
import { Settings, defaultSettings, Theme } from './settingsTypes';
import { SettingsContext } from './settingsContext';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem('wallet_settings');
    return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
  });

  // Handle theme changes
  useEffect(() => {
    const handleThemeChange = (e: MediaQueryListEvent) => {
      if (settings.theme === 'system') {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };

    const applyTheme = () => {
      const isDark = settings.theme === 'dark' ||
        (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      document.documentElement.classList.toggle('dark', isDark);
    };

    // Apply theme immediately
    applyTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', handleThemeChange);

    return () => mediaQuery.removeEventListener('change', handleThemeChange);
  }, [settings.theme]);

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

  const setTheme = (theme: Theme) => {
    setSettings(prev => ({
      ...prev,
      theme,
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
        setTheme,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}