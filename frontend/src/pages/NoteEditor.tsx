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
  CircularProgress
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
  AutoAwesome
} from '@mui/icons-material';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { v4 as uuidv4 } from 'uuid';

const NoteEditor: React.FC = () => {
  const theme = useTheme();
  const { dispatch } = useApp();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('Note saved successfully!');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [formats, setFormats] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTaggingLoading, setIsTaggingLoading] = useState(false);
  
  const editorRef = useRef<EditorView | null>(null);
  const editorContainerRef = useRef<HTMLDivElement | null>(null);
  
  // Track if we're currently updating the editor programmatically
  const isUpdatingEditorRef = useRef(false);

  // Initialize the editor
  useEffect(() => {
    if (!editorContainerRef.current) return;

    try {
      if (editorRef.current) {
        editorRef.current.destroy();
      }

      const state = EditorState.create({
        doc: content,
        extensions: [
          basicSetup,
          markdown(),
          oneDark,
          EditorView.theme({
            "&": {
              fontSize: "14px",
              padding: "16px",
            },
            ".cm-content": {
              fontFamily: "'Inter', monospace",
              lineHeight: "1.6"
            },
            ".cm-line": {
              padding: "0 4px"
            }
          }),
          EditorView.updateListener.of(update => {
            if (update.docChanged && !isUpdatingEditorRef.current) {
              const text = update.state.doc.toString();
              setContent(text);
              
              // Debounce auto-tagging to avoid too many API calls
              if (text.length > 50) {
                const timeoutId = setTimeout(() => {
                  autoGenerateTags(text);
                }, 2000);
                return () => clearTimeout(timeoutId);
              }
            }
          })
        ],
      });

      const editor = new EditorView({
        state,
        parent: editorContainerRef.current,
      });

      editorRef.current = editor;

      return () => {
        if (editorRef.current) {
          editorRef.current.destroy();
        }
      };
    } catch (error) {
      console.error('Error initializing editor:', error);
      showSnackbarMessage('Error initializing editor', 'error');
    }
  }, [editorContainerRef.current]);

  // Update editor when content changes (e.g., when loading a file)
  useEffect(() => {
    if (!editorRef.current || isUpdatingEditorRef.current) return;
    
    const currentContent = editorRef.current.state.doc.toString();
    if (currentContent !== content) {
      isUpdatingEditorRef.current = true;
      
      // Create a completely new editor instance with the new content
      if (editorContainerRef.current) {
        editorRef.current.destroy();
        
        const state = EditorState.create({
          doc: content,
          extensions: [
            basicSetup,
            markdown(),
            oneDark,
            EditorView.theme({
              "&": {
                fontSize: "14px",
                padding: "16px",
              },
              ".cm-content": {
                fontFamily: "'Inter', monospace",
                lineHeight: "1.6"
              },
              ".cm-line": {
                padding: "0 4px"
              }
            }),
            EditorView.updateListener.of(update => {
              if (update.docChanged && !isUpdatingEditorRef.current) {
                const text = update.state.doc.toString();
                setContent(text);
                
                // Debounce auto-tagging to avoid too many API calls
                if (text.length > 50) {
                  const timeoutId = setTimeout(() => {
                    autoGenerateTags(text);
                  }, 2000);
                  return () => clearTimeout(timeoutId);
                }
              }
            })
          ],
        });

        const editor = new EditorView({
          state,
          parent: editorContainerRef.current,
        });

        editorRef.current = editor;
      }
      
      isUpdatingEditorRef.current = false;
    }
  }, [content]);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    try {
      setIsLoading(true);
      const response = await api.uploadFile(file);
      
      if (response.data?.text) {
        // Update the content state, which will trigger the useEffect to update the editor
        setContent(response.data.text);
        
        // Auto-generate tags for the new content
        autoGenerateTags(response.data.text);
        
        showSnackbarMessage('File uploaded successfully', 'success');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showSnackbarMessage('Error uploading file', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormatChange = (
    event: React.MouseEvent<HTMLElement>,
    newFormats: string[],
  ) => {
    setFormats(newFormats);
    
    // Apply formatting to the editor
    // This is simplified - a real implementation would need to handle selections and insertions
    if (editorRef.current) {
      // Handle formatting logic here
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
  
  const showSnackbarMessage = (message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setShowSnackbar(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      showSnackbarMessage('Please add a title', 'warning');
      return;
    }
    
    if (!content.trim()) {
      showSnackbarMessage('Please add some content', 'warning');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Generate a summary if content is long enough
      let summary = '';
      if (content.length > 200) {
        const summaryResponse = await api.summarize(content);
        if (summaryResponse.data?.summary) {
          summary = summaryResponse.data.summary;
        }
      }
      
      // Create note object
      const newNote = {
        id: uuidv4(),
        title: title.trim(),
        content,
        tags,
        summary,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add to app state
      dispatch({ type: 'ADD_NOTE', payload: newNote });
      
      // Reset the form
      setTitle('');
      setContent('');
      setTags([]);
      
      showSnackbarMessage('Note saved successfully', 'success');
    } catch (error) {
      console.error('Error saving note:', error);
      showSnackbarMessage('Error saving note', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    setTitle('');
    setContent('');
    setTags([]);
    
    // This will trigger the useEffect to update the editor
    showSnackbarMessage('Note discarded', 'info');
  };

  return (
    <Box className="fade-in">
      <Typography 
        variant="h4" 
        gutterBottom 
        sx={{ 
          mb: 3, 
          fontWeight: 700,
          background: `linear-gradient(120deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Create New Note
      </Typography>

      <Card 
        sx={{ 
          mb: 3,
          position: 'relative',
          overflow: 'visible'
        }} 
        className="card-hover"
      >
        <CardContent sx={{ p: 3 }}>
          <TextField
            fullWidth
            label="Note Title"
            placeholder="Enter a descriptive title"
            variant="outlined"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            sx={{ 
              mb: 3,
              '& .MuiOutlinedInput-root': {
                fontSize: '1.2rem',
                fontWeight: 500,
              }
            }}
          />

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary', mb: 0 }}>
                Tags
              </Typography>
              {isTaggingLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} color="primary" />
                  <Typography variant="caption" color="text.secondary">
                    Generating tags...
                  </Typography>
                </Box>
              )}
            </Box>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  onDelete={() => handleRemoveTag(tag)}
                  color="primary"
                  variant="outlined"
                  size="medium"
                  sx={{ 
                    fontWeight: 500,
                    borderRadius: 2,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      transform: 'translateY(-1px)'
                    },
                    '& .MuiChip-deleteIcon': {
                      color: 'primary.light',
                      '&:hover': {
                        color: 'primary.main'
                      }
                    }
                  }}
                />
              ))}
              {tags.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Add tags to organize your notes
                </Typography>
              )}
            </Stack>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                label="Add Tag"
                placeholder="e.g., research, ideas, todo"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                sx={{ 
                  flexGrow: 1,
                  '& .MuiOutlinedInput-root': {
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.02)
                    },
                    '&.Mui-focused': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.05)
                    }
                  }
                }}
              />
              <Button 
                variant="contained" 
                color="primary"
                onClick={handleAddTag}
                startIcon={<AddIcon />}
                disabled={!currentTag}
                sx={{
                  transition: 'all 0.2s ease',
                  '&:not(:disabled):hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`
                  }
                }}
              >
                Add
              </Button>
              <Tooltip title="Auto-generate tags from content">
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => autoGenerateTags(content)}
                  disabled={isTaggingLoading || content.length < 50}
                  startIcon={isTaggingLoading ? <CircularProgress size={16} /> : <AutoAwesome />}
                  sx={{
                    transition: 'all 0.2s ease',
                    borderWidth: '1.5px',
                    '&:hover': {
                      borderWidth: '1.5px',
                      backgroundColor: alpha(theme.palette.secondary.main, 0.05)
                    }
                  }}
                >
                  Auto Tag
                </Button>
              </Tooltip>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2 
            }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Content
              </Typography>
              <Tooltip title={isPreviewMode ? "Edit Mode" : "Preview Mode"}>
                <IconButton 
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  sx={{ 
                    color: isPreviewMode ? 'primary.main' : 'text.secondary',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  {isPreviewMode ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Tooltip>
            </Box>
            
            <Paper 
              elevation={0} 
              sx={{ 
                p: 1, 
                mb: 2, 
                backgroundColor: alpha(theme.palette.primary.main, 0.03),
                borderRadius: 2
              }}
            >
              <ToggleButtonGroup
                value={formats}
                onChange={handleFormatChange}
                aria-label="text formatting"
                size="small"
                sx={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  '& .MuiToggleButton-root': {
                    border: 'none',
                    borderRadius: 1,
                    px: 2,
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.15)
                      }
                    }
                  }
                }}
              >
                <ToggleButton value="bold" aria-label="bold">
                  <Tooltip title="Bold"><FormatBold /></Tooltip>
                </ToggleButton>
                <ToggleButton value="italic" aria-label="italic">
                  <Tooltip title="Italic"><FormatItalic /></Tooltip>
                </ToggleButton>
                <ToggleButton value="list" aria-label="list">
                  <Tooltip title="Bullet List"><FormatListBulleted /></Tooltip>
                </ToggleButton>
                <ToggleButton value="quote" aria-label="quote">
                  <Tooltip title="Quote"><FormatQuote /></Tooltip>
                </ToggleButton>
                <ToggleButton value="code" aria-label="code">
                  <Tooltip title="Code Block"><Code /></Tooltip>
                </ToggleButton>
                <ToggleButton value="link" aria-label="link">
                  <Tooltip title="Insert Link"><LinkIcon /></Tooltip>
                </ToggleButton>
                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                <ToggleButton value="image" aria-label="image">
                  <Tooltip title="Insert Image"><Image /></Tooltip>
                </ToggleButton>
                <ToggleButton
                  value="upload"
                  aria-label="upload file"
                  component="label"
                  disabled={isLoading}
                >
                  <Tooltip title="Attach File">
                    <>
                      {isLoading ? <CircularProgress size={20} /> : <AttachFile />}
                      <input
                        type="file"
                        hidden
                        accept=".txt,.md,.pdf"
                        onChange={handleFileUpload}
                        disabled={isLoading}
                      />
                    </>
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            </Paper>

            <Box
              ref={editorContainerRef}
              sx={{
                border: '1px solid',
                borderColor: alpha(theme.palette.text.primary, 0.1),
                borderRadius: 2,
                height: '500px',
                overflow: 'auto',
                transition: 'all 0.2s ease',
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                },
                '&:focus-within': {
                  borderColor: theme.palette.primary.main,
                  boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
                position: 'relative',
              }}
            >
              {isPreviewMode && (
                <Box sx={{ 
                  position: 'absolute', 
                  inset: 0, 
                  padding: 2,
                  overflow: 'auto',
                  backgroundColor: theme.palette.background.paper,
                }}>
                  <Typography 
                    component="div" 
                    dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }} 
                  />
                </Box>
              )}
            </Box>
          </Box>

          <Box sx={{ 
            mt: 3, 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutline />}
              onClick={handleDiscard}
              sx={{ 
                borderWidth: '1.5px',
                '&:hover': {
                  borderWidth: '1.5px',
                  backgroundColor: alpha(theme.palette.error.main, 0.05)
                }
              }}
            >
              Discard
            </Button>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                sx={{ 
                  borderWidth: '1.5px',
                  '&:hover': {
                    borderWidth: '1.5px',
                    backgroundColor: alpha(theme.palette.primary.main, 0.05)
                  }
                }}
              >
                Save as Draft
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                onClick={handleSave}
                disabled={isLoading || !title.trim() || !content.trim()}
                sx={{
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.4)}`
                  }
                }}
              >
                Publish Note
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={4000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        TransitionComponent={Fade}
      >
        <Alert 
          onClose={() => setShowSnackbar(false)} 
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NoteEditor; 