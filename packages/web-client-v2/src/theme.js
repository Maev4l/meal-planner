// Edited by Claude.
// Warm Bistro theme - sophisticated yet inviting aesthetic
import { createTheme, alpha } from '@mui/material/styles';

// Custom color palette inspired by French bistro warmth
const palette = {
  burgundy: {
    main: '#722F37',
    light: '#8B4049',
    dark: '#5A252C',
    contrastText: '#FFF8F0',
  },
  cream: {
    main: '#FFF8F0',
    light: '#FFFCF7',
    dark: '#F5EBE0',
  },
  amber: {
    main: '#D4A373',
    light: '#E5C4A1',
    dark: '#B8895C',
  },
  charcoal: {
    main: '#2C2C2C',
    light: '#4A4A4A',
    dark: '#1A1A1A',
  },
  sage: {
    main: '#87A878',
    light: '#A4C396',
    dark: '#6B8C5E',
  },
  terracotta: {
    main: '#C9705E',
    light: '#D99485',
    dark: '#A65A4A',
  },
};

// Dark mode palette adjustments
const darkPalette = {
  burgundy: {
    main: '#A64D55',
    light: '#C06B73',
    dark: '#8B3E45',
    contrastText: '#FFF8F0',
  },
  cream: {
    main: '#2A2420',
    light: '#3A332E',
    dark: '#1F1A17',
  },
  amber: {
    main: '#D4A373',
    light: '#E5C4A1',
    dark: '#B8895C',
  },
  charcoal: {
    main: '#F5EBE0',
    light: '#FFFCF7',
    dark: '#E8DED3',
  },
  sage: {
    main: '#9DBF8E',
    light: '#B5D4A8',
    dark: '#85A776',
  },
  terracotta: {
    main: '#D98575',
    light: '#E9A698',
    dark: '#C96B5A',
  },
};

