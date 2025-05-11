import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Alert, Snackbar, responsiveFontSizes, Button } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { useEffect, useState, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NoteEditor from './pages/NoteEditor';
import Search from './pages/Search';
import Flashcards from './pages/Flashcards';
import { AppProvider, useApp } from './context/AppContext';
import { api, API_BASE_URL } from './services/api';

// Add MOCK_DATA definition for offline mode
const MOCK_DATA = {
  notes: [
    {
      id: "1",
      title: "Machine Learning Basics",
      content: "<p>Introduction to machine learning concepts including supervised and unsupervised learning.</p>",
      summary: "An overview of fundamental machine learning concepts and approaches.",
      tags: ["ML", "AI", "data science"],
      created_at: "2023-10-15T14:30:00.000Z",
      updated_at: "2023-10-15T15:45:00.000Z"
    },
    {
      id: "2",
      title: "Python Programming Tips",
      content: "<p>Useful Python programming techniques and best practices.</p>",
      summary: "A collection of advanced Python tips for better code quality.",
      tags: ["Python", "programming", "tips"],
      created_at: "2023-10-16T10:15:00.000Z",
      updated_at: "2023-10-16T11:30:00.000Z"
    }
  ],
  flashcards: [
    {
      id: "1",
      title: "Machine Learning",
      question: "What is supervised learning?",
      answer: "A type of machine learning where the model is trained on labeled data and learns to predict outputs based on inputs.",
      tags: ["ML", "AI"],
      created_at: "2023-10-15T16:00:00.000Z"
    },
    {
      id: "2",
      title: "Python",
      question: "What are list comprehensions in Python?",
      answer: "A concise way to create lists based on existing lists or iterables. Example: [x*2 for x in range(10)]",
      tags: ["Python", "programming"],
      created_at: "2023-10-16T12:00:00.000Z"
    }
  ]
};

// Create theme creator function
const createAppTheme = (mode: 'light' | 'dark') => {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#3d7be5',
        light: '#62a0ff',
        dark: '#2c5cb2',
      },
      secondary: {
        main: '#ff7d4d', // Warmer orange accent
        light: '#ffa07a',
        dark: '#e55e2c',
      },
      background: {
        default: mode === 'dark' ? '#0f172a' : '#f5f8ff', // Adjusted for light mode
        paper: mode === 'dark' ? '#1e293b' : '#ffffff',   // Adjusted for light mode
      },
      text: {
        primary: mode === 'dark' ? '#f0f9ff' : '#1e293b', // Adjusted for light mode
        secondary: mode === 'dark' ? '#94a3b8' : '#64748b', // Adjusted for light mode
      },
      error: {
        main: '#ef4444',
        light: '#f87171',
      },
      warning: {
        main: '#f59e0b',
        light: '#fbbf24',
      },
      info: {
        main: '#3b82f6',
        light: '#60a5fa',
      },
      success: {
        main: '#10b981',
        light: '#34d399',
      },
    },
    typography: {
      fontFamily: '"Inter", "Poppins", "Roboto", sans-serif',
      h1: {
        fontWeight: 800,
        letterSpacing: '-0.025em',
      },
      h2: {
        fontWeight: 700,
        letterSpacing: '-0.025em',
      },
      h3: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h4: {
        fontWeight: 700,
        letterSpacing: '-0.015em',
      },
      h5: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h6: {
        fontWeight: 600,
        letterSpacing: '-0.005em',
      },
      button: {
        fontWeight: 500,
        letterSpacing: '0.01em',
      },
      body1: {
        letterSpacing: '0.00938em',
        lineHeight: 1.6,
      },
      body2: {
        letterSpacing: '0.00938em',
        lineHeight: 1.6,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: `
          body {
            background-image: ${mode === 'dark' 
              ? 'radial-gradient(circle at 80% 90%, rgba(99, 102, 241, 0.15) 0%, transparent 48%), radial-gradient(circle at 20% 20%, rgba(79, 70, 229, 0.2) 0%, transparent 58%)'
              : 'radial-gradient(circle at 80% 90%, rgba(99, 102, 241, 0.08) 0%, transparent 48%), radial-gradient(circle at 20% 20%, rgba(79, 70, 229, 0.08) 0%, transparent 58%)'
            };
            background-attachment: fixed;
            background-size: cover;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            scrollbar-width: thin;
            scrollbar-color: ${mode === 'dark' ? '#3d7be5 #1e293b' : '#3d7be5 #f0f9ff'};
          }
          
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: ${mode === 'dark' ? '#1e293b' : '#f0f9ff'};
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: ${mode === 'dark' ? '#334155' : '#cbd5e1'};
            border-radius: 4px;
            border: 2px solid ${mode === 'dark' ? '#1e293b' : '#f0f9ff'};
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #3d7be5;
          }
          
          ::selection {
            background-color: rgba(61, 123, 229, 0.4);
            color: ${mode === 'dark' ? '#f0f9ff' : '#1e293b'};
          }
        `,
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 12,
            padding: '10px 20px',
            fontWeight: 500,
            boxShadow: 'none',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
              transition: 'all 0.6s ease',
            },
            '&:hover::before': {
              left: '100%',
            },
          },
          contained: {
            boxShadow: '0 4px 14px 0 rgba(61, 123, 229, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 20px 0 rgba(61, 123, 229, 0.5)',
              transform: 'translateY(-2px)',
            },
          },
          containedSecondary: {
            boxShadow: '0 4px 14px 0 rgba(255, 125, 77, 0.3)',
            '&:hover': {
              boxShadow: '0 6px 20px 0 rgba(255, 125, 77, 0.5)',
              transform: 'translateY(-2px)',
            },
          },
          outlined: {
            borderWidth: '1.5px',
            '&:hover': {
              borderWidth: '1.5px',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px 0 rgba(61, 123, 229, 0.2)',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: mode === 'dark' ? '0 8px 20px rgba(0,0,0,0.25)' : '0 8px 20px rgba(0,0,0,0.1)',
            borderRadius: 16,
            border: mode === 'dark' ? '1px solid #2a3a5a' : '1px solid #e2e8f0',
            backgroundColor: mode === 'dark' ? '#1e293b' : '#ffffff',
            backgroundImage: mode === 'dark' 
              ? 'linear-gradient(to bottom right, rgba(255,255,255,0.03) 0%, transparent 40%)'
              : 'linear-gradient(to bottom right, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 40%)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            '&:hover': {
              boxShadow: mode === 'dark' ? '0 12px 28px rgba(0,0,0,0.35)' : '0 12px 28px rgba(0,0,0,0.1)',
              transform: 'translateY(-4px)',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(45deg, transparent 98%, #3d7be5)',
              opacity: mode === 'dark' ? 0.4 : 0.2,
            }
          },
        },
      },
    },
  });
};

