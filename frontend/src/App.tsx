import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Alert, Snackbar, responsiveFontSizes } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { useEffect, useState, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import NoteEditor from './pages/NoteEditor';
import Search from './pages/Search';
import Flashcards from './pages/Flashcards';
import { AppProvider, useApp } from './context/AppContext';
import { api, API_BASE_URL } from './services/api';

const baseTheme = createTheme({
  palette: {
    mode: 'dark',
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
      default: '#0f172a', // Slightly deeper blue
      paper: '#1e293b',   // Richer panel color
    },
    text: {
      primary: '#f0f9ff', // Brighter white for contrast
      secondary: '#94a3b8',
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
          background-image: radial-gradient(circle at 80% 90%, rgba(99, 102, 241, 0.15) 0%, transparent 48%),
                           radial-gradient(circle at 20% 20%, rgba(79, 70, 229, 0.2) 0%, transparent 58%);
          background-attachment: fixed;
          background-size: cover;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          scrollbar-width: thin;
          scrollbar-color: #3d7be5 #1e293b;
        }
        
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
          border: 2px solid #1e293b;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: #3d7be5;
        }
        
        ::selection {
          background-color: rgba(61, 123, 229, 0.4);
          color: #f0f9ff;
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
          boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
          borderRadius: 16,
          border: '1px solid #2a3a5a',
          backgroundColor: '#1e293b',
          backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.03) 0%, transparent 40%)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          '&:hover': {
            boxShadow: '0 12px 28px rgba(0,0,0,0.35)',
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
            opacity: 0.4,
          }
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
          background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(61, 123, 229, 0.2)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '& fieldset': {
              borderColor: '#3a4a6a',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            },
            '&:hover fieldset': {
              borderColor: '#4a5a7a',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3d7be5',
              boxShadow: '0 0 0 3px rgba(61, 123, 229, 0.2)',
            },
            '&.Mui-focused': {
              transform: 'translateY(-2px)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          backgroundColor: '#2c3b59',
          color: '#e0e7ff',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: '#35466d',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
          },
          '& .MuiChip-deleteIcon': {
            color: '#8a9bbd',
            transition: 'all 0.2s ease',
            '&:hover': {
              color: '#e0e7ff'
            }
          }
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e293b',
          backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.02), transparent)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#2a3a5a',
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#8a9bbd',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: 'rgba(61, 123, 229, 0.1)',
            transform: 'translateY(-2px)',
            color: '#62a0ff',
          }
        }
      }
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          borderRadius: 8,
          margin: '2px 0',
          '&:hover': {
            backgroundColor: 'rgba(61, 123, 229, 0.08)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(61, 123, 229, 0.15)',
            '&:hover': {
              backgroundColor: 'rgba(61, 123, 229, 0.2)',
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: '10%',
              height: '80%',
              width: 4,
              backgroundColor: '#3d7be5',
              borderRadius: '0 4px 4px 0',
            }
          }
        }
      }
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          padding: 8,
          '& .MuiSwitch-track': {
            borderRadius: 22 / 2,
            backgroundColor: '#2d3c50',
          },
          '& .MuiSwitch-thumb': {
            boxShadow: 'none',
            backgroundColor: '#8a9bbd',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          '& .Mui-checked': {
            '& .MuiSwitch-thumb': {
              backgroundColor: '#3d7be5',
            },
            '& + .MuiSwitch-track': {
              backgroundColor: '#1a2c4a',
              opacity: 1,
            },
          },
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#0f172a',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          border: '1px solid #2a3a5a',
          fontSize: '0.75rem',
          padding: '6px 10px',
          backdropFilter: 'blur(4px)',
        }
      }
    },
    MuiModal: {
      styleOverrides: {
        root: {
          '& .MuiBackdrop-root': {
            backdropFilter: 'blur(4px)',
          },
        },
      },
    },
  },
});

// Apply responsive font sizes
const theme = responsiveFontSizes(baseTheme);

// Separate component to handle data loading
const DataLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [backendReady, setBackendReady] = useState<boolean>(false);
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
  
  useEffect(() => {
    // Check backend health on startup
    const checkBackendHealth = async () => {
      try {
        const response = await api.healthCheck();
        if (response && response.status === 'healthy') {
          console.log('Backend is ready:', response);
          setBackendReady(true);
          
          // Fetch notes and flashcards after confirming backend is available
          fetchNotesAndFlashcards();
        } else {
          console.error('Backend health check failed:', response);
          setBackendReady(false);
        }
      } catch (error) {
        console.error('Failed to check backend health:', error);
        setBackendReady(false);
      }
    };
    
    checkBackendHealth();
    // Recheck every 30 seconds in case backend restarts
    const interval = setInterval(checkBackendHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchNotesAndFlashcards]);

  return (
    <>
      {children}
      {!backendReady && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0,
          padding: '8px',
          background: '#f44336',
          color: 'white',
          textAlign: 'center',
          zIndex: 9999
        }}>
          Cannot connect to backend services. Some features might not work properly.
        </div>
      )}
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <DataLoader>
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
        </DataLoader>
      </AppProvider>
    </ThemeProvider>
  );
};

export default App; 