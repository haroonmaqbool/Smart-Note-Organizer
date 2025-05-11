import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  IconButton,
  Alert,
  Snackbar,
  Chip,
  useTheme,
  alpha,
  Divider,
  Grid,
  Paper,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TextField,
  Input,
  InputLabel,
  FormControl,
  Tooltip,
  InputAdornment,
  Backdrop,
  Fade,
  Select,
  MenuItem,
  Menu
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Download as DownloadIcon,
  Psychology as PsychologyIcon,
  History as HistoryIcon,
  School as SchoolIcon,
  Add as AddIcon,
  Upload as UploadIcon,
  Image as ImageIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  DeleteOutlined as DeleteIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Folder as FolderIcon,
  FlipToBack as FlipIcon,
  Close as CloseIcon,
  CloudDownload as CloudDownloadIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Edit as EditIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  NoteAlt as NoteAltIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { api, AIModel, Flashcard as ApiFlashcard } from '../services/api';
import { v4 as uuidv4 } from 'uuid';
import { createWorker } from 'tesseract.js';
import { useNotification } from '../components/Layout';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags: string[];
  noteId?: string;
  createdAt: Date;
  recentlySaved?: boolean; // Flag for recently saved flashcards
}

// Define tab values
type TabValue = 'study' | 'history';

// Define flashcard viewing modes
type ViewMode = 'all' | 'byNote' | 'focused';

