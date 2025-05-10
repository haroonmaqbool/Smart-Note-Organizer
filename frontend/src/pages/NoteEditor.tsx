import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Chip,
  Stack,
  Divider,
  IconButton,
  Tooltip,
  alpha,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Snackbar,
  Alert,
  useTheme,
  Fade,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Upload as UploadIcon,
  Save as SaveIcon,
  Add as AddIcon,
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  Image,
  Code,
  Link as LinkIcon,
  FormatQuote,
  Visibility,
  VisibilityOff,
  DeleteOutline,
  AttachFile,
  AutoAwesome,
  ArrowBack,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { api, AIModel, Flashcard } from '../services/api';
import { useApp } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, useLocation } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';

const NoteEditor: React.FC = () => {
  const theme = useTheme();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('Note saved successfully!');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [isLoading, setIsLoading] = useState(false);
  const [isTaggingLoading, setIsTaggingLoading] = useState(false);
  const [aiModel, setAiModel] = useState<AIModel>('llama');
  const [availableModel, setAvailableModel] = useState<string | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [redirectAfterSave, setRedirectAfterSave] = useState(false);
  
  // New state for chatbot dialog
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [isChatbotLoading, setIsChatbotLoading] = useState(false);
  const [generatedTags, setGeneratedTags] = useState<string[]>([]);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<Flashcard[]>([]);
  const [generatedSummary, setGeneratedSummary] = useState('');
  
  const showSnackbarMessage = (message: string, severity: 'success' | 'error' | 'info' | 'warning', shouldRedirect = false) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setShowSnackbar(true);
    if (shouldRedirect) {
      setRedirectAfterSave(true);
    }
  };
  
  useEffect(() => {
    // Check which AI models are available
    const checkAvailableModels = async () => {
      const health = await api.healthCheck();
      if (health && health.ai_model) {
        setAvailableModel(health.ai_model);
        setAiModel(health.ai_model as AIModel);
      }
    };
    
    checkAvailableModels();
    
    // Check for note ID in URL parameters
    const searchParams = new URLSearchParams(location.search);
    const id = searchParams.get('id');
    
    if (id) {
      setNoteId(id);
      // Find the note in the state
      const existingNote = state.notes.find(note => note.id === id);
      
      if (existingNote) {
        // Load the note data
        setTitle(existingNote.title);
        setContent(existingNote.content);
        setTags([...existingNote.tags]);
      } else {
        // Note not found
        showSnackbarMessage('Note not found', 'error');
      }
    }
  }, [location.search, state.notes]);

  // Handle redirection after save
  useEffect(() => {
    if (redirectAfterSave && !isLoading) {
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [redirectAfterSave, isLoading, navigate]);

  const autoGenerateTags = async (text: string) => {
    if (text.trim().length < 50) return;
    
    try {
      setIsTaggingLoading(true);
      const response = await api.tag(text);
      
      if (response.data?.tags) {
        // Filter out tags that are too short or already included
        const newTags = response.data.tags
          .filter(tag => 
            tag.length > 2 && 
            !tags.includes(tag) && 
            !tag.includes('.') && 
            !tag.includes(',')
          )
          .slice(0, 5); // Limit to 5 new tags
          
        if (newTags.length > 0) {
          setTags(prevTags => [...new Set([...prevTags, ...newTags])]);
        }
      }
    } catch (error) {
      console.error('Error generating tags:', error);
    } finally {
      setIsTaggingLoading(false);
    }
  };

  // New function to process content with chatbot
  const processChatbot = async () => {
    if (!content || content.length < 50) {
      showSnackbarMessage('Please add more content before using the AI assistant', 'warning');
      return;
    }
    
    try {
      setIsChatbotLoading(true);
      setChatbotOpen(true);
      
      const result = await api.chatbot(content, title, tags, aiModel);
      
      if (result.error) {
        showSnackbarMessage(`AI Assistant error: ${result.error}`, 'error');
        return;
      }
      
      if (result.data) {
        // Store the generated data
        setGeneratedTags(result.data.tags || []);
        setGeneratedFlashcards(result.data.flashcards || []);
        setGeneratedSummary(result.data.summary || '');
        
        // Show success message
        showSnackbarMessage('AI Assistant has analyzed your content!', 'success');
      }
    } catch (error) {
      console.error('Error processing content with chatbot:', error);
      showSnackbarMessage('Failed to process content with AI Assistant', 'error');
    } finally {
      setIsChatbotLoading(false);
    }
  };

  const applyGeneratedTags = () => {
    // Merge existing tags with generated tags
    setTags(prevTags => {
      const allTags = [...prevTags];
      generatedTags.forEach(tag => {
        if (!allTags.includes(tag)) {
          allTags.push(tag);
        }
      });
      return allTags;
    });
  };

  const saveFlashcards = () => {
    // Convert the API flashcard format to the app's flashcard format
    const flashcardsToSave = generatedFlashcards.map(card => ({
      id: uuidv4(),
      front: card.question,
      back: card.answer,
      tags: [...card.tags],
      noteId: noteId || uuidv4(), // This would be the note ID if we were creating a note
      createdAt: new Date()
    }));
    
    // Dispatch action to add flashcards to global state
    dispatch({ type: 'ADD_FLASHCARDS', payload: flashcardsToSave });
    
    // Show success message and close dialog
    showSnackbarMessage('Flashcards saved successfully!', 'success');
    setChatbotOpen(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setIsLoading(true);
      const response = await api.uploadFile(file);
      if (response.error) {
        showSnackbarMessage(`File upload failed: ${response.error}`, 'error');
        return;
      }
      if (response.data?.text) {
        setContent(response.data.text);
        autoGenerateTags(response.data.text);
        showSnackbarMessage('File uploaded successfully', 'success');
      } else {
        showSnackbarMessage('File upload failed: No text extracted', 'error');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showSnackbarMessage('Error uploading file', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleSave = async () => {
    if (!title.trim()) {
      setShowSnackbar(true);
      setSnackbarMessage('Please add a title for your note');
      setSnackbarSeverity('warning');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Generate summary with the API
      let summary = '';
      if (content.length > 100) {
        const summaryResult = await api.summarize(content, aiModel);
        if (!summaryResult.error && summaryResult.data) {
          summary = summaryResult.data.summary;
        }
      }
      
      if (noteId) {
        // Update existing note
        const updatedNote = {
          id: noteId,
          title,
          content,
          tags,
          summary,
          createdAt: state.notes.find(note => note.id === noteId)?.createdAt || new Date(),
          updatedAt: new Date(),
        };
        
        // Update in state context
        dispatch({ type: 'UPDATE_NOTE', payload: updatedNote });
        
        // Show success message and redirect
        showSnackbarMessage('Note updated successfully!', 'success', true);
      } else {
        // Create new note object
        const note = {
          id: uuidv4(),
          title,
          content,
          tags,
          summary,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        // Save to state context
        dispatch({ type: 'ADD_NOTE', payload: note });
        
        // Show success message and redirect
        showSnackbarMessage('Note saved successfully!', 'success', true);
      }
    } catch (error) {
      console.error('Error saving note:', error);
      showSnackbarMessage('Error saving note', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    if (noteId) {
      // If editing an existing note, just navigate back
      showSnackbarMessage('Edit cancelled', 'info');
      navigate('/dashboard');
    } else {
      // If creating a new note, clear the form
      setTitle('');
      setContent('');
      setTags([]);
      
      // This will trigger the useEffect to update the editor
      showSnackbarMessage('Note discarded', 'info');
    }
  };

  const navigateBack = () => {
    navigate('/dashboard');
  };

  const handleContentChange = (html: string) => {
    setContent(html);
    
    // Auto-generate tags if the content is long enough (and we don't have many tags yet)
    if (html.length > 200 && tags.length < 3 && !isTaggingLoading) {
      autoGenerateTags(html);
    }
  };

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={navigateBack}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1">
          {noteId ? 'Edit Note' : (title ? title : 'New Note')}
        </Typography>
        <Box>
          <Tooltip title="AI Assistant">
            <IconButton 
              onClick={processChatbot}
              disabled={isChatbotLoading || content.length < 50}
              color="primary"
            >
              <PsychologyIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={isLoading}
            sx={{ ml: 1 }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              noteId ? 'Update' : 'Save'
            )}
          </Button>
        </Box>
      </Box>

      {/* File upload button and title input */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <Button
          component="label"
          variant="outlined"
          startIcon={<UploadIcon />}
          sx={{ mr: 2 }}
        >
          Import File
          <input
            type="file"
            hidden
            accept=".txt,.md,.pdf"
            onChange={handleFileUpload}
          />
        </Button>
          <TextField
            fullWidth
            variant="outlined"
          label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          InputProps={{
            sx: {
              bgcolor: theme.palette.background.paper,
            },
          }}
        />
                </Box>

      {/* Editor area */}
      <Card sx={{ mb: 3, overflow: 'visible' }}>
        <CardContent sx={{ p: 0 }}>
          {/* Editor Toolbar */}
          {/* <Box sx={{ 
            p: 1, 
            borderBottom: `1px solid ${theme.palette.divider}`, 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1 
          }}>
            <ToggleButtonGroup
              value={formats}
              onChange={(e, newFormats) => setFormats(newFormats)}
              aria-label="text formatting"
                size="small"
            >
              <ToggleButton 
                value="bold" 
                aria-label="bold" 
                onClick={() => handleFormatText('bold')}
              >
                <FormatBold />
              </ToggleButton>
              <ToggleButton 
                value="italic" 
                aria-label="italic"
                onClick={() => handleFormatText('italic')}
              >
                <FormatItalic />
              </ToggleButton>
              <ToggleButton 
                value="list" 
                aria-label="list"
                onClick={() => handleFormatText('list')}
              >
                <FormatListBulleted />
              </ToggleButton>
              <ToggleButton 
                value="code" 
                aria-label="code"
                onClick={() => handleFormatText('code')}
              >
                <Code />
              </ToggleButton>
              <ToggleButton 
                value="link" 
                aria-label="link"
                onClick={() => handleFormatText('link')}
              >
                <LinkIcon />
              </ToggleButton>
              <ToggleButton 
                value="quote" 
                aria-label="quote"
                onClick={() => handleFormatText('quote')}
              >
                <FormatQuote />
              </ToggleButton>
            </ToggleButtonGroup>
            
            <Box>
              <Tooltip title="Toggle Preview">
                <IconButton 
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  color={isPreviewMode ? "primary" : "default"}
                >
                  {isPreviewMode ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Tooltip>
              <Tooltip title="AI Model">
                <FormControl sx={{ minWidth: 100, ml: 1 }} size="small">
                  <InputLabel id="ai-model-select-label">AI Model</InputLabel>
                  <Select
                    labelId="ai-model-select-label"
                    id="ai-model-select"
                    value={aiModel}
                    label="AI Model"
                    onChange={(e) => setAiModel(e.target.value as AIModel)}
                  >
                    <MenuItem value="llama">Meta Llama 3</MenuItem>
                    <MenuItem value="rule-based">Rule-based</MenuItem>
                  </Select>
                </FormControl>
              </Tooltip>
            </Box>
          </Box> */}
            
          {/* Replace editor with RichTextEditor */}
          {isPreviewMode ? (
            <Box 
              sx={{ 
                p: 2, 
                minHeight: '500px',
                '& img': { maxWidth: '100%' },
                '& pre': { 
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  p: 1,
                  borderRadius: 1,
                  overflowX: 'auto'
                },
                '& blockquote': {
                  borderLeft: `4px solid ${theme.palette.primary.main}`,
                  pl: 2,
                  ml: 0,
                  my: 2,
                  color: 'text.secondary'
                },
                '& a': {
                  color: 'primary.main',
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }
              }}
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <RichTextEditor
              initialContent={content}
              onChange={handleContentChange}
              placeholder="Start writing your note..."
              minHeight={500}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Tags Section */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Tags
          {isTaggingLoading && (
            <CircularProgress size={16} sx={{ ml: 1, verticalAlign: 'middle' }} />
          )}
        </Typography>
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            {tags.map((tag, index) => (
              <Chip 
                key={index} 
                label={tag} 
                onDelete={() => handleRemoveTag(tag)} 
                color="primary" 
                variant="outlined"
                sx={{ m: 0.5 }}
              />
            ))}
            <Box sx={{ display: 'flex', alignItems: 'center', m: 0.5 }}>
              <TextField
                label="Add Tag"
                variant="outlined"
                size="small"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                sx={{ mr: 1 }}
              />
              <IconButton 
                onClick={handleAddTag} 
                color="primary"
                disabled={!currentTag.trim()}
              >
                <AddIcon />
              </IconButton>
            </Box>
          </Stack>
        </Paper>
          </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutline />}
              onClick={handleDiscard}
            >
              {noteId ? 'Cancel' : 'Discard'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                noteId ? 'Update' : 'Save Note'
              )}
            </Button>
      </Box>

      {/* Chatbot Dialog */}
      <Dialog
        open={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          AI Assistant Analysis
          {isChatbotLoading && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </DialogTitle>
        <DialogContent dividers>
          {isChatbotLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              {/* Generated Tags Section */}
              <Typography variant="h6" gutterBottom>
                Suggested Tags
              </Typography>
              <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                {generatedTags.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {generatedTags.map((tag, index) => (
                      <Chip 
                        key={index} 
                        label={tag} 
                        color="primary" 
                        variant="outlined" 
                        sx={{ m: 0.5 }}
                      />
                    ))}
                    <Button 
                      variant="contained" 
                      size="small" 
                      onClick={applyGeneratedTags}
                      sx={{ ml: 2 }}
                    >
                      Add All
                    </Button>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No tags generated
                  </Typography>
                )}
              </Paper>

              {/* Generated Summary Section */}
              <Typography variant="h6" gutterBottom>
                Summary
              </Typography>
              <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                <Typography variant="body1">
                  {generatedSummary || "No summary generated"}
                </Typography>
              </Paper>

              {/* Generated Flashcards Section */}
              <Typography variant="h6" gutterBottom>
                Generated Flashcards
              </Typography>
              {generatedFlashcards.length > 0 ? (
                <Box>
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
                  <Button 
                    variant="contained" 
                    color="secondary"
                    onClick={saveFlashcards}
                  >
                    Save Flashcards
                  </Button>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No flashcards generated
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChatbotOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowSnackbar(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NoteEditor; 