import React, { useState, useEffect } from 'react';
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
  Divider
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Download as DownloadIcon,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags: string[];
  noteId?: string;
  createdAt: Date;
}

const Flashcards: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Get flashcards from context instead of generating them
  const { state } = useApp();
  const { flashcards } = state;

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
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
      severity: 'success'
    });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const navigateToCreateNote = () => {
    navigate('/note/new');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Flashcards</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<PsychologyIcon />}
            onClick={navigateToCreateNote}
            sx={{ mr: 2 }}
          >
            Create AI Flashcards
          </Button>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleExport}
          disabled={flashcards.length === 0}
        >
          Export to Anki
        </Button>
        </Box>
      </Box>

      {/* Flashcard Display (simplified layout) */}
      {flashcards.length > 0 ? (
        <Box sx={{
          mb: 4,
          p: 2,
          borderRadius: 2,
          background: theme.palette.background.paper,
          boxShadow: 1,
          maxWidth: 800,
          mx: 'auto',
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Flashcard {currentIndex + 1} of {flashcards.length}</Typography>
            <Box>
              <IconButton
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                size="small"
              >
                <PrevIcon />
              </IconButton>
              <IconButton
                onClick={handleNext}
                disabled={currentIndex === flashcards.length - 1}
                size="small"
              >
                <NextIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: 'text.secondary' }}>
              Question {isFlipped ? '(click to see question)' : ''}
            </Typography>
            {!isFlipped && (
            <Box
              sx={{
                  p: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                  borderRadius: 1,
                  minHeight: 100,
                  '& ul': { textAlign: 'left' },
                  '& blockquote': { 
                    borderLeft: `4px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                    padding: '0.5em 1em',
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    textAlign: 'left'
                  }
                }}
                dangerouslySetInnerHTML={{ __html: flashcards[currentIndex].front }}
              />
            )}
                  </Box>
          
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, fontWeight: 500, color: 'text.secondary' }}>
              Answer {!isFlipped ? '(click to see answer)' : ''}
            </Typography>
            {isFlipped && (
              <Box
                sx={{
                  p: 2,
                  border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                  borderRadius: 1,
                  minHeight: 100,
                  '& ul': { textAlign: 'left' },
                  '& blockquote': { 
                    borderLeft: `4px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                    padding: '0.5em 1em',
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    textAlign: 'left'
                  }
                }}
                dangerouslySetInnerHTML={{ __html: flashcards[currentIndex].back }}
              />
            )}
          </Box>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {flashcards[currentIndex].tags.map((tag, index) => (
                <Chip key={index} label={tag} size="small" color="primary" variant="outlined" />
              ))}
            </Box>
            <Button 
              variant="outlined"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {isFlipped ? 'Show Question' : 'Show Answer'}
            </Button>
          </Box>
        </Box>
      ) : (
        <Alert severity="info" sx={{ my: 2 }}>
          No flashcards available. Create a new note with the AI Assistant to generate flashcards automatically.
        </Alert>
      )}
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={notification.severity} onClose={handleCloseNotification}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Flashcards; 