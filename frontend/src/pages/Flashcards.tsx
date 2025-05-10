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
  CircularProgress,
  TextField,
  Input,
  InputLabel,
  FormControl,
  Tooltip
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
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { api, AIModel, Flashcard as ApiFlashcard } from '../services/api';
import { v4 as uuidv4 } from 'uuid';
import { createWorker } from 'tesseract.js';

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
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [imageGeneratedFlashcards, setImageGeneratedFlashcards] = useState<ApiFlashcard[]>([]);
  const [imageTags, setImageTags] = useState<string[]>([]);
  const [imageTitle, setImageTitle] = useState('');
  const [availableModel, setAvailableModel] = useState<AIModel>('llama');
  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [newFlashcard, setNewFlashcard] = useState({
    front: '',
    back: '',
    tags: [] as string[],
  });
  const [currentNewTag, setCurrentNewTag] = useState('');
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [userInputText, setUserInputText] = useState('');
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [textGeneratedFlashcards, setTextGeneratedFlashcards] = useState<ApiFlashcard[]>([]);
  const [textTitle, setTextTitle] = useState('');
  
  // Get flashcards from context
  const { state, dispatch } = useApp();
  const { flashcards } = state;

  useEffect(() => {
    // Check which AI models are available
    const checkAvailableModels = async () => {
      const health = await api.healthCheck();
      if (health && health.ai_model) {
        setAvailableModel(health.ai_model as AIModel);
      }
    };
    
    checkAvailableModels();
  }, []);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      setNotification({
        open: true,
        message: 'Please select an image file (jpg, png, etc.)',
        severity: 'error'
      });
      return;
    }
    
    try {
      setIsProcessingImage(true);
      setImageDialogOpen(true);
      setExtractedText('');
      setImageGeneratedFlashcards([]);
      
      // First try to use the backend OCR (which uses Tesseract)
      const response = await api.extractTextFromImage(file);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // If backend OCR succeeded, use the extracted text
      if (response.data?.text) {
        setExtractedText(response.data.text);
        
        // Automatically generate flashcards from the extracted text
        await generateFlashcardsFromOCRText(response.data.text);
      } else {
        // If backend failed, try client-side OCR with Tesseract.js
        await processImageWithTesseract(file);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setNotification({
        open: true,
        message: `Error processing image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setIsProcessingImage(false);
    }
  };

  const processImageWithTesseract = async (file: File) => {
    try {
      setNotification({
        open: true,
        message: 'Processing image with OCR (this may take a moment)...',
        severity: 'info'
      });
      
      // Create a worker with 'eng' language directly in v5
      const worker = await createWorker('eng');
      
      // Create URL for the image file
      const imageURL = URL.createObjectURL(file);
      
      // Recognize text in the image
      const { data } = await worker.recognize(imageURL);
      
      if (data.text && data.text.length > 20) {
        setExtractedText(data.text);
        
        // Automatically generate flashcards from the extracted text
        await generateFlashcardsFromOCRText(data.text);
      } else {
        setNotification({
          open: true,
          message: 'Could not extract sufficient text from the image. Try a clearer image.',
          severity: 'warning'
        });
      }
      
      // Clean up
      await worker.terminate();
      URL.revokeObjectURL(imageURL);
    } catch (error) {
      console.error('Tesseract OCR error:', error);
      throw new Error('Client-side OCR failed. Try a different image or improve image quality.');
    }
  };

  const generateFlashcardsFromOCRText = async (text: string) => {
    try {
      setIsProcessingImage(true);
      
      // Use the title if provided, otherwise create a default title
      const titleToUse = imageTitle || 'Image OCR Flashcards';
      
      // Call API to generate flashcards
      const result = await api.generateFlashcardsFromText(text, titleToUse, availableModel as AIModel);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.data?.flashcards && result.data.flashcards.length > 0) {
        setImageGeneratedFlashcards(result.data.flashcards);
        
        // Extract potential tags from the title
        if (titleToUse) {
          const titleWords = titleToUse.split(' ');
          if (titleWords.length > 0) {
            setImageTags([titleToUse]);
          }
        }
        
        setNotification({
          open: true,
          message: `Generated ${result.data.flashcards.length} flashcards from image!`,
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: 'Could not generate flashcards from the extracted text.',
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      setNotification({
        open: true,
        message: `Error generating flashcards: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setIsProcessingImage(false);
    }
  };

  const saveImageFlashcards = () => {
    if (imageGeneratedFlashcards.length === 0) {
      return;
    }
    
    // Convert the API flashcard format to the app's flashcard format
    const flashcardsToSave = imageGeneratedFlashcards.map(card => ({
      id: uuidv4(),
      front: card.question,
      back: card.answer,
      tags: [...imageTags, ...card.tags],
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
    setImageDialogOpen(false);
    
    // Reset states
    setExtractedText('');
    setImageGeneratedFlashcards([]);
    setImageTitle('');
    setImageTags([]);
  };

  const handleCreateFlashcard = () => {
    if (!newFlashcard.front || !newFlashcard.back) {
      setNotification({
        open: true,
        message: 'Please provide both front and back content for the flashcard',
        severity: 'warning'
      });
      return;
    }
    
    const flashcard = {
      id: uuidv4(),
      front: newFlashcard.front,
      back: newFlashcard.back,
      tags: newFlashcard.tags,
      createdAt: new Date()
    };
    
    dispatch({ type: 'ADD_FLASHCARD', payload: flashcard });
    
    setNotification({
      open: true,
      message: 'Flashcard created successfully!',
      severity: 'success'
    });
    
    // Reset form
    setNewFlashcard({
      front: '',
      back: '',
      tags: [],
    });
    setCurrentNewTag('');
    setOpenCreateForm(false);
  };

  const handleTextToFlashcards = async () => {
    if (!userInputText || userInputText.trim().length < 50) {
      setNotification({
        open: true,
        message: 'Please enter more text to generate meaningful flashcards',
        severity: 'warning'
      });
      return;
    }

    try {
      setIsProcessingText(true);
      
      // Call API to generate flashcards from text
      const result = await api.generateFlashcardsFromText(userInputText, textTitle, availableModel as AIModel);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (result.data?.flashcards && result.data.flashcards.length > 0) {
        setTextGeneratedFlashcards(result.data.flashcards);
        
        setNotification({
          open: true,
          message: `Generated ${result.data.flashcards.length} flashcards!`,
          severity: 'success'
        });
      } else {
        setNotification({
          open: true,
          message: 'Could not generate flashcards from the provided text.',
          severity: 'warning'
        });
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      setNotification({
        open: true,
        message: `Error generating flashcards: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setIsProcessingText(false);
    }
  };

  const saveTextFlashcards = () => {
    if (textGeneratedFlashcards.length === 0) {
      return;
    }
    
    // Convert the API flashcard format to the app's flashcard format
    const flashcardsToSave = textGeneratedFlashcards.map(card => ({
      id: uuidv4(),
      front: card.question,
      back: card.answer,
      tags: textTitle ? [textTitle] : [],
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
    setTextDialogOpen(false);
    
    // Reset states
    setUserInputText('');
    setTextGeneratedFlashcards([]);
    setTextTitle('');
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          My Flashcards
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateForm(true)}
          >
            Create Flashcard
          </Button>
          
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ImageIcon />}
            component="label"
            sx={{ ml: 2 }}
          >
            Image to Flashcards
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageUpload}
            />
          </Button>
          
          <Button
            variant="contained"
            color="info"
            startIcon={<PsychologyIcon />}
            onClick={() => setTextDialogOpen(true)}
            sx={{ ml: 2 }}
          >
            Text to Flashcards
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
      
      {/* Image OCR Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => !isProcessingImage && setImageDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Image to Flashcards
          {isProcessingImage && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </DialogTitle>
        <DialogContent dividers>
          {isProcessingImage ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Processing image and generating flashcards...</Typography>
            </Box>
          ) : (
            <Box>
              {extractedText && (
                <>
                  <Box sx={{ mb: 3 }}>
                    <TextField
                      label="Flashcard Set Title"
                      fullWidth
                      value={imageTitle}
                      onChange={(e) => setImageTitle(e.target.value)}
                      sx={{ mb: 2 }}
                    />
                    
                    <Typography variant="subtitle1" gutterBottom>
                      Extracted Text:
                    </Typography>
                    <Paper 
                      elevation={0} 
                      sx={{ 
                        p: 2, 
                        maxHeight: '150px', 
                        overflow: 'auto',
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        mb: 2
                      }}
                    >
                      <Typography variant="body2">{extractedText}</Typography>
                    </Paper>
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    Generated Flashcards:
                  </Typography>
                  
                  {imageGeneratedFlashcards.length > 0 ? (
                    <Box>
                      {imageGeneratedFlashcards.map((card, index) => (
                        <Card key={index} sx={{ mb: 2, bgcolor: alpha(theme.palette.secondary.main, 0.05) }}>
                          <CardContent>
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              Front: {card.question}
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="body1">
                              Back: {card.answer}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              {imageTags.map((tag, tagIndex) => (
                                <Chip 
                                  key={`title-${tagIndex}`} 
                                  label={tag} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ mr: 0.5, mt: 0.5 }}
                                />
                              ))}
                              {card.tags.map((tag, tagIndex) => (
                                <Chip 
                                  key={`card-${tagIndex}`} 
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
                      No flashcards could be generated. Try with a different image or manually enter flashcards.
                    </Typography>
                  )}
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setImageDialogOpen(false)} 
            color="inherit"
            disabled={isProcessingImage}
            startIcon={<CancelIcon />}
          >
            Cancel
          </Button>
          <Button 
            onClick={saveImageFlashcards} 
            color="primary"
            variant="contained"
            disabled={isProcessingImage || imageGeneratedFlashcards.length === 0}
            startIcon={<SaveIcon />}
          >
            Save Flashcards
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Flashcard Creation Dialog */}
      <Dialog
        open={openCreateForm}
        onClose={() => setOpenCreateForm(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Create New Flashcard</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <TextField
              label="Front (Question)"
              fullWidth
              multiline
              rows={3}
              value={newFlashcard.front}
              onChange={(e) => setNewFlashcard({...newFlashcard, front: e.target.value})}
              sx={{ mb: 2 }}
            />
            
            <TextField
              label="Back (Answer)"
              fullWidth
              multiline
              rows={3}
              value={newFlashcard.back}
              onChange={(e) => setNewFlashcard({...newFlashcard, back: e.target.value})}
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Tags
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {newFlashcard.tags.map((tag, index) => (
                  <Chip 
                    key={index} 
                    label={tag} 
                    onDelete={() => {
                      setNewFlashcard({
                        ...newFlashcard, 
                        tags: newFlashcard.tags.filter((_, i) => i !== index)
                      });
                    }}
                    color="primary" 
                    variant="outlined"
                  />
                ))}
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  label="Add Tag"
                  size="small"
                  value={currentNewTag}
                  onChange={(e) => setCurrentNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && currentNewTag.trim()) {
                      setNewFlashcard({
                        ...newFlashcard,
                        tags: [...newFlashcard.tags, currentNewTag.trim()]
                      });
                      setCurrentNewTag('');
                      e.preventDefault();
                    }
                  }}
                  sx={{ mr: 1 }}
                />
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    if (currentNewTag.trim()) {
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
          <Button onClick={() => setOpenCreateForm(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleCreateFlashcard} 
            color="primary"
            variant="contained"
            disabled={!newFlashcard.front || !newFlashcard.back}
          >
            Create Flashcard
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Text to Flashcards Dialog */}
      <Dialog
        open={textDialogOpen}
        onClose={() => !isProcessingText && setTextDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Text to Flashcards with Llama 3
          {isProcessingText && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </DialogTitle>
        <DialogContent dividers>
          {textGeneratedFlashcards.length === 0 ? (
            <Box sx={{ mb: 3 }}>
              <TextField
                label="Title (Optional)"
                fullWidth
                value={textTitle}
                onChange={(e) => setTextTitle(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <TextField
                label="Paste your text here"
                fullWidth
                multiline
                rows={10}
                value={userInputText}
                onChange={(e) => setUserInputText(e.target.value)}
                placeholder="Enter a long paragraph or multiple paragraphs of text to generate flashcards..."
                sx={{ mb: 2 }}
              />
              
              <Button
                variant="contained" 
                color="primary"
                onClick={handleTextToFlashcards}
                disabled={isProcessingText || userInputText.trim().length < 50}
                sx={{ mt: 1 }}
              >
                {isProcessingText ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1 }} color="inherit" />
                    Processing...
                  </>
                ) : (
                  'Generate Flashcards with Llama 3'
                )}
              </Button>
            </Box>
          ) : (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Generated Flashcards:
                </Typography>
                <Button 
                  variant="outlined"
                  onClick={() => {
                    setTextGeneratedFlashcards([]);
                    setIsProcessingText(false);
                  }}
                >
                  Back to Editor
                </Button>
              </Box>
              
              {textGeneratedFlashcards.map((card, index) => (
                <Card key={index} sx={{ mb: 2, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      Front: {card.question}
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body1">
                      Back: {card.answer}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setTextDialogOpen(false);
              setUserInputText('');
              setTextGeneratedFlashcards([]);
              setTextTitle('');
            }} 
            color="inherit"
            disabled={isProcessingText}
          >
            Cancel
          </Button>
          {textGeneratedFlashcards.length > 0 && (
            <Button 
              onClick={saveTextFlashcards} 
              color="primary"
              variant="contained"
              disabled={isProcessingText}
            >
              Save All Flashcards
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000}
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