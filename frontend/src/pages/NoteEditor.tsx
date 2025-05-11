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
  Save as SaveIcon,
  Delete as DeleteIcon,
  ArrowBack,
  Psychology as PsychologyIcon,
  Add as AddIcon,
  DeleteOutline,
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  Image,
  Code,
  Link as LinkIcon,
  FormatQuote,
  Visibility,
  VisibilityOff,
  AttachFile,
  AutoAwesome,
} from '@mui/icons-material';
import { api, AIModel, Flashcard } from '../services/api';
import { useApp } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, useLocation } from 'react-router-dom';
import RichTextEditor from '../components/RichTextEditor';
import { useNotification } from '../components/Layout';

const NoteEditor: React.FC = () => {
  const theme = useTheme();
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { showNotification } = useNotification();
  
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
    
    // Set redirection flag if needed
    if (shouldRedirect) {
      setRedirectAfterSave(true);
      
      // For success messages, always redirect to dashboard
      if (severity === 'success') {
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
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
        window.location.href = '/';
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [redirectAfterSave, isLoading]);

  const autoGenerateTags = async (text: string) => {
    if (text.trim().length < 50) {
      showSnackbarMessage('Add more content before generating tags', 'info');
      return;
    }
    
    try {
      setIsTaggingLoading(true);
      showSnackbarMessage('Analyzing content with AI...', 'info');
      console.log('Initiating AI tag generation for text length:', text.length);
      
      // First attempt: Use OpenRouter AI via our improved API
      const response = await api.tag(text, aiModel);
      
      if (response.data?.tags) {
        // Check what model was used
        const modelUsed = response.data.model_used || 'unknown';
        const isAI = modelUsed.includes('openrouter') || modelUsed.includes('llama3');
        const isBackend = modelUsed.includes('backend');
        const isFallback = modelUsed.includes('fallback');
        
        console.log(`Tags generated using model: ${modelUsed}`);
        
        // Filter out tags that are too short or already included
        const newTags = response.data.tags
          .filter(tag => 
            tag.length > 2 && 
            !tags.includes(tag) && 
            !tag.includes('.') && 
            !tag.includes(',')
          );
          
        if (newTags.length > 0) {
          // Add new tags to the existing tags array
          setTags(prevTags => {
            // Create a set of combined tags to eliminate duplicates
            const combinedTags = new Set([...prevTags]);
            
            // Add new tags to the set (automatically handles duplicates)
            newTags.forEach(tag => combinedTags.add(tag));
            
            // Convert set back to array
            return Array.from(combinedTags);
          });
          
          // Show appropriate message based on what model was used
          if (isAI) {
            showSnackbarMessage(`Generated ${newTags.length} tags with Llama 3 AI model`, 'success');
          } else if (isBackend) {
            showSnackbarMessage('Tags generated using server-side AI processing', 'success');
          } else if (isFallback) {
            showSnackbarMessage('Tags generated using fallback processing (AI unavailable)', 'info');
          } else {
            showSnackbarMessage(`Added ${newTags.length} AI-generated tags successfully!`, 'success');
          }
          
          console.log('Added new tags:', newTags);
        } else {
          showSnackbarMessage('No new relevant tags could be identified', 'info');
          console.log('No new tags were added - tags were filtered out or already existed');
        }
      } else if (response.error) {
        console.error('Tag generation API error:', response.error);
        
        // Try a simplified extraction directly from the text as a last resort
        const simpleTags = extractSimpleTags(text);
        
        if (simpleTags.length > 0) {
          setTags(prevTags => [...new Set([...prevTags, ...simpleTags])]);
          showSnackbarMessage('Tags generated using emergency fallback method', 'warning');
          console.log('Used emergency fallback tag generation method:', simpleTags);
        } else {
          showSnackbarMessage(`Failed to generate tags: ${response.error}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error in tag generation process:', error);
      
      // Last resort - try to extract something
      const simpleTags = extractSimpleTags(text);
      if (simpleTags.length > 0) {
        setTags(prevTags => [...new Set([...prevTags, ...simpleTags])]);
        showSnackbarMessage('Tags generated using emergency fallback method', 'warning');
        console.log('Used emergency fallback tag generation after error:', simpleTags);
      } else {
        showSnackbarMessage('All tag generation methods failed - please try again later', 'error');
      }
    } finally {
      setIsTaggingLoading(false);
    }
  };

  // Ultra-simple tag extraction as a last resort if all else fails
  const extractSimpleTags = (text: string): string[] => {
    // Get the title words first as they're highly relevant
    const titleWords = title.toLowerCase().split(/\s+/)
      .map(word => word.replace(/[^\w]/g, ''))
      .filter(word => word.length > 3);
    
    // Simple content processing - remove HTML, lowercase, split by spaces
    const cleanText = text.replace(/<[^>]*>/g, ' ').toLowerCase();
    const words = cleanText.split(/\s+/);
    
    // Count word frequency
    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      // Clean the word
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 3) {
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1;
      }
    });
    
    // Domain-specific keywords that might be relevant for healthcare content
    const healthcareKeywords = [
      'health', 'medical', 'clinical', 'patient', 'doctor', 'hospital', 'care', 'treatment',
      'diagnosis', 'therapy', 'disease', 'medicine', 'healthcare', 'technology', 'artificial',
      'intelligence', 'data', 'research', 'algorithm', 'diagnostic', 'image', 'analysis',
      'radiology', 'pathology', 'prediction', 'prevention', 'monitoring', 'screening', 'workflow'
    ];
    
    // Filter common words
    const commonWords = [
      'this', 'that', 'these', 'those', 'with', 'from', 'have', 'will', 'they', 'their', 'there',
      'about', 'which', 'what', 'when', 'where', 'would', 'could', 'should', 'than', 'then',
      'some', 'such', 'same', 'more', 'most', 'other', 'another', 'being', 'also', 'very',
      'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under'
    ];
    
    // Extract most frequent terms
    const frequentTerms = Object.keys(wordCount)
      .filter(word => !commonWords.includes(word) && wordCount[word] > 1)
      .sort((a, b) => wordCount[b] - wordCount[a])
      .slice(0, 5);
    
    // Prioritize domain-specific keywords if they appear in the text
    const domainKeywords = healthcareKeywords.filter(keyword => 
      wordCount[keyword] && wordCount[keyword] > 0
    ).slice(0, 3);
    
    // Combine title words, domain keywords, and frequent terms, prioritizing in that order
    const allTags = [
      ...titleWords,                             // Title words first
      ...domainKeywords,                         // Domain keywords next
      ...frequentTerms.filter(term =>            // Then frequent terms not already included
        !titleWords.includes(term) && 
        !domainKeywords.includes(term)
      )
    ].slice(0, 5);  // Take up to 5 tags
    
    return [...new Set(allTags)]; // Remove any duplicates
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
    // Convert the generated flashcards to the right format
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
    showSnackbarMessage('Flashcards saved successfully!', 'success', false);
    setChatbotOpen(false);
    
    // Use React Router's navigate instead of window.location
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const handleAddTag = async () => {
    // If a tag was manually entered, add it
    if (currentTag && !tags.includes(currentTag)) {
      setTags([...tags, currentTag]);
      setCurrentTag('');
      return;
    }
    
    // If no tag was manually entered, generate tags from content
    if (content.trim().length < 50) {
      showSnackbarMessage('Add more content before generating tags', 'info');
      return;
    }
    
    try {
      setIsTaggingLoading(true);
      const response = await api.tag(content, aiModel);
      
      if (response.data?.tags) {
        // Filter out tags that are too short or already included
        const newTags = response.data.tags
          .filter(tag => 
            tag.length > 2 && 
            !tags.includes(tag) && 
            !tag.includes('.') && 
            !tag.includes(',')
          )
          .slice(0, 3); // Limit to 3 new tags
          
        if (newTags.length > 0) {
          setTags(prevTags => [...new Set([...prevTags, ...newTags])]);
          showSnackbarMessage('Tags automatically generated!', 'success');
        } else {
          showSnackbarMessage('No new tags could be generated', 'info');
        }
      }
    } catch (error) {
      console.error('Error generating tags:', error);
      showSnackbarMessage('Failed to generate tags', 'error');
    } finally {
      setIsTaggingLoading(false);
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
        
        // Update or create summary for this note
        try {
          // Extract text content from HTML
          const textContent = content.replace(/<[^>]*>/g, ' ').trim();
          
          // Check if the note has enough content to generate a summary
          if (textContent.length >= 20) {
            // Generate a summary entry for the summaries list
            const response = await api.createSummary(textContent, title);
            
            if (response.data) {
              console.log(`Created/updated summary for "${title}"`);
              dispatch({ type: 'ADD_SUMMARY', payload: response.data });
            }
          }
        } catch (summaryError) {
          console.error('Error creating summary:', summaryError);
        }
        
        // Show success message
        showSnackbarMessage('Note updated successfully!', 'success', false);
      } else {
        // Create new note object (without id, createdAt, updatedAt)
        const noteInput = {
          title,
          content,
          tags,
          summary,
        };
        // Save to backend and only add to state if backend succeeds
        const response = await api.createNote(noteInput);
        if (response.error || !response.data) {
          showSnackbarMessage('Error saving note to backend', 'error');
          setIsLoading(false);
          return;
        }
        
        // Add backend note to state
        dispatch({ type: 'ADD_NOTE', payload: response.data });
        
        // Create a summary for this new note
        try {
          // Extract text content from HTML
          const textContent = content.replace(/<[^>]*>/g, ' ').trim();
          
          // Check if the note has enough content to generate a summary
          if (textContent.length >= 20) {
            // Generate a summary entry for the summaries list
            const summaryResponse = await api.createSummary(textContent, title);
            
            if (summaryResponse.data) {
              console.log(`Created summary for new note "${title}"`);
              dispatch({ type: 'ADD_SUMMARY', payload: summaryResponse.data });
            }
          }
        } catch (summaryError) {
          console.error('Error creating summary for new note:', summaryError);
        }
        
        // Show success message with the global notification system
        showNotification('created successfully', 'success', 'note', title);
        // Also show the local snackbar for other UI feedback
        showSnackbarMessage('Note saved successfully!', 'success', false);
      }
      // Use React Router's navigate instead of window.location
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Error saving note:', error);
      showSnackbarMessage('Error saving note', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    if (noteId) {
      // If editing an existing note, navigate back
      showSnackbarMessage('Edit cancelled', 'info');
      navigate('/');
    } else {
      // If creating a new note, clear the form
      setTitle('');
      setContent('');
      setTags([]);
      
      // Show message and then navigate
      showSnackbarMessage('Note discarded', 'info');
      // Use React Router's navigate instead of window.location
      setTimeout(() => {
        navigate('/');
      }, 1500);
    }
  };

  const navigateBack = () => {
    navigate('/');
  };

  const handleContentChange = (html: string) => {
    console.log('NoteEditor received content update');
    setContent(html);
    
    // We're not triggering automatic tag generation on every content change
    // as that would cause too many API calls and potential rate limiting.
    // Instead, we have a dedicated button for generating tags when the user is ready.
  };

  return (
    <Box sx={{ maxWidth: '1200px', margin: '0 auto', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={navigateBack}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ flexGrow: 1, textAlign: 'center' }}>
          {noteId ? 'Edit Note' : (title ? title : 'New Note')}
        </Typography>
        <IconButton 
          onClick={processChatbot}
          disabled={isChatbotLoading || content.length < 50}
          color="primary"
          sx={{ visibility: 'visible' }} // keeping this visible for balance
        >
          <PsychologyIcon />
        </IconButton>
      </Box>

      {/* File upload button and title input */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
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
              key={noteId || 'new-note'}
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
            <Chip 
              label="Generating tags..." 
              size="small" 
              color="secondary"
              icon={<CircularProgress size={16} />}
              sx={{ ml: 2, verticalAlign: 'middle' }}
            />
          )}
        </Typography>
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
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
          </Stack>
          
          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
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
            />
            <Tooltip title={currentTag.trim() ? "Add Tag" : "Generate Tags from Content"}>
              <IconButton 
                onClick={handleAddTag} 
                color="primary"
                disabled={(!currentTag.trim() && content.length < 50) || isTaggingLoading}
              >
                {isTaggingLoading ? <CircularProgress size={24} /> : <AddIcon />}
              </IconButton>
            </Tooltip>
            
            <Button
              variant="contained"
              color="secondary"
              startIcon={isTaggingLoading ? <CircularProgress size={20} /> : <AutoAwesome />}
              onClick={() => {
                // Show a more informative message in the snackbar before starting the process
                if (content.length < 50) {
                  showSnackbarMessage('Please add more content before generating tags', 'info');
                  return;
                }
                // Log that we're starting AI tag generation
                console.log('Starting AI tag generation process...');
                showSnackbarMessage('Starting AI tag generation...', 'info');
                autoGenerateTags(content);
              }}
              disabled={isTaggingLoading || content.length < 50}
              sx={{ ml: 1 }}
            >
              {isTaggingLoading ? 'Generating...' : 'Generate Smart Tags'}
            </Button>
          </Box>
          
          {content.length < 50 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              Add more content to enable auto-tag generation
            </Typography>
          )}
          
          {tags.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Recent tags:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {tags.slice(0, 5).map((tag, index) => (
                  <Chip 
                    key={index} 
                    label={tag} 
                    size="small"
                    variant="outlined"
                    sx={{ m: 0.5 }}
                  />
                ))}
              </Box>
            </Box>
          )}
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
                'Save Note'
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
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: '300px',
            boxShadow: 'none'
          }
        }}
      >
        <Alert 
          onClose={() => setShowSnackbar(false)} 
          severity={snackbarSeverity}
          variant="standard"
          sx={{ width: '100%', fontSize: '0.95rem' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NoteEditor; 