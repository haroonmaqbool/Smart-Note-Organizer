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
  Divider,
  Grid,
  Paper,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  NavigateNext as NextIcon,
  NavigateBefore as PrevIcon,
  Download as DownloadIcon,
  Psychology as PsychologyIcon,
  History as HistoryIcon,
  School as SchoolIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { api, AIModel, Flashcard as ApiFlashcard } from '../services/api';
import { v4 as uuidv4 } from 'uuid';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags: string[];
  noteId?: string;
  createdAt: Date;
}

// Define tab values
type TabValue = 'study' | 'history';

const Flashcards: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' | 'warning' });
  const [activeTab, setActiveTab] = useState<TabValue>('study');
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [selectedFlashcard, setSelectedFlashcard] = useState<Flashcard | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<ApiFlashcard[]>([]);
  
  // Get flashcards from context
  const { state, dispatch } = useApp();
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
    navigate('/editor');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
  };

  const handleGenerateAIFlashcards = async (flashcard: Flashcard) => {
    setSelectedFlashcard(flashcard);
    setAiDialogOpen(true);
    setIsGenerating(true);
    setGeneratedFlashcards([]);

    try {
      // Use the content of the flashcard to generate new flashcards
      const content = flashcard.front + ' ' + flashcard.back;
      const result = await api.chatbot(content, '', flashcard.tags);

      if (result.error) {
        setNotification({
          open: true,
          message: `Error generating flashcards: ${result.error}`,
          severity: 'error'
        });
        return;
      }

      if (result.data && result.data.flashcards) {
        setGeneratedFlashcards(result.data.flashcards);
      } else {
        setNotification({
          open: true,
          message: 'No flashcards could be generated from this content',
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('Error generating AI flashcards:', error);
      setNotification({
        open: true,
        message: 'Failed to generate AI flashcards',
        severity: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGeneratedFlashcards = () => {
    // Convert the API flashcard format to the app's flashcard format
    const flashcardsToSave = generatedFlashcards.map(card => ({
      id: uuidv4(),
      front: card.question,
      back: card.answer,
      tags: [...card.tags],
      createdAt: new Date()
    }));
    
    // Dispatch action to add flashcards to global state
    dispatch({ type: 'ADD_FLASHCARDS', payload: flashcardsToSave });
    
    // Show success message and close dialog
    setNotification({
      open: true,
      message: `${flashcardsToSave.length} flashcards saved successfully!`,
      severity: 'success'
    });
    setAiDialogOpen(false);
  };

  const renderStudyMode = () => (
    <>
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
    </>
  );

  const renderHistoryMode = () => (
    <Box sx={{ mt: 2 }}>
      {flashcards.length > 0 ? (
        <Grid container spacing={3}>
          {flashcards.map((card, index) => (
            <Grid item xs={12} md={6} key={card.id}>
              <Card 
                elevation={1}
                sx={{ 
                  height: '100%',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Question:
                    </Typography>
                    <Box 
                      sx={{ 
                        p: 1.5, 
                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                        borderRadius: 1,
                        minHeight: '60px',
                        mb: 2
                      }}
                      dangerouslySetInnerHTML={{ __html: card.front }}
                    />
                    
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      Answer:
                    </Typography>
                    <Box 
                      sx={{ 
                        p: 1.5, 
                        bgcolor: alpha(theme.palette.secondary.main, 0.04),
                        borderRadius: 1,
                        minHeight: '60px'
                      }}
                      dangerouslySetInnerHTML={{ __html: card.back }}
                    />
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {card.tags.slice(0, 3).map((tag, i) => (
                        <Chip key={i} label={tag} size="small" color="primary" variant="outlined" />
                      ))}
                      {card.tags.length > 3 && (
                        <Chip label={`+${card.tags.length - 3}`} size="small" color="default" variant="outlined" />
                      )}
                    </Box>
                    <Button
                      startIcon={<PsychologyIcon />}
                      size="small"
                      onClick={() => handleGenerateAIFlashcards(card)}
                      color="primary"
                    >
                      Create AI Flashcards
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info" sx={{ my: 2 }}>
          No flashcards available. Create a new note with the AI Assistant to generate flashcards automatically.
        </Alert>
      )}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Flashcards</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={navigateToCreateNote}
            sx={{ mr: 2 }}
          >
            Create Note
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

      {/* Tab navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="flashcard view modes">
          <Tab 
            icon={<SchoolIcon />} 
            iconPosition="start" 
            label="Study Mode" 
            value="study" 
          />
          <Tab 
            icon={<HistoryIcon />} 
            iconPosition="start" 
            label="Flashcard History" 
            value="history" 
          />
        </Tabs>
      </Box>

      {/* Tab content */}
      {activeTab === 'study' ? renderStudyMode() : renderHistoryMode()}
      
      {/* AI Flashcard Generation Dialog */}
      <Dialog
        open={aiDialogOpen}
        onClose={() => !isGenerating && setAiDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Generate AI Flashcards
          {isGenerating && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </DialogTitle>
        <DialogContent dividers>
          {isGenerating ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Generating flashcards based on your content...</Typography>
            </Box>
          ) : (
            <>
              {generatedFlashcards.length > 0 ? (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Generated Flashcards
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
                        <Box sx={{ mt: 1 }}>
                          {card.tags.map((tag, tagIndex) => (
                            <Chip 
                              key={tagIndex} 
                              label={tag} 
                              size="small" 
                              variant="outlined"
                              sx={{ mr: 0.5, mt: 0.5 }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No flashcards could be generated. Try with a different card or content.
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setAiDialogOpen(false)} 
            color="inherit"
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveGeneratedFlashcards} 
            color="primary"
            variant="contained"
            disabled={isGenerating || generatedFlashcards.length === 0}
          >
            Save Flashcards
          </Button>
        </DialogActions>
      </Dialog>
      
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