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
  const [backendReady, setBackendReady] = useState<boolean>(false);
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const { dispatch } = useApp();
  
  // Function to fetch notes and flashcards from backend
  const fetchNotesAndFlashcards = useCallback(async () => {
    try {
      // Fetch notes
      const notesResponse = await fetch(`${API_BASE_URL}/notes/`);
      if (notesResponse.ok) {
        const notesData = await notesResponse.json();
        // Transform data to match frontend format and dispatch to context
        const notes = notesData.map((note: any) => ({
          id: note.id,
          title: note.title,
          content: note.content,
          summary: note.summary,
          tags: note.tags,
          createdAt: new Date(note.created_at),
          updatedAt: new Date(note.updated_at)
        }));
        
        dispatch({ type: 'SET_NOTES', payload: notes });
        console.log('Notes loaded:', notes.length);
      }
      
      // Fetch flashcards
      const flashcardsResponse = await fetch(`${API_BASE_URL}/flashcards/`);
      if (flashcardsResponse.ok) {
        const flashcardsData = await flashcardsResponse.json();
        // Transform data to match frontend format and dispatch to context
        const flashcards = flashcardsData.map((card: any) => ({
          id: card.id,
          front: card.question,
          back: card.answer,
          tags: card.tags,
          createdAt: new Date(card.created_at)
        }));
        
        dispatch({ type: 'SET_FLASHCARDS', payload: flashcards });
        console.log('Flashcards loaded:', flashcards.length);
      }
    } catch (error) {
      console.error('Error fetching data from backend:', error);
    }
  }, [dispatch]);
  
  // Close connection notification
  const handleCloseNotification = () => {
    setShowNotification(false);
  };

  // Try to start the backend server
  const startBackendServer = useCallback(async () => {
    // This is just a placeholder - in a real app you'd have a way to start the server
    // or provide instructions to the user on how to start it
    console.log('Attempting to connect to backend...');
    
    // Simply update the UI to show we're retrying
    setRetryCount(prev => prev + 1);
    
    // Check connection again
    const connected = await api.checkConnection();
    if (connected) {
      console.log('Backend connection established on retry');
      setBackendReady(true);
      fetchNotesAndFlashcards();
    } else {
      console.error('Backend still unavailable after retry attempt');
    }
  }, [fetchNotesAndFlashcards]);
  
  useEffect(() => {
    let connected = false;
    let isMounted = true; // Flag to track if component is mounted
    
    // Check backend connectivity on startup
    const checkBackendStatus = async () => {
      if (!isMounted) return; // Don't proceed if unmounted
      
      try {
        // First try to connect
        connected = await api.checkConnection();
        
        if (connected) {
          console.log('Backend connection established');
          setBackendReady(true);
          setShowNotification(false);
          
          // Also check the health endpoint for more details
          const healthResponse = await api.healthCheck();
          if (healthResponse && healthResponse.status === 'healthy') {
            console.log('Backend is healthy:', healthResponse);
            
            // Fetch notes and flashcards after confirming backend is available
            fetchNotesAndFlashcards();
          } else {
            console.warn('Backend is connected but health check indicates issues:', healthResponse);
            // Still set to ready since basic connectivity is working
            setBackendReady(true);
          }
        } else {
          console.error('Cannot connect to backend services');
          setBackendReady(false);
          
          // Only show notification after first 2 failed attempts
          if (retryCount >= 2) {
            setShowNotification(true);
            
            // Enable mock mode after retrying
            if (!api.isMockModeEnabled()) {
              api.enableMockMode();
              // Load mock data into the app state
              dispatch({ 
                type: 'SET_NOTES', 
                payload: MOCK_DATA.notes.map((note: any) => ({
                  id: note.id,
                  title: note.title,
                  content: note.content,
                  summary: note.summary,
                  tags: note.tags,
                  createdAt: new Date(note.created_at),
                  updatedAt: new Date(note.updated_at)
                }))
              });
              
              dispatch({ 
                type: 'SET_FLASHCARDS', 
                payload: MOCK_DATA.flashcards.map((card: any) => ({
                  id: card.id,
                  front: card.question,
                  back: card.answer,
                  tags: card.tags,
                  createdAt: new Date(card.created_at)
                }))
              });
              
              console.log('Loaded mock data as backend is unavailable');
            }
          }
        }
      } catch (error) {
        console.error('Failed to check backend connectivity:', error);
        setBackendReady(false);
        
        // Only show notification after first 2 failed attempts
        if (retryCount >= 2) {
          setShowNotification(true);
        }
      }
    };
    
    checkBackendStatus();
    
    // Recheck every 30 seconds instead of 15 to reduce frequency
    const interval = setInterval(checkBackendStatus, 30000);
    
    // Cleanup function
    return () => {
      isMounted = false; // Set flag to false when unmounting
      clearInterval(interval);
    };
  }, [fetchNotesAndFlashcards, retryCount, dispatch]);

  return (
    <>
      {children}
      
      {/* Snackbar notification instead of fixed banner */}
      <Snackbar 
        open={showNotification && !backendReady} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        autoHideDuration={null} // Don't auto-hide
        sx={{
          boxShadow: 'none',
          '& .MuiPaper-root': {
            backgroundColor: 'error.main', // Use direct color instead of alpha
          }
        }}
      >
        <Alert 
          severity="error" 
          variant="standard" // Changed from filled to standard for better performance
          onClose={handleCloseNotification}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={startBackendServer}
            >
              Retry
            </Button>
          }
          sx={{ width: '100%', boxShadow: 'none' }} // Remove shadow
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