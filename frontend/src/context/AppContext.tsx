import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AppState {
  notes: Note[];
  currentNote: Note | null;
  searchQuery: string;
  selectedTags: string[];
}

type AppAction =
  | { type: 'ADD_NOTE'; payload: Note }
  | { type: 'UPDATE_NOTE'; payload: Note }
  | { type: 'DELETE_NOTE'; payload: string }
  | { type: 'SET_CURRENT_NOTE'; payload: Note | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_TAGS'; payload: string[] };

const initialState: AppState = {
  notes: [],
  currentNote: null,
  searchQuery: '',
  selectedTags: [],
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_NOTE':
      return {
        ...state,
        notes: [...state.notes, action.payload],
      };
    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map((note) =>
          note.id === action.payload.id ? action.payload : note
        ),
      };
    case 'DELETE_NOTE':
      return {
        ...state,
        notes: state.notes.filter((note) => note.id !== action.payload),
        currentNote: state.currentNote?.id === action.payload ? null : state.currentNote,
      };
    case 'SET_CURRENT_NOTE':
      return {
        ...state,
        currentNote: action.payload,
      };
    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
      };
    case 'SET_SELECTED_TAGS':
      return {
        ...state,
        selectedTags: action.payload,
      };
    default:
      return state;
  }
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