const Flashcards: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning', showViewButton: false });
  const [activeTab, setActiveTab] = useState<TabValue>('study');
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<ApiFlashcard[]>([]);
  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [newFlashcard, setNewFlashcard] = useState({
    front: '',
    back: '',
    tags: [] as string[],
  });
  const [currentNewTag, setCurrentNewTag] = useState('');
  
  // Add search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Add new state for study mode search
  const [studyModeSearchQuery, setStudyModeSearchQuery] = useState('');
  
  // Note-related state
  const [selectedNote, setSelectedNote] = useState<null | { id: string, title: string, content: string, tags: string[] }>(null);
  const [isGeneratingFromNote, setIsGeneratingFromNote] = useState(false);
  const [noteToFlashcardsDialogOpen, setNoteToFlashcardsDialogOpen] = useState(false);
  const [notesToSelectFrom, setNotesToSelectFrom] = useState<Array<{ id: string, title: string, content: string, tags: string[] }>>([]);
  
  // New state for viewing modes
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [focusedStudyMode, setFocusedStudyMode] = useState(false);
  
  // Get flashcards from context
  const { state, dispatch } = useApp();
  const { flashcards } = state;
  const { showNotification } = useNotification();

  // Add this right after const { state, dispatch } = useApp();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [flashcardToDelete, setFlashcardToDelete] = useState<Flashcard | null>(null);

  // Add this state right after existing state declarations
  const [clearAllConfirmOpen, setClearAllConfirmOpen] = useState(false);

  // Add a state for the tab that should pulse/highlight
  const [highlightTab, setHighlightTab] = useState<TabValue | null>(null);
  
  // When a tab is highlighted, clear it after a delay
  useEffect(() => {
    if (highlightTab) {
      const timer = setTimeout(() => {
        setHighlightTab(null);
      }, 3000); // Clear highlight after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [highlightTab]);

  // Add an effect to handle navigation and cleanup
  useEffect(() => {
    // This effect runs when the component mounts
    const handleBeforeUnload = () => {
      // Reset any necessary state before unmounting
      setIsGenerating(false);
      setIsGeneratingFromNote(false);
    };

    // Add cleanup handler
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Filter flashcards based on search query and active note
  const filteredFlashcards = useMemo(() => {
    let cards = [...flashcards];
    
    // First, deduplicate flashcards by content
    // Use a Map to identify duplicates with similar front/back content
    const uniqueCards = new Map<string, Flashcard>();
    
    cards.forEach(card => {
      // Create a key combining the front and back text (normalized)
      const contentKey = `${card.front.trim().toLowerCase()}|${card.back.trim().toLowerCase()}`;
      
      // Only keep the first occurrence of each card with the same content
      if (!uniqueCards.has(contentKey)) {
        uniqueCards.set(contentKey, card);
      }
    });
    
    // Convert back to array
    cards = Array.from(uniqueCards.values());
    
    console.log(`Removed ${flashcards.length - cards.length} duplicate flashcards`);
    
    // Filter by active note if in byNote mode or focused study mode
    if ((viewMode === 'byNote' || focusedStudyMode) && activeNoteId) {
      console.log('Filtering cards for note ID:', activeNoteId);
      // Debug what's available
      const notesWithCards = cards.filter(card => card.noteId).map(card => card.noteId);
      console.log('Available note IDs with cards:', [...new Set(notesWithCards)]);
      
      cards = cards.filter(card => card.noteId === activeNoteId);
      console.log('Found cards for this note:', cards.length);
    }
    
    // When in study mode tab but not in focused study mode, don't show any cards
    // This ensures cards are only shown when a specific note is selected for study
    if (activeTab === 'study' && !focusedStudyMode) {
      return [];
    }
    
    // Filter by search query regardless of mode
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      cards = cards.filter(card => {
        const frontMatch = card.front.toLowerCase().includes(query);
        const backMatch = card.back.toLowerCase().includes(query);
        const tagMatch = card.tags.some(tag => tag.toLowerCase().includes(query));
        
        return frontMatch || backMatch || tagMatch;
      });
    }
    
    return cards;
  }, [flashcards, searchQuery, viewMode, activeNoteId, focusedStudyMode, activeTab]);

  // Group flashcards by note for easier navigation
  const flashcardsByNote = useMemo(() => {
    const byNote = new Map<string, Flashcard[]>();
    
    // Log for debugging
    console.log('Total flashcards to organize by note:', flashcards.length);
    // Count flashcards with noteId
    const flashcardsWithNoteId = flashcards.filter(card => card.noteId);
    console.log('Flashcards with noteId:', flashcardsWithNoteId.length);
    
    // Deduplicate cards per note based on content
    const groupedCards = new Map<string, Map<string, Flashcard>>();
    
    // First group cards by noteId and deduplicate within each group
    flashcards.forEach(card => {
      if (card.noteId) {
        // Create or get the map for this noteId
        if (!groupedCards.has(card.noteId)) {
          groupedCards.set(card.noteId, new Map<string, Flashcard>());
        }
        
        const noteCards = groupedCards.get(card.noteId)!;
        // Create a key combining the front and back text (normalized)
        const contentKey = `${card.front.trim().toLowerCase()}|${card.back.trim().toLowerCase()}`;
        
        // Only keep the first occurrence of each card with the same content
        if (!noteCards.has(contentKey)) {
          noteCards.set(contentKey, card);
        }
      }
    });
    
    // Convert to the final structure
    groupedCards.forEach((uniqueCardsMap, noteId) => {
      byNote.set(noteId, Array.from(uniqueCardsMap.values()));
    });
    
    // Log the result
    console.log('Notes with flashcards:', byNote.size);
    return byNote;
  }, [flashcards]);
  
  // Get available note IDs with flashcards
  const notesWithFlashcards = useMemo(() => {
    return Array.from(flashcardsByNote.keys());
  }, [flashcardsByNote]);

  // Filter notes with flashcards based on study mode search query
  const filteredNotesWithFlashcards = useMemo(() => {
    if (!studyModeSearchQuery.trim()) {
      return notesWithFlashcards;
    }

    const query = studyModeSearchQuery.toLowerCase();
    return notesWithFlashcards.filter(noteId => {
      const note = state.notes.find(n => n.id === noteId);
      return note && note.title.toLowerCase().includes(query);
    });
  }, [notesWithFlashcards, studyModeSearchQuery, state.notes]);

  useEffect(() => {
    // Only include notes that do NOT have flashcards
    setNotesToSelectFrom(
      state.notes.filter(note => !flashcards.some(card => card.noteId === note.id)).map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        tags: note.tags
      }))
    );
  }, [state.notes, flashcards]);

  // Reset current index when filtered cards change
  useEffect(() => {
    if (currentIndex >= filteredFlashcards.length) {
      setCurrentIndex(Math.max(0, filteredFlashcards.length - 1));
    }
    // Hide answer when changing cards or filters
    setIsFlipped(false);
  }, [filteredFlashcards, currentIndex]);

  const handleNext = () => {
    if (currentIndex < filteredFlashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      // Hide answer when navigating to next card
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      // Hide answer when navigating to previous card
      setIsFlipped(false);
    }
  };

  const handleExport = () => {
    // Format for Anki compatibility
    // Anki expects: front, back, and tags fields
    const ankiFormat = flashcards.map(card => ({
      front: card.front,
      back: card.back,
      tags: card.tags.join(' ')
    }));

    const blob = new Blob([JSON.stringify(ankiFormat, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anki-flashcards.json';
    a.click();
    URL.revokeObjectURL(url);
    
    setNotification({
      open: true,
      message: 'Flashcards exported successfully!',
      severity: 'success',
      showViewButton: true
    });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const navigateToCreateNote = () => {
    navigate('/editor');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
    // Reset view mode when changing tabs
    setViewMode('all');
    setActiveNoteId(null);
    setFocusedStudyMode(false);
  };

  // Function to check if a note already has flashcards
  const noteHasFlashcards = (noteId: string): boolean => {
    // Check directly from the global flashcards array
    const hasCards = flashcards.some(card => card.noteId === noteId);
    console.log(`Note ${noteId} has flashcards: ${hasCards}`);
    return hasCards;
  };
  
  // Function to view existing flashcards for a note
  const viewExistingFlashcards = (noteId: string) => {
    console.log('Viewing flashcards for note ID:', noteId);
    // First, check if this note actually has flashcards
    const noteCards = flashcards.filter(card => card.noteId === noteId);
    console.log(`Found ${noteCards.length} flashcards for note ID ${noteId}`);
    
    if (noteCards.length === 0) {
      showNotification('No flashcards found for this note.', 'warning', 'flashcard');
      return;
    }
    
    setActiveNoteId(noteId);
    setViewMode('byNote');
    setActiveTab('study');
    setCurrentIndex(0);
    // Hide answer initially
    setIsFlipped(false);
    setFocusedStudyMode(true);
    
    // Find the corresponding note
    const noteInfo = notesToSelectFrom.find(note => note.id === noteId);
    if (noteInfo) {
      setSelectedNote(noteInfo);
    }
    
    // Close any open dialogs
    setAiDialogOpen(false);
    setNoteToFlashcardsDialogOpen(false);
  };

  // Add a function to generate flashcards from a note
  const handleGenerateFromNote = async (note: { id: string, title: string, content: string, tags: string[] }) => {
    // Check if flashcards already exist for this note
    if (noteHasFlashcards(note.id)) {
      // If yes, just switch to viewing those flashcards
      viewExistingFlashcards(note.id);
      
      setNotification({
        open: true,
        message: 'Showing existing flashcards for this note',
        severity: 'info',
        showViewButton: false
      });
      
      return;
    }
    
    // If no existing flashcards, generate new ones
    setSelectedNote(note);
    setNoteToFlashcardsDialogOpen(true);
    setIsGeneratingFromNote(true);
    setGeneratedFlashcards([]);

    try {
      // Use the content of the note to generate flashcards
      const result = await api.chatbot(note.content, note.title, note.tags);

      if (result.error) {
        setNotification({
          open: true,
          message: `Error generating flashcards: ${result.error}`,
          severity: 'error',
          showViewButton: false
        });
        return;
      }

      if (result.data && result.data.flashcards && result.data.flashcards.length > 0) {
        setGeneratedFlashcards(result.data.flashcards);
      } else {
        setNotification({
          open: true,
          message: 'No flashcards could be generated from this note',
          severity: 'warning',
          showViewButton: false
        });
      }
    } catch (error) {
      console.error('Error generating flashcards from note:', error);
      setNotification({
        open: true,
        message: 'Failed to generate flashcards',
        severity: 'error',
        showViewButton: false
      });
    } finally {
      setIsGeneratingFromNote(false);
    }
  };
  
  // Add a function to save flashcards generated from a note
  const handleSaveNoteFlashcards = async () => {
    if (!selectedNote) return;
    
    try {
      // Check for existing flashcards with similar content
      const existingFlashcards = flashcards.filter(card => card.noteId === selectedNote.id);
      
      // Convert the API flashcard format to the app's flashcard format,
      // but skip any that would be duplicates of existing cards
      const existingContentMap = new Map<string, boolean>();
      
      // Create a map of existing content to check against
      existingFlashcards.forEach(card => {
        const contentKey = `${card.front.trim().toLowerCase()}|${card.back.trim().toLowerCase()}`;
        existingContentMap.set(contentKey, true);
      });
      
      // Filter out new flashcards that would duplicate existing ones
      const uniqueNewFlashcards = generatedFlashcards.filter(card => {
        const contentKey = `${card.question.trim().toLowerCase()}|${card.answer.trim().toLowerCase()}`;
        return !existingContentMap.has(contentKey);
      });
      
      console.log(`Found ${generatedFlashcards.length - uniqueNewFlashcards.length} duplicate flashcards that will be skipped`);
      
      const flashcardsToSave = uniqueNewFlashcards.map(card => ({
        id: `flashcard-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        front: card.question,
        back: card.answer,
        tags: [...card.tags],
        noteId: selectedNote.id,
        createdAt: new Date(),
        recentlySaved: true // Mark as recently saved for highlighting
      }));
      
      // Log for debugging
      console.log('Saving flashcards associated with note ID:', selectedNote.id);
      console.log('Total flashcards to save:', flashcardsToSave.length);
      
      if (flashcardsToSave.length === 0) {
        showNotification(`No new flashcards to save for "${selectedNote.title}"`, 'info', 'flashcard');
        setNoteToFlashcardsDialogOpen(false);
        return;
      }
      
      // Add flashcards directly to the app state first for immediate feedback
      dispatch({ type: 'ADD_FLASHCARDS', payload: flashcardsToSave });
      
      // Then save each flashcard to the backend
      try {
        const savePromises = flashcardsToSave.map(card => 
          api.createFlashcard({
            front: card.front,
            back: card.back,
            tags: card.tags,
            noteId: card.noteId
          })
        );
        
        await Promise.all(savePromises);
        
        // Show notification with proper parameters
        showNotification(
          `flashcards saved and ready to study!`, 
          'success', 
          'flashcard',
          selectedNote.title
        );
        
        // Close the dialog
        setNoteToFlashcardsDialogOpen(false);
        setAiDialogOpen(false);
        
        // Reset the current index to show the first card
        setCurrentIndex(0);
        
        // Ensure answer is hidden when starting study mode
        setIsFlipped(false);
        
        // Always navigate to the flashcards screen
        navigate('/flashcards');
        
        // Switch to study mode tab to show the newly created flashcards
        setActiveTab('study' as TabValue);
        
        // Set to show flashcards for the selected note in study mode
        setActiveNoteId(selectedNote.id);
        setViewMode('byNote');
        setFocusedStudyMode(true);
        
        // Clear search filters
        setSearchQuery('');
        setStudyModeSearchQuery('');
        
        // Set highlight on the Study Mode tab to draw user's attention
        setHighlightTab('study');
        
        console.log("Switched to study mode view to show saved flashcards");
      } catch (error) {
        console.error('Error saving flashcards to backend:', error);
        showNotification(`"${selectedNote.title}" Failed to save flashcards. Please try again.`, 'error', 'flashcard');
      }
    } catch (error) {
      console.error('Error in handleSaveNoteFlashcards:', error);
      showNotification(`"${selectedNote.title}" Failed to save flashcards. Please try again.`, 'error', 'flashcard');
    }
  };

  // Handle closing focused study mode
  const handleCloseFocusedMode = () => {
    setFocusedStudyMode(false);
    setViewMode('all');
    setActiveNoteId(null);
    setCurrentIndex(0);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Reset to first card and hide answer when search changes
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    // Reset to first card and hide answer when search is cleared
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Handlers for study mode search
  const handleStudyModeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStudyModeSearchQuery(e.target.value);
  };

  const handleClearStudyModeSearch = () => {
    setStudyModeSearchQuery('');
  };

  // Function to handle cancel during flashcard creation
  const handleCancelCreation = () => {
    // Check if there are unsaved changes
    const hasUnsavedChanges = newFlashcard.front.trim() !== '' || 
                             newFlashcard.back.trim() !== '' || 
                             newFlashcard.tags.length > 0;
    
    if (hasUnsavedChanges) {
      // Show confirmation dialog
      if (window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
        resetCreationForm();
      }
    } else {
      // No changes, just close
      resetCreationForm();
    }
  };
  
  // Reset the creation form
  const resetCreationForm = () => {
    setNewFlashcard({
      front: '',
      back: '',
      tags: [],
    });
    setCurrentNewTag('');
    setOpenCreateForm(false);
    
    // Ensure we properly reset state
    setActiveTab('history');
    setViewMode('all');
    setCurrentIndex(0);
  };
  
  // Function to create a new flashcard
  const handleCreateFlashcard = () => {
    const flashcard: Flashcard = {
      id: uuidv4(),
      front: newFlashcard.front,
      back: newFlashcard.back,
      tags: newFlashcard.tags,
      createdAt: new Date()
    };
    
    // Add to global state
    dispatch({ type: 'ADD_FLASHCARDS', payload: [flashcard] });
    
    // Show success message using global notification system
    // Use the front side as the "title" of the flashcard
    const flashcardTitle = newFlashcard.front.substring(0, 30) + (newFlashcard.front.length > 30 ? '...' : '');
    showNotification('created successfully', 'success', 'flashcard', flashcardTitle);
    
    // Reset form
    resetCreationForm();
    
    // Force redirect to dashboard at root path
    window.location.href = '/';
  };

  // Export selected flashcards to Anki format
  const handleExportSelected = (cardsToExport: Flashcard[]) => {
    if (cardsToExport.length === 0) {
      cardsToExport = [filteredFlashcards[currentIndex]]; // Export current card if none selected
    }
    
    // Format for Anki compatibility
    const ankiFormat = cardsToExport.map(card => ({
      front: card.front,
      back: card.back,
      tags: card.tags.join(' ')
    }));

    const blob = new Blob([JSON.stringify(ankiFormat, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anki-flashcards.json';
    a.click();
    URL.revokeObjectURL(url);
    
    // Use global notification system with a better message
    showNotification(`exported to Anki format`, 'success', 'flashcard', 
      `${cardsToExport.length} flashcard${cardsToExport.length > 1 ? 's' : ''}`);
  };

  // Get title of the currently active note
  const getActiveNoteTitle = () => {
    if (activeNoteId) {
      const note = state.notes.find(n => n.id === activeNoteId);
      return note?.title || "Selected Note";
    }
    return null;
  };

  // Function to toggle answer visibility
  const handleToggleAnswer = () => {
    // No longer needed, but keep the function to avoid breaking references
    // setIsFlipped(!isFlipped);
  };

  // Replace the handleDeleteFlashcard function with a function that deletes all cards in a note
  const handleDeleteFlashcard = (cardId: string) => {
    // Find the card to delete for confirmation
    const cardToDelete = flashcards.find(card => card.id === cardId);
    if (!cardToDelete) return;
    
    // Check if this card belongs to a note
    if (cardToDelete.noteId) {
      // Find all cards with the same noteId
      const cardsFromSameNote = flashcards.filter(card => card.noteId === cardToDelete.noteId);
      
      // Set the cards for confirmation
      setFlashcardToDelete(cardToDelete);
      setDeleteConfirmOpen(true);
    } else {
      // If the card doesn't belong to a note, just delete the individual card
      setFlashcardToDelete(cardToDelete);
      setDeleteConfirmOpen(true);
    }
  };

  const confirmDeleteFlashcard = () => {
    if (!flashcardToDelete) return;
    
    // Check if this card belongs to a note
    if (flashcardToDelete.noteId) {
      // Find all cards with the same noteId
      const cardsFromSameNote = flashcards.filter(card => card.noteId === flashcardToDelete.noteId);
      
      // Get the card IDs
      const cardIds = cardsFromSameNote.map(card => card.id);
      
      // Delete each card
      cardIds.forEach(id => {
        dispatch({ type: 'DELETE_FLASHCARD', payload: id });
      });
      
      // Show notification with count
      showNotification(`${cardIds.length} flashcards deleted successfully`, 'success', 'flashcard');
    } else {
      // Just delete the single card
      dispatch({ type: 'DELETE_FLASHCARD', payload: flashcardToDelete.id });
      showNotification('Flashcard deleted successfully', 'success', 'flashcard');
    }
    
    // Close dialog
    setDeleteConfirmOpen(false);
    setFlashcardToDelete(null);
  };

  // Add clearAllFlashcards function after confirmDeleteFlashcard
  const clearAllFlashcards = () => {
    // Dispatch the clear all action
    dispatch({ type: 'CLEAR_FLASHCARDS' });
    
    // Show notification
    showNotification('All flashcards deleted successfully', 'success', 'flashcard');
    
    // Close dialog
    setClearAllConfirmOpen(false);
  };

  // Effect to clear the recentlySaved flag after a delay
  useEffect(() => {
    const recentlySavedCards = flashcards.filter(card => card.recentlySaved);
    
    if (recentlySavedCards.length > 0) {
      const timer = setTimeout(() => {
        // Update each card to remove the recentlySaved flag
        recentlySavedCards.forEach(card => {
          const updatedCard = { ...card, recentlySaved: false };
          dispatch({ type: 'UPDATE_FLASHCARD', payload: updatedCard });
        });
      }, 5000); // Clear after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [flashcards, dispatch]);

  const renderStudyMode = () => (
    <Box sx={{ mt: 3 }}>
      {/* Search Field - Only show if not in focused study mode */}
      {!focusedStudyMode && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search flashcards by note title..."
            value={studyModeSearchQuery}
            onChange={handleStudyModeSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: studyModeSearchQuery && (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClearStudyModeSearch} 
                    edge="end" 
                    size="small"
                    aria-label="Clear search"
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
        </Paper>
      )}

      {/* Generate from Note Button - Main focus of the study mode */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          justifyContent: 'space-between',
          gap: 2
        }}>
          <Box>
            <Typography variant="h6" gutterBottom>Generate from Notes</Typography>
            <Typography variant="body2" color="text.secondary">
              {notesToSelectFrom.length > 0 
                ? "Generate flashcards directly from your existing notes for more focused study materials."
                : "You don't have any notes yet. Create notes first to generate flashcards from them."}
            </Typography>
          </Box>
          <Button
            variant="contained" 
            color="primary"
            startIcon={<FolderIcon />}
            onClick={() => {
              // Open dialog to select note
              setAiDialogOpen(true);
            }}
            disabled={notesToSelectFrom.length === 0}
            sx={{ 
              whiteSpace: 'nowrap',
              px: 2,
              py: { xs: 1, sm: 1.5 }
            }}
          >
            Select Note
          </Button>
        </Box>
      </Paper>

      {/* If in focused study mode, show the active note title */}
      {focusedStudyMode && activeNoteId && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          p: 3,
          bgcolor: alpha(theme.palette.primary.main, 0.08),
          borderRadius: 2,
          border: highlightTab === 'study' ? `2px solid ${theme.palette.secondary.main}` : 'none',
          boxShadow: highlightTab === 'study' ? 3 : 1
        }}>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Studying: {getActiveNoteTitle()}
              {highlightTab === 'study' && (
                <Box component="span" sx={{ 
                  ml: 2, 
                  color: 'secondary.main',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  padding: '4px 8px',
                  bgcolor: alpha(theme.palette.secondary.main, 0.1),
                  borderRadius: 1
                }}>
                  JUST ADDED
                </Box>
              )}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {filteredFlashcards.length} flashcards available
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<CloseIcon />}
            onClick={handleCloseFocusedMode}
          >
            Exit Study Mode
          </Button>
        </Box>
      )}

      {/* Flashcards by Note Section - Moved from Flashcards tab to Study Mode tab */}
      {!focusedStudyMode && notesWithFlashcards.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Flashcards by Note
          </Typography>
          <Box 
            sx={{ 
              maxHeight: '420px', // Increased height for more cards before scrolling
              overflowY: 'auto',
              pr: 1, // Add padding for scrollbar
              // Custom scrollbar styling
              '&::-webkit-scrollbar': {
                width: '10px',
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-track': {
                background: alpha(theme.palette.primary.main, 0.05),
                borderRadius: '10px',
                margin: '4px 0',
              },
              '&::-webkit-scrollbar-thumb': {
                background: alpha(theme.palette.primary.main, 0.25),
                borderRadius: '10px',
                border: `2px solid transparent`,
                backgroundClip: 'padding-box',
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.35),
                  border: `2px solid transparent`,
                  backgroundClip: 'padding-box',
                },
              },
              // Firefox scrollbar
              scrollbarWidth: 'thin',
              scrollbarColor: `${alpha(theme.palette.primary.main, 0.25)} ${alpha(theme.palette.primary.main, 0.05)}`,
            }}
          >
            <Grid container spacing={2}>
              {filteredNotesWithFlashcards.map(noteId => {
                const noteCards = flashcardsByNote.get(noteId) || [];
                const noteInfo = state.notes.find(n => n.id === noteId);
                if (!noteInfo) return null;
                return (
                  <Grid item xs={12} sm={6} md={4} key={noteId}>
                    <Card 
                      sx={{ 
                        height: '210px', // Increased height for better content fit
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 3
                        },
                        position: 'relative',
                        minWidth: 0,
                        maxWidth: '100%',
                      }}
                      onClick={() => viewExistingFlashcards(noteId)}
                    >
                      <IconButton
                        size="small"
                        color="error"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 10,
                          bgcolor: alpha(theme.palette.background.paper, 0.7),
                          '&:hover': {
                            bgcolor: alpha(theme.palette.error.light, 0.2),
                          },
                          transition: 'all 0.2s ease'
                        }}
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent opening the card
                          handleDeleteFlashcard(noteCards[0].id); // Delete the first card of the note
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography 
                          variant="h6" 
                          gutterBottom
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {noteInfo.title}
                        </Typography>
                        
                        <Divider sx={{ mt: 1, mb: 2 }} />
                        
                        <Typography variant="body2" color="text.secondary">
                          {noteCards.length} flashcard{noteCards.length !== 1 ? 's' : ''}
                        </Typography>
                      </CardContent>
                      
                      <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-end' }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              viewExistingFlashcards(noteId);
                            }}
                          >
                            Study
                          </Button>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
            {studyModeSearchQuery && filteredNotesWithFlashcards.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  No flashcard sets match "{studyModeSearchQuery}"
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Empty state when there are notes but no selection yet and no existing flashcards */}
      {!focusedStudyMode && notesToSelectFrom.length > 0 && notesWithFlashcards.length === 0 && (
        <Box sx={{ 
          textAlign: 'center', 
          py: 6, 
          px: 2, 
          bgcolor: alpha(theme.palette.background.paper, 0.7),
          borderRadius: 2
        }}>
          <Typography variant="h5" gutterBottom>Select a Note to Generate Flashcards</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: '600px', mx: 'auto' }}>
            Click the "Select Note" button above to choose a note and generate flashcards.
          </Typography>
          <Box sx={{ 
            maxWidth: '500px', 
            mx: 'auto', 
            p: 3, 
            bgcolor: alpha(theme.palette.info.main, 0.1),
            borderRadius: 2
          }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium' }} color="info.main">
              Pro Tip:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              After generating flashcards, they will be saved to the Flashcards tab for future reference.
            </Typography>
          </Box>
        </Box>
      )}

      {/* Flashcard display with backdrop when in focused mode */}
      {focusedStudyMode && filteredFlashcards.length > 0 && (
        <Box sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10,
          backdropFilter: 'blur(5px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          px: 2,
          py: 4,
          overflow: 'auto'
        }}>
          <Box sx={{ 
            width: '100%', 
            maxWidth: '700px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            mb: 4
          }}>
            <Typography variant="h5" sx={{ color: 'white', mb: 3, fontWeight: 'bold' }}>
              Studying: {getActiveNoteTitle() || 'Flashcards'}
            </Typography>

            {/* Single flashcard study UI */}
            <Box sx={{
              width: '100%',
              maxWidth: 600,
              minHeight: 300,
              bgcolor: 'rgba(30,40,60,0.95)',
              borderRadius: 4,
              boxShadow: 6,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              mb: 3,
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              '&:hover': {
                boxShadow: 12,
              },
            }}
              onClick={() => setIsFlipped(f => !f)}
            >
              <Box sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 4,
                minHeight: 220,
              }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  {isFlipped ? 'Answer' : 'Question'}
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    textAlign: 'center', 
                    wordBreak: 'break-word', 
                    fontWeight: 600, 
                    fontSize: '1.3rem', 
                    minHeight: 60,
                    color: isFlipped ? '#F47C29' : 'inherit',
                  }}
                >
                  {isFlipped ? filteredFlashcards[currentIndex].back : filteredFlashcards[currentIndex].front}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                  Click card to {isFlipped ? 'hide answer' : 'show answer'}
                </Typography>
              </Box>
            </Box>

            {/* Navigation and actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <IconButton onClick={handlePrevious} disabled={currentIndex === 0} size="large" color="primary">
                <PrevIcon />
              </IconButton>
              <Typography variant="body1" color="white" sx={{ minWidth: 60, textAlign: 'center' }}>
                {filteredFlashcards.length > 0 ? `${currentIndex + 1} / ${filteredFlashcards.length}` : ''}
              </Typography>
              <IconButton onClick={handleNext} disabled={currentIndex === filteredFlashcards.length - 1} size="large" color="primary">
                <NextIcon />
              </IconButton>
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button 
                variant="contained"
                color="secondary"
                onClick={handleCloseFocusedMode}
                startIcon={<CloseIcon />}
              >
                Close
              </Button>
              <Button 
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => handleExportSelected([filteredFlashcards[currentIndex]])}
              >
                Export Card
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  const renderHistoryMode = () => (
    <Box sx={{ mt: 3 }}>
      {/* Search Field */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search flashcards by title, content, or tags..."
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  onClick={handleClearSearch} 
                  edge="end" 
                  size="small"
                  aria-label="Clear search"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            }
          }}
        />
      </Paper>

      {/* Display search results count if searching */}
      {searchQuery && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Found {filteredFlashcards.length} {filteredFlashcards.length === 1 ? 'result' : 'results'} 
          for "{searchQuery}"
        </Typography>
      )}

      {/* All Flashcards Grid */}
      <Box sx={{ mt: 2 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h6">
            All Flashcards
          </Typography>
          {filteredFlashcards.length > 0 && (
            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<DeleteIcon />}
              onClick={() => setClearAllConfirmOpen(true)}
            >
              Clear All Flashcards
            </Button>
          )}
        </Box>
        
        {filteredFlashcards.length > 0 ? (
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: 'row',
              gap: 2,
              overflowX: 'auto',
              pb: 2, // Add padding bottom for scrollbar
              px: 1, // Add padding on sides
              // Custom scrollbar styling
              '&::-webkit-scrollbar': {
                height: '8px',
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-track': {
                background: alpha(theme.palette.primary.main, 0.05),
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: alpha(theme.palette.primary.main, 0.2),
                borderRadius: '10px',
                '&:hover': {
                  background: alpha(theme.palette.primary.main, 0.3),
                },
              },
              // Firefox scrollbar
              scrollbarWidth: 'thin',
              scrollbarColor: `${alpha(theme.palette.primary.main, 0.2)} ${alpha(theme.palette.primary.main, 0.05)}`,
            }}
          >
            {filteredFlashcards.map((card) => (
              <Card 
                key={card.id}
                sx={{ 
                  minWidth: { xs: '85%', sm: '350px', md: '380px' },
                  maxWidth: { xs: '85%', sm: '350px', md: '380px' },
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  },
                  ...(card.recentlySaved && {
                    boxShadow: `0 0 0 2px ${theme.palette.secondary.main}`,
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '0',
                      height: '0',
                      borderStyle: 'solid',
                      borderWidth: '0 16px 16px 0',
                      borderColor: `transparent ${theme.palette.secondary.main} transparent transparent`,
                    }
                  })
                }}
              >
                <CardContent sx={{ 
                  flexGrow: 1, 
                  display: 'flex', 
                  flexDirection: 'column',
                  p: 3 // Increase padding for better readability
                }}>
                  <Typography 
                    variant="h6" 
                    gutterBottom
                    sx={{
                      mb: 2, // Add more space below title
                      wordBreak: 'break-word'
                    }}
                  >
                    {card.front}
                  </Typography>
                  
                  <Divider sx={{ mt: 1, mb: 2 }} />
                  
                  <Typography 
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      wordBreak: 'break-word',
                      flexGrow: 1
                    }}
                  >
                    {card.back}
                  </Typography>
                  
                  {/* Tags section */}
                  {card.tags && card.tags.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {card.tags.slice(0, 3).map((tag, index) => (
                        <Chip 
                          key={index} 
                          label={tag} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                          sx={{ borderRadius: '4px' }}
                        />
                      ))}
                      {card.tags.length > 3 && (
                        <Chip 
                          label={`+${card.tags.length - 3}`} 
                          size="small" 
                          variant="outlined"
                          sx={{ borderRadius: '4px' }}
                        />
                      )}
                    </Box>
                  )}
                </CardContent>
                
                <Box sx={{ 
                  p: 2, 
                  pt: 0, 
                  borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  mt: 'auto' // Push to bottom
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        display: 'block'
                      }}
                    >
                      {new Date(card.createdAt).toLocaleDateString()}
                    </Typography>
                    
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteFlashcard(card.id)}
                      aria-label="Delete flashcard"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              No flashcards found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {searchQuery ? 
                "No flashcards match your search criteria." : 
                "You haven't created any flashcards yet."}
            </Typography>
            
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setActiveTab('study');
                setSearchQuery('');
              }}
            >
              Generate Flashcards
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ px: { xs: 1, sm: 2 }, py: 2, maxWidth: '1400px', margin: '0 auto' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: { xs: 'wrap', sm: 'nowrap' },
        gap: 2
      }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          My Flashcards
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
          '& .MuiTab-root': {
            fontWeight: 600,
          }
        }}
      >
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SchoolIcon sx={{ mr: 1 }} />
              Study Mode
            </Box>
          }
          value="study"
        />
        <Tab
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <HistoryIcon sx={{ mr: 1 }} />
              Flashcards
              {highlightTab === 'history' && (
                <Box 
                  component="span" 
                  sx={{ 
                    ml: 1, 
                    fontSize: '0.75rem', 
                    color: 'secondary.main',
                    fontWeight: 'bold',
                    animation: 'pulse 1.5s infinite'
                  }}
                >
                  • New!
                </Box>
              )}
            </Box>
          }
          value="history"
          sx={{
            ...(highlightTab === 'history' && {
              backgroundColor: alpha(theme.palette.secondary.main, 0.1),
              transition: 'background-color 0.3s ease'
            })
          }}
        />
      </Tabs>

      {activeTab === 'study' ? renderStudyMode() : renderHistoryMode()}

      {/* Enhanced Note Selection Dialog */}
      <Dialog
        open={aiDialogOpen}
        onClose={() => {
          if (!isGeneratingFromNote) {
            setAiDialogOpen(false);
            setActiveTab('study');
            setViewMode('all');
          }
        }}
        fullWidth
        maxWidth="md"
        sx={{
          '& .MuiDialog-paper': {
            maxHeight: '80vh',
          }
        }}
      >
        <DialogTitle>
          Select a Note to Generate Flashcards
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          {isGeneratingFromNote ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Generating flashcards based on note content...</Typography>
            </Box>
          ) : (
            <>
              {notesToSelectFrom.length > 0 ? (
                <Grid container spacing={2}>
                  {notesToSelectFrom.map(note => {
                    // Check if note already has flashcards
                    const hasExistingFlashcards = noteHasFlashcards(note.id);
                    
                    return (
                      <Grid item xs={12} sm={6} key={note.id}>
                        <Card 
                          sx={{ 
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 3,
                              bgcolor: alpha(theme.palette.primary.light, 0.05)
                            },
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            position: 'relative'
                          }}
                          onClick={() => handleGenerateFromNote(note)}
                        >
                          {hasExistingFlashcards && (
                            <Box sx={{
                              position: 'absolute',
                              top: 10,
                              right: 10,
                              bgcolor: theme.palette.success.main,
                              color: 'white',
                              borderRadius: 1,
                              px: 1,
                              py: 0.5,
                              fontSize: '0.75rem',
                              fontWeight: 'bold'
                            }}>
                              Flashcards Available
                            </Box>
                          )}
                          
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" gutterBottom title={note.title} sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                            }}>
                              {note.title}
                            </Typography>
                            <Typography 
                              variant="body2" 
                              color="text.secondary"
                              sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                mb: 2
                              }}
                            >
                              {note.content.replace(/<[^>]*>/g, '').substring(0, 150)}
                              {note.content.length > 150 ? '...' : ''}
                            </Typography>
                            
                            <Box sx={{ mt: 'auto', textAlign: 'right' }}>
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleGenerateFromNote(note);
                                }}
                                color={hasExistingFlashcards ? "success" : "primary"}
                              >
                                {hasExistingFlashcards ? "View Flashcards" : "Generate Flashcards"}
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" gutterBottom>
                    You don't have any notes yet.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={() => {
                      navigate('/editor');
                      setAiDialogOpen(false);
                    }}
                    sx={{ mt: 2 }}
                  >
                    Create a Note First
                  </Button>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setAiDialogOpen(false);
              // Remove the redirect to fix loss of data
              // window.location.href = '/';
            }}
            color="inherit"
            disabled={isGeneratingFromNote}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Note to Flashcards Dialog */}
      <Dialog
        open={noteToFlashcardsDialogOpen}
        onClose={() => {
          if (!isGeneratingFromNote) {
            setNoteToFlashcardsDialogOpen(false);
            // Don't reset note or flashcards on close
          }
        }}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Generate Flashcards from Note
          {isGeneratingFromNote && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </DialogTitle>
        <DialogContent dividers>
          {isGeneratingFromNote ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Generating flashcards based on note content...</Typography>
            </Box>
          ) : (
            <>
              {selectedNote && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Source Note: {selectedNote.title}
                  </Typography>
                </Box>
              )}

              {generatedFlashcards.length > 0 ? (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Generated Flashcards ({generatedFlashcards.length})
                  </Typography>
                  {generatedFlashcards.map((card, index) => (
                    <Card key={index} sx={{ mb: 2, bgcolor: alpha(theme.palette.secondary.main, 0.05) }}>
                      <CardContent>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          Q: {card.question}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body1">
                          A: {card.answer}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No flashcards could be generated. Try with a different note or create flashcards manually.
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setNoteToFlashcardsDialogOpen(false);
              // Remove these resets to prevent data loss
              // setSelectedNote(null);
              // setGeneratedFlashcards([]);
              // Remove the redirect to prevent data loss
              // window.location.href = '/';
            }} 
            color="inherit"
            disabled={isGeneratingFromNote}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveNoteFlashcards} 
            color="primary"
            variant="contained"
            disabled={isGeneratingFromNote || generatedFlashcards.length === 0}
            startIcon={<SaveIcon />}
          >
            Save Flashcards
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Flashcards</DialogTitle>
        <DialogContent>
          {flashcardToDelete?.noteId ? (
            <Typography>
              Are you sure you want to delete all flashcards related to this topic?
            </Typography>
          ) : (
            <Typography>
              Are you sure you want to delete this flashcard?
            </Typography>
          )}
          {flashcardToDelete && (
            <>
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 2, 
                  p: 2, 
                  bgcolor: alpha(theme.palette.error.main, 0.05),
                  borderRadius: 1,
                  fontWeight: 'medium' 
                }}
              >
                "{flashcardToDelete.front}"
              </Typography>
              
              {flashcardToDelete.noteId && (
                <Typography 
                  variant="body2" 
                  color="error"
                  sx={{ mt: 1 }}
                >
                  This will delete all flashcards belonging to this topic.
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={confirmDeleteFlashcard} 
            color="error" 
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear All Confirmation Dialog */}
      <Dialog
        open={clearAllConfirmOpen}
        onClose={() => setClearAllConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Clear All Flashcards</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete all flashcards? This action cannot be undone.
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              mt: 2, 
              p: 2, 
              bgcolor: alpha(theme.palette.error.main, 0.05),
              borderRadius: 1,
              fontWeight: 'medium' 
            }}
          >
            This will delete all {flashcards.length} flashcards.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearAllConfirmOpen(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={clearAllFlashcards} 
            color="error" 
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Delete All
          </Button>
        </DialogActions>
      </Dialog>

      {/* Display notifications - now using global notification system */}

      {/* Create Flashcard Dialog */}
      <Dialog
        open={openCreateForm}
        onClose={() => handleCancelCreation()}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Create New Flashcard</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mt: 1 }}>
            <TextField
              label="Front (Question)"
              multiline
              rows={3}
              fullWidth
              variant="outlined"
              value={newFlashcard.front}
              onChange={e => setNewFlashcard({...newFlashcard, front: e.target.value})}
              sx={{ mb: 3 }}
            />
            
            <TextField
              label="Back (Answer)"
              multiline
              rows={3}
              fullWidth
              variant="outlined"
              value={newFlashcard.back}
              onChange={e => setNewFlashcard({...newFlashcard, back: e.target.value})}
              sx={{ mb: 3 }}
            />
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Tags
              </Typography>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {newFlashcard.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={tag}
                    onDelete={() => {
                      const updatedTags = [...newFlashcard.tags];
                      updatedTags.splice(index, 1);
                      setNewFlashcard({...newFlashcard, tags: updatedTags});
                    }}
                    color="primary"
                    variant="outlined"
                  />
                ))}
                
                {newFlashcard.tags.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No tags added yet
                  </Typography>
                )}
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="Add Tag"
                  size="small"
                  variant="outlined"
                  value={currentNewTag}
                  onChange={e => setCurrentNewTag(e.target.value)}
                  onKeyPress={e => {
                    if (e.key === 'Enter' && currentNewTag.trim()) {
                      e.preventDefault();
                      if (!newFlashcard.tags.includes(currentNewTag.trim())) {
                        setNewFlashcard({
                          ...newFlashcard, 
                          tags: [...newFlashcard.tags, currentNewTag.trim()]
                        });
                      }
                      setCurrentNewTag('');
                    }
                  }}
                />
                
                <Button
                  variant="outlined"
                  onClick={() => {
                    if (currentNewTag.trim() && !newFlashcard.tags.includes(currentNewTag.trim())) {
                      setNewFlashcard({
                        ...newFlashcard, 
                        tags: [...newFlashcard.tags, currentNewTag.trim()]
                      });
                      setCurrentNewTag('');
                    }
                  }}
                  disabled={!currentNewTag.trim()}
                >
                  Add
                </Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCancelCreation} 
            color="inherit"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateFlashcard} 
            color="primary"
            variant="contained"
            disabled={!newFlashcard.front.trim() || !newFlashcard.back.trim()}
          >
            Create Flashcard
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Flashcards; 