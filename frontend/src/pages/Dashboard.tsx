import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  Chip,
  Paper,
  Divider,
  IconButton,
  Avatar,
  useTheme,
  alpha,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, 
  Note as NoteIcon, 
  Search as SearchIcon,
  School as SchoolIcon,
  ArrowForward as ArrowForwardIcon,
  DateRange as DateRangeIcon,
  Label as LabelIcon,
  Psychology as PsychologyIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { api, Flashcard as ApiFlashcard } from '../services/api';
import { v4 as uuidv4 } from 'uuid';
import type { LinkProps } from 'react-router-dom';
import type { ButtonProps } from '@mui/material';

const Dashboard: React.FC = () => {
  // Get notes from AppContext
  const { state, dispatch } = useApp();
  const { notes } = state;
  const theme = useTheme();

  // State for AI flashcard generation
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<ApiFlashcard[]>([]);
  const [notification, setNotification] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'info' | 'warning' 
  });
  
  // Add state for tag filtering
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Calculate some stats
  const totalNotes = notes.length;
  const totalTags = [...new Set(notes.flatMap(note => note.tags))].length;
  
  // Get all unique tags and their frequency
  const tagFrequency = notes.flatMap(note => note.tags).reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Sort tags by frequency
  const sortedTags = Object.keys(tagFrequency).sort((a, b) => tagFrequency[b] - tagFrequency[a]);
  
  // Filter notes by selected tag
  const filteredNotes = selectedTag 
    ? notes.filter(note => note.tags.includes(selectedTag))
    : notes;
    
  const recentlyUpdated = [...notes].sort((a, b) => 
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).slice(0, 3);

  const StatCard = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string | number, color: string }) => (
    <Card elevation={0} sx={{ p: 2, height: '100%', borderRadius: 2, border: `1px solid ${alpha(color, 0.2)}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Avatar sx={{ bgcolor: alpha(color, 0.2), color: color }}>
          {icon}
        </Avatar>
        <Typography variant="h6" sx={{ ml: 2, fontWeight: 500, color: 'text.secondary' }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 700, color: color }}>
        {value}
      </Typography>
    </Card>
  );

  const handleGenerateAIFlashcards = async (note: any) => {
    setSelectedNote(note);
    setAiDialogOpen(true);
    setIsGenerating(true);
    setGeneratedFlashcards([]);

    try {
      // Use the content of the note to generate flashcards
      const content = note.content;
      const title = note.title;
      const tags = note.tags;

      const result = await api.chatbot(content, title, tags);

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
      noteId: selectedNote?.id,
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

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Box className="fade-in">
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 4 
      }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: { xs: 2, sm: 0 } }}>
          Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="error"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all notes? This cannot be undone.')) {
                dispatch({ type: 'CLEAR_NOTES' });
                setNotification({
                  open: true,
                  message: 'All notes have been cleared',
                  severity: 'info'
                });
              }
            }}
            sx={{
              px: 2,
              py: 1.2,
            }}
          >
            Clear Dashboard
          </Button>
          
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            component={Link}
            to="/editor"
            sx={{
              px: 3,
              py: 1.2,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
              }
            }}
          >
            Create Note
          </Button>
        </Box>
      </Box>

      {/* Stats Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 3,
          borderRadius: 2, 
          border: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(theme.palette.background.paper, 0.7)})`
        }}
      >
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
          Overview
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <StatCard 
              icon={<NoteIcon />} 
              title="Total Notes" 
              value={totalNotes} 
              color={theme.palette.primary.main} 
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard 
              icon={<LabelIcon />} 
              title="Total Tags" 
              value={totalTags} 
              color={theme.palette.secondary.main} 
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard 
              icon={<DateRangeIcon />} 
              title="Last Updated" 
              value={totalNotes > 0 ? new Date(notes[0].updatedAt).toLocaleDateString() : "N/A"} 
              color={theme.palette.info.main} 
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content Grid - Just show all notes, no search or tag filter */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ 
            p: 3, 
            borderRadius: 2, 
            border: `1px solid ${theme.palette.divider}`,
            height: '100%',
            maxHeight: { xs: '600px', md: 'auto' },
            overflow: { xs: 'auto', md: 'visible' }
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3 
            }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                My Notes {selectedTag && `- Tagged: ${selectedTag}`}
              </Typography>
              <Box>
                <Button 
                  component={Link} 
                  to="/search"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ fontWeight: 500 }}
                >
                  View All
                </Button>
              </Box>
            </Box>
            <Divider sx={{ mb: 3 }} />
            
            {/* Tag Cloud */}
            {sortedTags.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Filter by Tag:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedTag && (
                    <Chip 
                      label="Clear Filter"
                      onClick={() => setSelectedTag(null)}
                      color="default"
                      onDelete={() => setSelectedTag(null)}
                      deleteIcon={<ClearIcon />}
                      sx={{ 
                        borderRadius: '16px',
                        mb: 1,
                        bgcolor: alpha(theme.palette.error.main, 0.1),
                        color: theme.palette.error.main
                      }}
                    />
                  )}
                  {sortedTags.slice(0, 10).map(tag => (
                    <Chip 
                      key={tag}
                      label={tag}
                      onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                      color={tag === selectedTag ? "primary" : "default"}
                      sx={{ 
                        borderRadius: '16px',
                        fontWeight: tag === selectedTag ? 'bold' : 'normal',
                        fontSize: `${Math.min(14 + tagFrequency[tag] * 0.5, 18)}px`
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {filteredNotes.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                py: 6
              }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  You haven't created any notes yet.
                </Typography>
                <Button 
                  variant="contained" 
                  component={Link} 
                  to="/editor"
                  startIcon={<AddIcon />}
                >
                  Create Your First Note
                </Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {filteredNotes.map((note) => (
                  <Grid item xs={12} key={note.id}>
                    <Card sx={{ 
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        transform: 'translateY(-3px)'
                      },
                      p: 1
                    }}>
                      <CardContent>
                        <Typography variant="h6" component="h2" gutterBottom>
                          {note.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {note.summary || "No summary available"}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                          {note.tags.map((tag) => (
                            <Chip 
                              key={tag} 
                              label={tag} 
                              size="small" 
                              color="primary"
                              sx={{ 
                                borderRadius: '16px',
                                px: 1,
                                '&:hover': {
                                  backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                }
                              }}
                            />
                          ))}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Last updated: {new Date(note.updatedAt).toLocaleDateString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>
        
        {/* Right Column: Quick Tools Section */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ 
            p: 3, 
            borderRadius: 2, 
            border: `1px solid ${theme.palette.divider}`,
            height: '100%',
            maxHeight: { xs: 'auto', md: '100%' }
          }}>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
              Quick Tools
            </Typography>
            
            <Divider sx={{ mb: 3 }} />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Card
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'translateY(-5px)'
                  }
                }}
                component={Link}
                to="/search"
              >
                <Avatar sx={{ bgcolor: theme.palette.primary.main, mr: 2 }}>
                  <SearchIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Search Notes
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Find your notes by content or tags
                  </Typography>
                </Box>
              </Card>
              
              <Card
                sx={{ 
                  p: 2, 
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                    transform: 'translateY(-5px)'
                  }
                }}
                component={Link}
                to="/flashcards"
              >
                <Avatar sx={{ bgcolor: theme.palette.secondary.main, mr: 2 }}>
                  <SchoolIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Flashcards
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Review and study with flashcards
                  </Typography>
                </Box>
              </Card>
              
              <Card
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  backgroundColor: alpha(theme.palette.info.main, 0.05),
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                    transform: 'translateY(-5px)'
                  }
                }}
                component={Link}
                to="/editor"
              >
                <Avatar sx={{ bgcolor: theme.palette.info.main, mr: 2 }}>
                  <AddIcon />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Create Note
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Create a new note with AI assistance
                  </Typography>
                </Box>
              </Card>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* AI Flashcard Generation Dialog */}
      <Dialog
        open={aiDialogOpen}
        onClose={() => !isGenerating && setAiDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Generate AI Flashcards: {selectedNote?.title}
          {isGenerating && <CircularProgress size={24} sx={{ ml: 2 }} />}
        </DialogTitle>
        <DialogContent dividers>
          {isGenerating ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Generating flashcards based on note content...</Typography>
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
                              color="secondary"
                              sx={{ 
                                mr: 0.5, 
                                mt: 0.5, 
                                borderRadius: '16px',
                                px: 1 
                              }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No flashcards could be generated. Try with a different note or content.
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

      {/* Notifications */}
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

export default Dashboard; 