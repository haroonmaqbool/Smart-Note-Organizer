import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { Note, AppFlashcard, Summary, api, ApiResponse } from '../services/api';

interface AppState {
  notes: Note[];
  currentNote: Note | null;
  searchQuery: string;
  selectedTags: string[];
  flashcards: AppFlashcard[];
  summaries: Summary[];
  currentSummary: Summary | null;
}

type AppAction =
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'UPDATE_NOTE'; payload: Note }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'SET_CURRENT_NOTE'; payload: Note | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_TAGS'; payload: string[] }
  | { type: 'ADD_FLASHCARD'; payload: AppFlashcard }
  | { type: 'ADD_FLASHCARDS'; payload: AppFlashcard[] }
  | { type: 'UPDATE_FLASHCARD'; payload: AppFlashcard }
  | { type: 'DELETE_FLASHCARD'; payload: string }
  | { type: 'SET_NOTES'; payload: Note[] }
  | { type: 'SET_FLASHCARDS'; payload: AppFlashcard[] }
  | { type: 'CLEAR_NOTES' }
  | { type: 'CLEAR_FLASHCARDS' }
  | { type: 'ADD_SUMMARY'; payload: Summary }
  | { type: 'UPDATE_SUMMARY'; payload: Summary }
  | { type: 'DELETE_SUMMARY'; payload: string }
  | { type: 'SET_SUMMARIES'; payload: Summary[] }
  | { type: 'SET_CURRENT_SUMMARY'; payload: Summary | null }
  | { type: 'CLEAR_SUMMARIES' };

// Create a default state to use when there's nothing in localStorage
const defaultState: AppState = {
  notes: [],
  currentNote: null,
  searchQuery: '',
  selectedTags: [],
  flashcards: [],
  summaries: [],
  currentSummary: null,
};

// Mock data for first-time users
const MOCK_DATA = {
  notes: [
    {
      id: "1",
      title: "Machine Learning Basics",
      content: "<p>Introduction to machine learning concepts including supervised and unsupervised learning.</p>",
      summary: "An overview of fundamental machine learning concepts and approaches.",
      tags: ["ML", "AI", "data science"],
      createdAt: new Date("2023-10-15T14:30:00.000Z"),
      updatedAt: new Date("2023-10-15T15:45:00.000Z")
    },
    {
      id: "2",
      title: "Python Programming Tips",
      content: "<p>Useful Python programming techniques and best practices.</p>",
      summary: "A collection of advanced Python tips for better code quality.",
      tags: ["Python", "programming", "tips"],
      createdAt: new Date("2023-10-16T10:15:00.000Z"),
      updatedAt: new Date("2023-10-16T11:30:00.000Z")
    }
  ],
  flashcards: [
    {
      id: "1",
      front: "What is supervised learning?",
      back: "A type of machine learning where the model is trained on labeled data and learns to predict outputs based on inputs.",
      tags: ["ML", "AI"],
      createdAt: new Date("2023-10-15T16:00:00.000Z")
    },
    {
      id: "2",
      front: "What are list comprehensions in Python?",
      back: "A concise way to create lists based on existing lists or iterables. Example: [x*2 for x in range(10)]",
      tags: ["Python", "programming"],
      createdAt: new Date("2023-10-16T12:00:00.000Z")
    }
  ]
};

// Load initial state from localStorage if available
const loadInitialState = (): AppState => {
  try {
    const savedState = localStorage.getItem('smartNoteOrganizerState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      
      // Convert date strings back to Date objects for notes
      if (parsedState.notes) {
        parsedState.notes = parsedState.notes.map((note: any) => ({
          ...note,
          createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
          updatedAt: note.updatedAt ? new Date(note.updatedAt) : new Date(),
        }));
      }
      
      // Convert date strings back to Date objects for flashcards
      if (parsedState.flashcards) {
        parsedState.flashcards = parsedState.flashcards.map((card: any) => ({
          ...card,
          createdAt: card.createdAt ? new Date(card.createdAt) : new Date(),
        }));
      }
      
      console.log('Loaded state from localStorage:', parsedState);
      return {
        notes: parsedState.notes || [],
        currentNote: parsedState.currentNote || null,
        searchQuery: parsedState.searchQuery || '',
        selectedTags: parsedState.selectedTags || [],
        flashcards: parsedState.flashcards || [],
        summaries: parsedState.summaries || [],
        currentSummary: parsedState.currentSummary || null,
      };
    }
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
  }
  
  // First time use - provide mock data for better UX
  console.log('No saved data found, loading mock data');
  return {
    ...defaultState,
    notes: MOCK_DATA.notes,
    flashcards: MOCK_DATA.flashcards
  };
};

const initialState: AppState = loadInitialState();

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

