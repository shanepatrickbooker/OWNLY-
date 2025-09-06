import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme as useSystemColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useSystemColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoaded, setIsLoaded] = useState(false);

  // Resolve the actual theme based on mode and system preference
  const resolvedTheme: ResolvedTheme = 
    themeMode === 'system' 
      ? (systemColorScheme || 'light') as ResolvedTheme
      : themeMode as ResolvedTheme;

  const isDark = resolvedTheme === 'dark';

  // Load theme preference on app start
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('dark_mode');
        if (savedMode === 'true') {
          setThemeModeState('dark');
        } else if (savedMode === 'false') {
          setThemeModeState('light');
        } else {
          // If no preference saved, use system
          setThemeModeState('system');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
        setThemeModeState('system');
      } finally {
        setIsLoaded(true);
      }
    };

    loadThemePreference();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      if (mode === 'system') {
        await AsyncStorage.removeItem('dark_mode');
      } else {
        await AsyncStorage.setItem('dark_mode', mode === 'dark' ? 'true' : 'false');
      }
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Don't render until theme preference is loaded
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider 
      value={{
        themeMode,
        resolvedTheme,
        setThemeMode,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}