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
  DialogContentText,
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
  Clear as ClearIcon,
  DeleteOutlined as DeleteIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

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

  // Add state for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  
  // Add state for clear dashboard confirmation dialog
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

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

  // Add function to handle note deletion
  const handleDeleteNote = (noteId: string, event: React.MouseEvent) => {
    // Stop event propagation to prevent navigation to editor
    event.stopPropagation();
    setNoteToDelete(noteId);
    setDeleteDialogOpen(true);
  };

  // Function to confirm and execute note deletion
  const confirmDeleteNote = () => {
    if (noteToDelete) {
      dispatch({ type: 'DELETE_NOTE', payload: noteToDelete });
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
      setNotification({
        open: true,
        message: 'Note deleted successfully',
        severity: 'success'
      });
    }
  };

  // Function to cancel note deletion
  const cancelDeleteNote = () => {
    setDeleteDialogOpen(false);
    setNoteToDelete(null);
  };

  // Function to handle clear dashboard confirmation
  const handleClearDashboard = () => {
    setClearDialogOpen(true);
  };

  // Function to confirm and execute clear dashboard
  const confirmClearDashboard = () => {
    dispatch({ type: 'CLEAR_NOTES' });
    setClearDialogOpen(false);
    setNotification({
      open: true,
      message: 'All notes have been cleared',
      severity: 'info'
    });
  };

  // Function to cancel clear dashboard
  const cancelClearDashboard = () => {
    setClearDialogOpen(false);
  };

  return (
    <Box className="fade-in" sx={{ px: { xs: 1, sm: 2 } }}>
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
            onClick={handleClearDashboard}
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

      {/* Main Content Grid - Full-width Notes Section */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ 
            p: 3, 
            borderRadius: 2, 
            border: `1px solid ${theme.palette.divider}`,
            height: { xs: 'auto', md: '650px' }, // Slightly increased height for full-width display
            minHeight: '400px', // Minimum height
            maxHeight: { xs: '80vh', md: '650px' }, // Responsive max height 
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3,
              flexShrink: 0 // Prevent header from shrinking
            }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                My Notes
              </Typography>
            </Box>
            <Divider sx={{ mb: 3, flexShrink: 0 }} />
            
            {notes.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                py: 6,
                flexGrow: 1
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
              <Box 
                sx={{ 
                  overflowY: 'auto', 
                  flexGrow: 1,
                  pr: 1, // Add padding for scrollbar
                  mt: 0, // No top margin
                  // Custom scrollbar styling
                  '&::-webkit-scrollbar': {
                    width: '8px',
                    backgroundColor: 'transparent',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: alpha(theme.palette.primary.main, 0.05),
                    borderRadius: '10px',
                    margin: '4px 0',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: '10px',
                    border: `2px solid transparent`,
                    backgroundClip: 'padding-box',
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.3),
                      border: `2px solid transparent`,
                      backgroundClip: 'padding-box',
                    },
                  },
                  // Firefox scrollbar
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${alpha(theme.palette.primary.main, 0.2)} ${alpha(theme.palette.primary.main, 0.05)}`,
                }}
              >
                <Grid container spacing={2}>
                  {notes.map((note) => (
                    <Grid item xs={12} sm={6} md={4} key={note.id}>
                      <Card 
                        sx={{ 
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '220px', // Fixed height for all cards
                          '&:hover': {
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            transform: 'translateY(-3px)',
                            cursor: 'pointer'
                          },
                          p: 1,
                          position: 'relative' // For positioning the delete button
                        }}
                        onClick={() => navigate(`/editor?id=${note.id}`)}
                      >
                        {/* Delete button in top-right corner */}
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
                          onClick={(e) => handleDeleteNote(note.id, e)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                          <Typography 
                            variant="h6" 
                            component="h2" 
                            gutterBottom
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              wordBreak: 'break-word',
                              lineHeight: 1.4,
                              maxWidth: '100%',
                              pr: 4 // Add padding to prevent text from overlapping with delete button
                            }}
                          >
                            {note.title.startsWith('Title:') ? note.title.substring(6).trim() : note.title}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              maxWidth: '100%'
                            }}
                          >
                            {note.summary || "No summary available"}
                          </Typography>
                          <Box sx={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: 1, 
                            mb: 2,
                            maxWidth: '100%',
                            mt: 'auto'
                          }}>
                            {note.tags.slice(0, 3).map((tag) => (
                              <Chip 
                                key={tag} 
                                label={tag} 
                                size="small" 
                                color="primary"
                                sx={{ 
                                  borderRadius: '16px',
                                  px: 1,
                                  maxWidth: { xs: '100%', sm: '100%', md: '100px' },
                                  '& .MuiChip-label': {
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    maxWidth: '100%'
                                  },
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                  }
                                }}
                              />
                            ))}
                            {note.tags.length > 3 && (
                              <Chip
                                label={`+${note.tags.length - 3} more`}
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: '16px' }}
                              />
                            )}
                          </Box>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{
                              display: 'block',
                              textAlign: 'right',
                              mt: 'auto'
                            }}
                          >
                            Last updated: {new Date(note.updatedAt).toLocaleDateString()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
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

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDeleteNote}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Note
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this note? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteNote} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteNote} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Clear Dashboard Confirmation Dialog */}
      <Dialog
        open={clearDialogOpen}
        onClose={cancelClearDashboard}
        aria-labelledby="clear-dialog-title"
        aria-describedby="clear-dialog-description"
      >
        <DialogTitle id="clear-dialog-title">
          Clear Dashboard
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="clear-dialog-description">
            Are you sure you want to clear all your notes? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelClearDashboard} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmClearDashboard} color="error" variant="contained">
            Confirm
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