const appReducer = (state: AppState, action: AppAction): AppState => {
  let newState: AppState = state;
  
  const persistState = (state: AppState) => {
    try {
      localStorage.setItem('smartNoteOrganizerState', JSON.stringify(state));
      console.log('State persisted successfully:', state);
    } catch (error) {
      console.error('Error persisting state:', error);
    }
  };

  switch (action.type) {
    case 'ADD_NOTE':
      // Check if a note with the same ID or content already exists
      const existingNoteWithId = state.notes.find(note => note.id === action.payload.id);
      const existingNoteWithContent = state.notes.find(note => 
        note.title === action.payload.title && 
        note.content === action.payload.content
      );
      
      if (existingNoteWithId || existingNoteWithContent) {
        console.log('Duplicate note detected, not adding to state');
        // Return current state without changes to prevent duplication
        newState = state;
      } else {
        // Only add the note if it doesn't exist
        newState = {
          ...state,
          notes: [...state.notes, action.payload],
        };
        // If the backend ID differs from our local ID, clear localStorage to force a fresh load
        // (This is now handled in NoteEditor, but keep for safety)
        // No need to call api.createNote here, as it's now awaited in NoteEditor
      }
      break;
    case 'UPDATE_NOTE':
      newState = {
        ...state,
        notes: state.notes.map((note) =>
          note.id === action.payload.id ? action.payload : note
        ),
      };
      // Sync with backend
      api.updateNote(action.payload)
        .then((response: ApiResponse<Note>) => {
          if (response.error) {
            console.error('Error from backend:', response.error);
          } else {
            console.log('Note updated successfully:', response.data);
          }
        })
        .catch((error: Error) => {
          console.error('Error updating note in backend:', error);
        });
      break;
    case 'DELETE_NOTE':
      // Update local state first for immediate UI feedback
      newState = {
        ...state,
        notes: state.notes.filter((note) => note.id !== action.payload),
        currentNote: state.currentNote?.id === action.payload ? null : state.currentNote,
      };
      
      // Then delete from backend
      console.log(`Deleting note with ID: ${action.payload} from backend database`);
      api.deleteNote(action.payload)
        .then((response: ApiResponse<boolean>) => {
          if (response.error) {
            console.error('Error deleting note from backend:', response.error);
          } else {
            console.log('Note successfully deleted from backend database');
          }
        })
        .catch((error: Error) => {
          console.error('Error deleting note from backend:', error);
        });
      break;
    case 'SET_CURRENT_NOTE':
      newState = {
        ...state,
        currentNote: action.payload,
      };
      break;
    case 'SET_SEARCH_QUERY':
      newState = {
        ...state,
        searchQuery: action.payload,
      };
      break;
    case 'SET_SELECTED_TAGS':
      newState = {
        ...state,
        selectedTags: action.payload,
      };
      break;
    case 'ADD_FLASHCARD':
      newState = {
        ...state,
        flashcards: [...state.flashcards, action.payload],
      };
      // Sync with backend
      api.createFlashcard({
        front: action.payload.front,
        back: action.payload.back,
        tags: action.payload.tags,
        noteId: action.payload.noteId
      })
      .then((response: ApiResponse<AppFlashcard>) => {
        if (response.error) {
          console.error('Error from backend:', response.error);
        } else {
          console.log('Flashcard created successfully:', response.data);
        }
      })
      .catch((error: Error) => {
        console.error('Error creating flashcard in backend:', error);
      });
      break;
    case 'ADD_FLASHCARDS':
      newState = {
        ...state,
        flashcards: [...state.flashcards, ...action.payload],
      };
      // Sync multiple flashcards with backend
      action.payload.forEach(flashcard => {
        api.createFlashcard({
          front: flashcard.front,
          back: flashcard.back,
          tags: flashcard.tags,
          noteId: flashcard.noteId
        })
        .then((response: ApiResponse<AppFlashcard>) => {
          if (response.error) {
            console.error('Error from backend:', response.error);
          } else {
            console.log('Flashcard created successfully:', response.data);
          }
        })
        .catch((error: Error) => {
          console.error('Error creating flashcard in backend:', error);
        });
      });
      break;
    case 'UPDATE_FLASHCARD':
      newState = {
        ...state,
        flashcards: state.flashcards.map((flashcard) =>
          flashcard.id === action.payload.id ? action.payload : flashcard
        ),
      };
      // Sync with backend
      api.updateFlashcard(action.payload)
        .then((response: ApiResponse<AppFlashcard>) => {
          if (response.error) {
            console.error('Error from backend:', response.error);
          } else {
            console.log('Flashcard updated successfully:', response.data);
          }
        })
        .catch((error: Error) => {
          console.error('Error updating flashcard in backend:', error);
        });
      break;
    case 'DELETE_FLASHCARD':
      newState = {
        ...state,
        flashcards: state.flashcards.filter((flashcard) => flashcard.id !== action.payload),
      };
      // Sync with backend
      console.log(`Deleting flashcard with ID: ${action.payload} from backend database`);
      api.deleteFlashcard(action.payload)
        .then((response: ApiResponse<boolean>) => {
          if (response.error) {
            console.error('Error from backend:', response.error);
          } else {
            console.log('Flashcard deleted successfully from backend');
            // Ensure the changes are reflected in localStorage
            persistState(newState);
          }
        })
        .catch((error: Error) => {
          console.error('Error deleting flashcard in backend:', error);
        });
      break;
    case 'SET_NOTES':
      newState = {
        ...state,
        notes: action.payload,
      };
      break;
    case 'SET_FLASHCARDS':
      newState = {
        ...state,
        flashcards: action.payload,
      };
      break;
    case 'CLEAR_NOTES':
      newState = {
        ...state,
        notes: [],
      };
      // Sync with backend - delete all notes from the database
      api.deleteAllNotes()
        .then((response: ApiResponse<boolean>) => {
          if (response.error) {
            console.error('Error from backend:', response.error);
          } else {
            console.log('All notes deleted successfully from backend');
          }
        })
        .catch((error: Error) => {
          console.error('Error clearing notes in backend:', error);
        });
      break;
    case 'CLEAR_FLASHCARDS':
      newState = {
        ...state,
        flashcards: [],
      };
      // Sync with backend - delete all flashcards from the database
      api.deleteAllFlashcards()
        .then((response: ApiResponse<boolean>) => {
          if (response.error) {
            console.error('Error from backend:', response.error);
          } else {
            console.log('All flashcards deleted successfully from backend');
            // Clear from localStorage too to ensure they don't come back
            localStorage.removeItem('smartNoteOrganizerState');
          }
        })
        .catch((error: Error) => {
          console.error('Error clearing flashcards in backend:', error);
        });
      break;
    case 'ADD_SUMMARY':
      newState = {
        ...state,
        summaries: [...state.summaries, action.payload],
      };
      break;
    case 'UPDATE_SUMMARY':
      newState = {
        ...state,
        summaries: state.summaries.map((summary) =>
          summary.id === action.payload.id ? action.payload : summary
        ),
      };
      break;
    case 'DELETE_SUMMARY':
      newState = {
        ...state,
        summaries: state.summaries.filter((summary) => summary.id !== action.payload),
      };
      break;
    case 'SET_SUMMARIES':
      newState = {
        ...state,
        summaries: action.payload,
      };
      break;
    case 'SET_CURRENT_SUMMARY':
      newState = {
        ...state,
        currentSummary: action.payload,
      };
      break;
    case 'CLEAR_SUMMARIES':
      newState = {
        ...state,
        summaries: [],
      };
      break;
    default:
      return state;
  }
  
  // Save to localStorage after each state change
  persistState(newState);
  
  return newState;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Check backend connection on component mount
  useEffect(() => {
    const syncWithBackend = async () => {
      try {
        // Check if backend is available
        const isConnected = await api.checkConnection();
        
        if (isConnected) {
          console.log('Backend connected, loading data...');
          
          // Fetch notes from backend
          const notesResponse = await api.getNotes();
          // Always set notes from backend, even if empty array
          console.log('Loaded notes from backend:', notesResponse.data?.length || 0);
          
          // Set notes in state, completely replacing any existing notes to prevent duplication
          dispatch({ type: 'SET_NOTES', payload: notesResponse.data || [] });
          
          // Fetch flashcards from backend
          const flashcardsResponse = await api.getFlashcards();
          
          if (flashcardsResponse.data) {
            console.log('Loaded flashcards from backend:', flashcardsResponse.data.length);
            
            // Deduplicate flashcards
            const uniqueCards = new Map<string, AppFlashcard>();
            flashcardsResponse.data.forEach(card => {
              const contentKey = `${card.front.trim().toLowerCase()}|${card.back.trim().toLowerCase()}`;
              if (!uniqueCards.has(contentKey)) {
                uniqueCards.set(contentKey, card);
              }
            });
            
            const deduplicatedFlashcards = Array.from(uniqueCards.values());
            console.log(`Removed ${flashcardsResponse.data.length - deduplicatedFlashcards.length} duplicate flashcards`);
            
            // Set flashcards in state
            dispatch({ type: 'SET_FLASHCARDS', payload: deduplicatedFlashcards });
          }
          
          // Fetch summaries from backend
          const summariesResponse = await api.getSummaries();
          
          if (summariesResponse.data) {
            console.log('Loaded summaries from backend:', summariesResponse.data.length);
            
            // Set summaries in state
            dispatch({ type: 'SET_SUMMARIES', payload: summariesResponse.data });
          }
          
          // Clear any localStorage data that might cause duplication
          localStorage.removeItem('smartNoteOrganizerState');
          console.log('Removed old localStorage data to prevent duplication');
        } else {
          console.log('Backend not connected, using local data only');
        }
      } catch (error) {
        console.error('Error syncing with backend:', error);
      }
    };

    syncWithBackend();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}; 