export const createAppTheme = (prefersDarkMode) => {
  const colors = prefersDarkMode ? darkPalette : palette;

  return createTheme({
    palette: {
      mode: prefersDarkMode ? 'dark' : 'light',
      primary: {
        main: colors.burgundy.main,
        light: colors.burgundy.light,
        dark: colors.burgundy.dark,
        contrastText: colors.burgundy.contrastText,
      },
      secondary: {
        main: colors.amber.main,
        light: colors.amber.light,
        dark: colors.amber.dark,
      },
      success: {
        main: colors.sage.main,
        light: colors.sage.light,
        dark: colors.sage.dark,
      },
      error: {
        main: colors.terracotta.main,
        light: colors.terracotta.light,
        dark: colors.terracotta.dark,
      },
      background: {
        default: prefersDarkMode ? '#1A1612' : colors.cream.main,
        paper: prefersDarkMode ? '#2A2420' : '#FFFFFF',
      },
      text: {
        primary: colors.charcoal.main,
        secondary: alpha(colors.charcoal.main, 0.7),
      },
      divider: alpha(colors.charcoal.main, 0.1),
      // Custom colors accessible via theme.palette
      burgundy: colors.burgundy,
      cream: colors.cream,
      amber: colors.amber,
      charcoal: colors.charcoal,
      sage: colors.sage,
      terracotta: colors.terracotta,
    },
    typography: {
      fontFamily: '"DM Sans", "Helvetica Neue", Arial, sans-serif',
      h1: {
        fontFamily: '"Playfair Display", Georgia, serif',
        fontWeight: 600,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontFamily: '"Playfair Display", Georgia, serif',
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontFamily: '"Playfair Display", Georgia, serif',
        fontWeight: 600,
      },
      h4: {
        fontFamily: '"Playfair Display", Georgia, serif',
        fontWeight: 500,
      },
      h5: {
        fontFamily: '"Playfair Display", Georgia, serif',
        fontWeight: 500,
      },
      h6: {
        fontFamily: '"DM Sans", "Helvetica Neue", Arial, sans-serif',
        fontWeight: 600,
        letterSpacing: '0.02em',
      },
      subtitle1: {
        fontWeight: 500,
        letterSpacing: '0.01em',
      },
      subtitle2: {
        fontWeight: 600,
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
        fontSize: '0.75rem',
      },
      body1: {
        lineHeight: 1.6,
      },
      body2: {
        lineHeight: 1.5,
      },
      button: {
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 16,
    },
    shadows: [
      'none',
      `0 2px 8px ${alpha(colors.charcoal.main, 0.04)}`,
      `0 4px 16px ${alpha(colors.charcoal.main, 0.06)}`,
      `0 8px 24px ${alpha(colors.charcoal.main, 0.08)}`,
      `0 12px 32px ${alpha(colors.charcoal.main, 0.1)}`,
      `0 16px 40px ${alpha(colors.charcoal.main, 0.12)}`,
      ...Array(19).fill(`0 16px 40px ${alpha(colors.charcoal.main, 0.12)}`),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          // Import Google Fonts
          '@import': [
            "url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Playfair+Display:wght@400;500;600;700&display=swap')",
          ].join(', '),
          // Dynamic viewport height for virtual keyboard support
          ':root': {
            '--vh-full': '100dvh',
            '--vh-with-nav': 'calc(100dvh - 68px)',
          },
          // Fallback for browsers without dvh support
          '@supports not (height: 100dvh)': {
            ':root': {
              '--vh-full': '100vh',
              '--vh-with-nav': 'calc(100vh - 68px)',
            },
          },
          html: {
            scrollBehavior: 'smooth',
          },
          body: {
            // Subtle grain texture overlay using CSS
            backgroundImage: prefersDarkMode
              ? 'none'
              : `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            backgroundBlendMode: 'overlay',
          },
          // Custom scrollbar styling
          '*::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '*::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '*::-webkit-scrollbar-thumb': {
            background: alpha(colors.charcoal.main, 0.2),
            borderRadius: '4px',
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: alpha(colors.charcoal.main, 0.3),
          },
          // Animations
          '@keyframes fadeInUp': {
            from: {
              opacity: 0,
              transform: 'translateY(20px)',
            },
            to: {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
          '@keyframes fadeIn': {
            from: { opacity: 0 },
            to: { opacity: 1 },
          },
          '@keyframes scaleIn': {
            from: {
              opacity: 0,
              transform: 'scale(0.95)',
            },
            to: {
              opacity: 1,
              transform: 'scale(1)',
            },
          },
          '@keyframes shimmer': {
            '0%': { backgroundPosition: '-200% 0' },
            '100%': { backgroundPosition: '200% 0' },
          },
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.5 },
          },
          '.animate-fade-in-up': {
            animation: 'fadeInUp 0.5s ease-out forwards',
          },
          '.animate-fade-in': {
            animation: 'fadeIn 0.3s ease-out forwards',
          },
          '.animate-scale-in': {
            animation: 'scaleIn 0.3s ease-out forwards',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: `linear-gradient(135deg, ${colors.burgundy.main} 0%, ${colors.burgundy.dark} 100%)`,
            boxShadow: `0 4px 20px ${alpha(colors.burgundy.main, 0.3)}`,
            borderRadius: 0, // Override Paper's rounded corners
            border: 'none', // Override Paper's border
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            minHeight: '64px !important',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: '12px 24px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-1px)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          },
          contained: {
            boxShadow: `0 4px 14px ${alpha(colors.burgundy.main, 0.25)}`,
            '&:hover': {
              boxShadow: `0 6px 20px ${alpha(colors.burgundy.main, 0.35)}`,
            },
          },
          outlined: {
            borderWidth: 2,
            '&:hover': {
              borderWidth: 2,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            transition: 'all 0.3s ease-in-out',
            border: `1px solid ${alpha(colors.charcoal.main, 0.06)}`,
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: `0 12px 32px ${alpha(colors.charcoal.main, 0.12)}`,
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            border: `1px solid ${alpha(colors.charcoal.main, 0.06)}`,
          },
          elevation2: {
            boxShadow: `0 4px 20px ${alpha(colors.charcoal.main, 0.08)}`,
          },
          elevation3: {
            boxShadow: `0 8px 32px ${alpha(colors.charcoal.main, 0.1)}`,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.amber.main,
                },
              },
              '&.Mui-focused': {
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: colors.burgundy.main,
                  borderWidth: 2,
                },
              },
            },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            width: 52,
            height: 32,
            padding: 0,
          },
          switchBase: {
            padding: 4,
            '&.Mui-checked': {
              transform: 'translateX(20px)',
              color: '#fff',
              '& + .MuiSwitch-track': {
                backgroundColor: colors.sage.main,
                opacity: 1,
                border: 0,
              },
            },
            '&:not(.Mui-checked)': {
              color: '#fff',
              '& + .MuiSwitch-track': {
                backgroundColor: colors.terracotta.main,
                opacity: 1,
              },
            },
          },
          thumb: {
            width: 24,
            height: 24,
            boxShadow: `0 2px 6px ${alpha(colors.charcoal.main, 0.2)}`,
          },
          track: {
            borderRadius: 16,
            transition: 'background-color 0.2s ease-in-out',
          },
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          root: {
            backgroundColor: alpha(colors.charcoal.main, 0.04),
            borderRadius: 12,
            padding: 4,
            border: 'none',
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            border: 'none',
            borderRadius: '10px !important',
            padding: '8px 20px',
            textTransform: 'none',
            fontWeight: 500,
            color: colors.charcoal.main,
            transition: 'all 0.2s ease-in-out',
            '&.Mui-selected': {
              backgroundColor: colors.burgundy.main,
              color: '#fff',
              boxShadow: `0 2px 8px ${alpha(colors.burgundy.main, 0.3)}`,
              '&:hover': {
                backgroundColor: colors.burgundy.light,
              },
            },
            '&:hover': {
              backgroundColor: alpha(colors.charcoal.main, 0.08),
            },
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: prefersDarkMode ? '#2A2420' : '#FFFFFF',
            borderTop: `1px solid ${alpha(colors.charcoal.main, 0.08)}`,
            height: 68,
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            color: alpha(colors.charcoal.main, 0.5),
            '&.Mui-selected': {
              color: colors.burgundy.main,
            },
            transition: 'all 0.2s ease-in-out',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: alpha(colors.charcoal.main, 0.08),
              transform: 'scale(1.05)',
            },
            '&:active': {
              transform: 'scale(0.95)',
            },
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
      MuiSnackbar: {
        styleOverrides: {
          root: {
            '& .MuiSnackbarContent-root': {
              borderRadius: 12,
              backgroundColor: colors.charcoal.main,
            },
          },
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          root: {
            color: colors.burgundy.main,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: alpha(colors.charcoal.main, 0.08),
          },
        },
      },
    },
  });
};
