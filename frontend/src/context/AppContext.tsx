import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags: string[];
  noteId?: string;
  createdAt: Date;
}

interface AppState {
  notes: Note[];
  currentNote: Note | null;
  searchQuery: string;
  selectedTags: string[];
  flashcards: Flashcard[];
}

type AppAction =
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'UPDATE_NOTE'; payload: Note }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'SET_CURRENT_NOTE'; payload: Note | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_TAGS'; payload: string[] }
  | { type: 'ADD_FLASHCARD'; payload: Flashcard }
  | { type: 'ADD_FLASHCARDS'; payload: Flashcard[] }
  | { type: 'UPDATE_FLASHCARD'; payload: Flashcard }
  | { type: 'DELETE_FLASHCARD'; payload: string }
  | { type: 'SET_NOTES'; payload: Note[] }
  | { type: 'SET_FLASHCARDS'; payload: Flashcard[] }
  | { type: 'CLEAR_NOTES' }
  | { type: 'CLEAR_FLASHCARDS' };

// Load state from localStorage if available
const loadInitialState = (): AppState => {
  try {
    const savedState = localStorage.getItem('smartNoteOrganizerState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      
      // Convert string dates back to Date objects
      if (parsedState.notes) {
        parsedState.notes = parsedState.notes.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
        }));
      }
      
      if (parsedState.flashcards) {
        parsedState.flashcards = parsedState.flashcards.map((card: any) => ({
          ...card,
          createdAt: new Date(card.createdAt),
        }));
      }
      
      return parsedState;
    }
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
  }
  
  // Default initial state if nothing in localStorage
  return {
    notes: [],
    currentNote: null,
    searchQuery: '',
    selectedTags: [],
    flashcards: [],
  };
};

const initialState: AppState = loadInitialState();

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

const appReducer = (state: AppState, action: AppAction): AppState => {
  let newState;
  
  switch (action.type) {
    case 'ADD_NOTE':
      newState = {
        ...state,
        notes: [...state.notes, action.payload],
      };
      break;
    case 'UPDATE_NOTE':
      newState = {
        ...state,
        notes: state.notes.map((note) =>
          note.id === action.payload.id ? action.payload : note
        ),
      };
      break;
    case 'DELETE_NOTE':
      newState = {
        ...state,
        notes: state.notes.filter((note) => note.id !== action.payload),
        currentNote: state.currentNote?.id === action.payload ? null : state.currentNote,
      };
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
      break;
    case 'ADD_FLASHCARDS':
      newState = {
        ...state,
        flashcards: [...state.flashcards, ...action.payload],
      };
      break;
    case 'UPDATE_FLASHCARD':
      newState = {
        ...state,
        flashcards: state.flashcards.map((flashcard) =>
          flashcard.id === action.payload.id ? action.payload : flashcard
        ),
      };
      break;
    case 'DELETE_FLASHCARD':
      newState = {
        ...state,
        flashcards: state.flashcards.filter((flashcard) => flashcard.id !== action.payload),
      };
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
      break;
    case 'CLEAR_FLASHCARDS':
      newState = {
        ...state,
        flashcards: [],
      };
      break;
    default:
      return state;
  }
  
  // Save to localStorage after each state change
  try {
    localStorage.setItem('smartNoteOrganizerState', JSON.stringify(newState));
  } catch (error) {
    console.error('Error saving state to localStorage:', error);
  }
  
  return newState;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

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