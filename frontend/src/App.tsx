import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Alert, Snackbar } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NoteEditor from './pages/NoteEditor';
import Search from './pages/Search';
import Flashcards from './pages/Flashcards';
import { AppProvider } from './context/AppContext';
import { api } from './services/api';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6200EA',
      light: '#B388FF',
      dark: '#4A148C',
    },
    secondary: {
      main: '#00BFA5',
      light: '#64FFDA',
      dark: '#008E76',
    },
    background: {
      default: '#F5F7FA',
      paper: '#ffffff',
    },
    text: {
      primary: '#2D3748',
      secondary: '#718096',
    },
  },
  typography: {
    fontFamily: '"Inter", "Poppins", "Roboto", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: '-0.5px',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '-0.3px',
    },
    button: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          padding: '10px 20px',
          fontWeight: 500,
          boxShadow: 'none',
        },
        contained: {
          boxShadow: '0 4px 14px 0 rgba(98, 0, 234, 0.2)',
        },
        containedSecondary: {
          boxShadow: '0 4px 14px 0 rgba(0, 191, 165, 0.2)',
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          borderRadius: 16,
          border: '1px solid rgba(0,0,0,0.05)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          background: 'linear-gradient(90deg, #6200EA 0%, #7C4DFF 100%)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
    },
  },
});

function App() {
  const [backendConnected, setBackendConnected] = useState(true);

  useEffect(() => {
    // Check if backend API is available
    const checkBackendConnection = async () => {
      try {
        const isConnected = await api.healthCheck();
        setBackendConnected(isConnected);
        
        if (!isConnected) {
          console.error('Backend API is not available. Some features may not work.');
        }
      } catch (error) {
        console.error('Error checking backend connection:', error);
        setBackendConnected(false);
      }
    };

    checkBackendConnection();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/editor" element={<NoteEditor />} />
              <Route path="/search" element={<Search />} />
              <Route path="/flashcards" element={<Flashcards />} />
            </Routes>
          </Layout>
        </Router>
      </AppProvider>
      
      <Snackbar 
        open={!backendConnected} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 90, sm: 16 } }}
      >
        <Alert severity="warning" sx={{ width: '100%' }}>
          Cannot connect to backend services. Some features might not work properly.
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App; 