// Apply responsive fonts to theme
const theme = responsiveFontSizes(createAppTheme('dark'));

// Separate component to handle data loading
const DataLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [backendReady, setBackendReady] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { state, dispatch } = useApp();

  // Initial data loading from localStorage and backend
  useEffect(() => {
    // Load data from localStorage first (already done in AppContext)
    
    // Then try to fetch from backend
    const initializeData = async () => {
      try {
        console.log('Attempting to load notes from backend database...');
        const connected = await api.checkConnection();
        
        if (connected) {
          setBackendReady(true);
          const healthResponse = await api.healthCheck();
          
          if (healthResponse && healthResponse.status === 'healthy') {
            // Fetch notes and flashcards from backend
            const notesResponse = await api.getNotes();
            const flashcardsResponse = await api.getFlashcards();
            
            if (notesResponse.data) {
              console.log(`Loaded ${notesResponse.data.length} notes from backend database`);
              // Use SET_NOTES to replace any notes loaded from localStorage
              if (notesResponse.data.length > 0) {
                dispatch({ type: 'SET_NOTES', payload: notesResponse.data });
              }
            } else if (notesResponse.error) {
              console.error('Error loading notes from backend:', notesResponse.error);
            }
            
            if (flashcardsResponse.data) {
              console.log(`Loaded ${flashcardsResponse.data.length} flashcards from backend database`);
              // Use SET_FLASHCARDS to replace any flashcards loaded from localStorage
              if (flashcardsResponse.data.length > 0) {
                dispatch({ type: 'SET_FLASHCARDS', payload: flashcardsResponse.data });
              }
            } else if (flashcardsResponse.error) {
              console.error('Error loading flashcards from backend:', flashcardsResponse.error);
            }
          } else {
            console.warn('Backend health check failed, using data from localStorage');
          }
        } else {
          console.warn('Backend not connected, using data from localStorage');
          setBackendReady(false);
          if (retryCount >= 2) {
            setShowNotification(true);
            api.enableMockMode();
          }
        }
      } catch (error) {
        console.error('Failed to initialize data from backend:', error);
        setBackendReady(false);
        if (retryCount >= 2) {
          setShowNotification(true);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, [dispatch, retryCount]);
  
  const fetchNotesAndFlashcards = useCallback(async () => {
    try {
      // Only try to fetch from backend if it's available
      const notesResponse = await api.getNotes();
      const flashcardsResponse = await api.getFlashcards();
      
      if (notesResponse.data && !notesResponse.error) {
        dispatch({ type: 'SET_NOTES', payload: notesResponse.data });
      }
      
      if (flashcardsResponse.data && !flashcardsResponse.error) {
        dispatch({ type: 'SET_FLASHCARDS', payload: flashcardsResponse.data });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [dispatch]);
  
  useEffect(() => {
    let isMounted = true;
    
    const checkBackendStatus = async () => {
      if (!isMounted) return;
      
      try {
        const connected = await api.checkConnection();
        
        if (connected) {
          setBackendReady(true);
          setShowNotification(false);
          
          const healthResponse = await api.healthCheck();
          if (healthResponse && healthResponse.status === 'healthy') {
            await fetchNotesAndFlashcards();
          }
        } else {
          setBackendReady(false);
          if (retryCount >= 2) {
            setShowNotification(true);
            api.enableMockMode();
            // We don't need to load mock data here because AppContext already loaded from localStorage
          }
        }
      } catch (error) {
        console.error('Failed to check backend connectivity:', error);
        setBackendReady(false);
        if (retryCount >= 2) {
          setShowNotification(true);
        }
      }
    };
    
    // Check periodically (every 30 seconds)
    const interval = setInterval(checkBackendStatus, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchNotesAndFlashcards, retryCount]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: 'inherit'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading your notes...</h2>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
      <Snackbar 
        open={showNotification && !backendReady} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        autoHideDuration={null}
        sx={{
          boxShadow: 'none',
          '& .MuiPaper-root': {
            backgroundColor: 'error.main',
          }
        }}
      >
        <Alert 
          severity="error" 
          variant="standard"
          onClose={() => setShowNotification(false)}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={() => {
                setRetryCount(prev => prev + 1);
                api.checkConnection().then(connected => {
                  if (connected) {
                    setBackendReady(true);
                    fetchNotesAndFlashcards();
                  }
                });
              }}
            >
              Retry
            </Button>
          }
          sx={{ width: '100%', boxShadow: 'none' }}
        >
          Cannot connect to backend services. Some features might not work properly.
        </Alert>
      </Snackbar>
    </>
  );
};

// Main App component
const App = () => {
  // State for theme mode
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  
  // Effect to load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setThemeMode(savedTheme);
    }
  }, []);
  
  // Function to toggle theme
  const toggleThemeMode = () => {
    const newMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };
  
  // Create theme based on current mode
  const currentTheme = responsiveFontSizes(createAppTheme(themeMode));

  return (
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
      <AppProvider>
        <DataLoader>
          <Router>
            <Layout toggleThemeMode={toggleThemeMode} themeMode={themeMode}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/editor" element={<NoteEditor />} />
                <Route path="/search" element={<Search />} />
                <Route path="/flashcards" element={<Flashcards />} />
              </Routes>
            </Layout>
          </Router>
        </DataLoader>
      </AppProvider>
    </ThemeProvider>
  );
};

export default App; 