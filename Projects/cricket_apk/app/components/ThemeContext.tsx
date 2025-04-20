import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

// Define our theme types
export type ThemeType = 'light' | 'dark';

// Define our theme colors
export const LightColors = {
  primary: '#008475',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#F5F5F5',
  lightGray: '#E0E0E0',
  red: '#FF0000',
  green: '#4CAF50',
  liveRed: '#FF0000',
  favoriteGreen: '#4CAF50',
  favoriteRed: '#FF3B30',
  background: '#FFFFFF',
  text: '#000000',
  cardBackground: '#FFFFFF',
  overlayBackground: 'rgba(0, 0, 0, 0.5)',
  iconBackground: 'rgba(255, 255, 255, 0.2)',
};

// Define dark theme colors
export const DarkColors = {
  primary: '#00A693', // Slightly lighter for dark mode
  white: '#FFFFFF',
  black: '#000000',
  gray: '#2C2C2C',
  lightGray: '#3D3D3D',
  red: '#FF0000',
  green: '#4CAF50',
  liveRed: '#FF0000',
  favoriteGreen: '#4CAF50',
  favoriteRed: '#FF3B30',
  background: '#121212',
  text: '#FFFFFF',
  cardBackground: '#1E1E1E',
  overlayBackground: 'rgba(0, 0, 0, 0.7)',
  iconBackground: 'rgba(255, 255, 255, 0.15)',
};


export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 50,
};

// Create the theme context
type ThemeContextType = {
  theme: ThemeType;
  colors: typeof LightColors;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  colors: LightColors,
  toggleTheme: () => {},
});

// Create the theme provider component
export const ThemeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // Get system theme
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>(systemColorScheme === 'dark' ? 'dark' : 'light');
  
  // Update theme when system theme changes
  useEffect(() => {
    setTheme(systemColorScheme === 'dark' ? 'dark' : 'light');
  }, [systemColorScheme]);
  
  const colors = theme === 'light' ? LightColors : DarkColors;
  
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };
  
  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Create a hook for using the theme
export const useTheme = () => useContext(ThemeContext);