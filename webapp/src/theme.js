import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Google Blue
    },
    secondary: {
      main: '#ea4335', // Google Red
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#3c4043',
      secondary: '#70757a',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 400,
      fontSize: '22px',
      color: '#5f6368',
    },
    button: {
      textTransform: 'none', // Google buttons are usually not all-caps
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '24px', // Rounded buttons
          padding: '8px 24px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#5f6368',
          boxShadow: 'inset 0 -1px 0 0 #dadce0', // Subtle border bottom
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
        },
      },
    },
  },
});

export default theme;
