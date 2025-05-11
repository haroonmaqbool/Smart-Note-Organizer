import React, { useState, useEffect } from 'react';
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
  useMediaQuery,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Description as DescriptionIcon,
  AutoAwesome as AutoAwesomeIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Label as LabelIcon,
  DateRange as DateRangeIcon,
  Computer as ComputerIcon
} from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { api, Summary } from '../services/api';

const Summaries: React.FC = () => {
  const { state, dispatch } = useApp();
  const { summaries, currentSummary } = state;
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Local state
  const [loading, setLoading] = useState(false);
  const [detailView, setDetailView] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [summaryToDelete, setSummaryToDelete] = useState<string | null>(null);
  const [notification, setNotification] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' | 'info' | 'warning' 
  });

  // Stats calculations
  const totalSummaries = summaries.length;
  const recentlyCreated = [...summaries].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 3);
  
  // Get all unique tags and their frequency
  const tagFrequency = summaries.flatMap(summary => summary.tags).reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Sort tags by frequency
  const sortedTags = Object.keys(tagFrequency).sort((a, b) => tagFrequency[b] - tagFrequency[a]);

  // Helper component for stats cards
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

  // Handle view summary details
  const handleViewSummary = (summary: Summary) => {
    dispatch({ type: 'SET_CURRENT_SUMMARY', payload: summary });
    setDetailView(true);
  };

  // Handle back to summary list
  const handleBackToList = () => {
    setDetailView(false);
  };

  // Handle delete summary
  const handleDeleteSummary = (summaryId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setSummaryToDelete(summaryId);
    setDeleteDialogOpen(true);
  };

  // Confirm delete summary
  const confirmDeleteSummary = async () => {
    if (summaryToDelete) {
      setLoading(true);
      try {
        await api.deleteSummary(summaryToDelete);
        dispatch({ type: 'DELETE_SUMMARY', payload: summaryToDelete });
        
        if (detailView && currentSummary?.id === summaryToDelete) {
          setDetailView(false);
        }
        
        setNotification({
          open: true,
          message: 'Summary deleted successfully',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error deleting summary:', error);
        setNotification({
          open: true,
          message: 'Failed to delete summary',
          severity: 'error'
        });
      } finally {
        setLoading(false);
        setDeleteDialogOpen(false);
        setSummaryToDelete(null);
      }
    }
  };

  // Cancel delete summary
  const cancelDeleteSummary = () => {
    setDeleteDialogOpen(false);
    setSummaryToDelete(null);
  };

  // Handle close notification
  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
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
          {detailView ? 'Summary Details' : 'Summaries'}
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {detailView && (
            <Button 
              variant="outlined" 
              startIcon={<ArrowBackIcon />}
              onClick={handleBackToList}
              sx={{
                px: 2,
                py: 1.2,
              }}
            >
              Back to Summaries
            </Button>
          )}
        </Box>
      </Box>

      {/* Content Section */}
      {!detailView ? (
        <>
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
              Summary Overview
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <StatCard 
                  icon={<DescriptionIcon />} 
                  title="Total Summaries" 
                  value={totalSummaries} 
                  color={theme.palette.primary.main} 
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard 
                  icon={<LabelIcon />} 
                  title="Most Used Tag" 
                  value={sortedTags.length > 0 ? sortedTags[0] : 'None'} 
                  color={theme.palette.secondary.main} 
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <StatCard 
                  icon={<DateRangeIcon />} 
                  title="Last Created" 
                  value={summaries.length > 0 ? new Date(summaries[0].createdAt).toLocaleDateString() : "N/A"} 
                  color={theme.palette.info.main} 
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Summaries Grid */}
          <Paper elevation={0} sx={{ 
            p: 3, 
            borderRadius: 2, 
            border: `1px solid ${theme.palette.divider}`,
            height: { xs: 'auto', md: '650px' }, 
            minHeight: '400px', 
            maxHeight: { xs: '80vh', md: '650px' }, 
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3,
              flexShrink: 0 
            }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                My Summaries
              </Typography>
            </Box>
            <Divider sx={{ mb: 3, flexShrink: 0 }} />
            
            {summaries.length === 0 ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                py: 6,
                flexGrow: 1
              }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  No summaries available. Summaries will appear here when you create notes.
                </Typography>
              </Box>
            ) : (
              <Box 
                sx={{ 
                  overflowY: 'auto', 
                  flexGrow: 1,
                  pr: 1,
                  mt: 0,
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
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${alpha(theme.palette.primary.main, 0.2)} ${alpha(theme.palette.primary.main, 0.05)}`,
                }}
              >
                <Grid container spacing={2}>
                  {summaries.map((summary) => (
                    <Grid item xs={12} sm={6} md={4} key={summary.id}>
                      <Card 
                        sx={{ 
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          height: '220px',
                          '&:hover': {
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            transform: 'translateY(-3px)',
                            cursor: 'pointer'
                          },
                          p: 1,
                          position: 'relative'
                        }}
                        onClick={() => handleViewSummary(summary)}
                      >
                        {/* Delete button */}
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
                          onClick={(e) => handleDeleteSummary(summary.id, e)}
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
                              pr: 4
                            }}
                          >
                            {summary.title}
                          </Typography>
                          <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                            <Typography 
                              variant="caption"
                              sx={{
                                fontWeight: 'bold',
                                color: theme.palette.primary.main
                              }}
                            >
                              From note: {summary.title}
                            </Typography>
                          </Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ 
                              mb: 2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              maxWidth: '100%'
                            }}
                          >
                            {summary.summary_text}
                          </Typography>
                          <Box sx={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: 1, 
                            mb: 2,
                            maxWidth: '100%',
                            mt: 'auto'
                          }}>
                            {summary.tags.slice(0, 3).map((tag) => (
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
                            {summary.tags.length > 3 && (
                              <Chip 
                                label={`+${summary.tags.length - 3}`} 
                                size="small" 
                                variant="outlined"
                                color="primary"
                                sx={{ borderRadius: '16px', px: 1 }}
                              />
                            )}
                          </Box>
                        </CardContent>
                        <CardActions sx={{ p: 1, pt: 0 }}>
                          <Chip
                            icon={<ComputerIcon fontSize="small" />}
                            label={summary.model_used || "AI"}
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: '16px' }}
                          />
                          <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                            {new Date(summary.createdAt).toLocaleDateString()}
                          </Typography>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Paper>
        </>
      ) : (
        /* Detail View */
        currentSummary && (
          <Paper elevation={0} sx={{ 
            p: 3, 
            borderRadius: 2, 
            border: `1px solid ${theme.palette.divider}`,
            minHeight: '650px'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3,
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 2, sm: 0 }
            }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  {currentSummary.title}
                </Typography>
                <Typography variant="subtitle2" color="primary.main" sx={{ mt: 0.5 }}>
                  From note: {currentSummary.title}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Tooltip title="Delete summary">
                  <Button 
                    variant="outlined" 
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={(e) => handleDeleteSummary(currentSummary.id, e as React.MouseEvent)}
                  >
                    Delete
                  </Button>
                </Tooltip>
              </Box>
            </Box>
            
            <Divider sx={{ mb: 4 }} />
            
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.primary.main, display: 'flex', alignItems: 'center' }}>
                  <AutoAwesomeIcon fontSize="small" sx={{ mr: 1 }} />
                  Summary
                </Typography>
                <Paper elevation={0} sx={{ 
                  p: 3, 
                  mb: 4, 
                  borderRadius: 2, 
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                  bgcolor: alpha(theme.palette.primary.main, 0.05)
                }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {currentSummary.summary_text}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Original Text
                </Typography>
                <Paper elevation={0} sx={{ 
                  p: 3, 
                  borderRadius: 2, 
                  border: `1px solid ${theme.palette.divider}`,
                  maxHeight: '300px',
                  overflow: 'auto'
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                    {currentSummary.original_text}
                  </Typography>
                </Paper>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 2, sm: 0 }
                }}>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Tags
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {currentSummary.tags.length > 0 ? (
                        currentSummary.tags.map((tag) => (
                          <Chip 
                            key={tag} 
                            label={tag} 
                            size="small" 
                            color="primary"
                            sx={{ borderRadius: '16px' }}
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No tags
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Created
                    </Typography>
                    <Typography variant="body2">
                      {new Date(currentSummary.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Model Used
                    </Typography>
                    <Chip
                      icon={<ComputerIcon fontSize="small" />}
                      label={currentSummary.model_used || "AI"}
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: '16px' }}
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={cancelDeleteSummary}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Summary
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this summary? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelDeleteSummary} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteSummary} color="error" variant="contained">
            Delete
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

export default Summaries; 