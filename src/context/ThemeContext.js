// src/context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // localStorage'dan tema tercihini al, yoksa varsayılan olarak dark kullan
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true; // Varsayılan dark mode
  });

  // Tema değiştiğinde localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Material-UI temasını oluştur
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#1565c0',
      },
      secondary: {
        main: '#9c27b0',
        light: '#ba68c8',
        dark: '#7b1fa2',
      },
      background: {
        default: darkMode ? '#1a1a1a' : '#f5f5f5',
        paper: darkMode ? '#2d2d2d' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#ffffff' : '#000000',
        secondary: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
      },
      ...(darkMode ? {
        // Dark mode özel renkleri
        divider: 'rgba(255,255,255,0.12)',
        action: {
          hover: 'rgba(255,255,255,0.08)',
          selected: 'rgba(255,255,255,0.12)',
        }
      } : {
        // Light mode özel renkleri
        divider: 'rgba(0,0,0,0.12)',
        action: {
          hover: 'rgba(0,0,0,0.04)',
          selected: 'rgba(0,0,0,0.08)',
        }
      })
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 600 },
      h2: { fontWeight: 600 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      // Component özelleştirmeleri
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            borderRadius: 12,
            boxShadow: darkMode 
              ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
              : '0 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  const value = {
    darkMode,
    toggleTheme,
    theme
  };

  return (
    <ThemeContext.Provider value={value}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};