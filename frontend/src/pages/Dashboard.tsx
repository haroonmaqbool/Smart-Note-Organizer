import React from 'react';
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
  Container
} from '@mui/material';
import { 
  Add as AddIcon, 
  Note as NoteIcon, 
  Search as SearchIcon,
  School as SchoolIcon,
  ArrowForward as ArrowForwardIcon,
  DateRange as DateRangeIcon,
  Label as LabelIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const Dashboard: React.FC = () => {
  // Get notes from AppContext
  const { state } = useApp();
  const { notes } = state;
  const theme = useTheme();

  // Calculate some stats
  const totalNotes = notes.length;
  const totalTags = [...new Set(notes.flatMap(note => note.tags))].length;
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

      {/* Stats Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3, 
          mb: 4,
          borderRadius: 2, 
          border: `1px solid ${theme.palette.divider}`,
          background: `linear-gradient(to right, ${alpha(theme.palette.primary.main, 0.02)}, ${alpha(theme.palette.background.paper, 0.7)})`
        }}
      >
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Overview
        </Typography>
        
        <Grid container spacing={3}>
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

      {/* Main Content Grid */}
      <Grid container spacing={4}>
        {/* Left Column: Notes Section */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ 
            p: 3, 
            borderRadius: 2, 
            border: `1px solid ${theme.palette.divider}`,
            height: '100%'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 3 
            }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                My Notes
              </Typography>
              
              <Box>
                <Button 
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  component={Link}
                  to="/editor"
                  sx={{ mr: 2 }}
                >
                  New Note
                </Button>
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
            
            {totalNotes === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 6, 
                backgroundColor: alpha(theme.palette.primary.main, 0.03),
                borderRadius: 2
              }}>
                <NoteIcon sx={{ fontSize: 50, color: alpha(theme.palette.primary.main, 0.3), mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                  You don't have any notes yet
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  component={Link}
                  to="/editor"
                >
                  Create Your First Note
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentlyUpdated.map((note) => (
                  <Card 
                    key={note.id}
                    sx={{ 
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 600,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {note.title}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            color="text.secondary" 
                            sx={{ display: 'block', mt: 0.5 }}
                          >
                            Last edited: {new Date(note.updatedAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                        
                        <Button 
                          variant="outlined"
                          size="small" 
                          startIcon={<NoteIcon />} 
                          component={Link}
                          to={`/editor?id=${note.id}`}
                          sx={{ 
                            fontWeight: 500,
                            '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.05) }
                          }}
                        >
                          Open
                        </Button>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        {note.tags.map((tag) => (
                          <Chip 
                            key={tag} 
                            label={tag} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                      
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {note.content.substring(0, 200)}...
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
                
                {notes.length > 3 && (
                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Button 
                      variant="outlined" 
                      component={Link} 
                      to="/search"
                      endIcon={<ArrowForwardIcon />}
                    >
                      View All Notes ({notes.length})
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Right Column: Quick Tools Section */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ 
            p: 3, 
            borderRadius: 2, 
            border: `1px solid ${theme.palette.divider}`,
            height: '100%'
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
                    New Note
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
    </Box>
  );
};

export default Dashboard; 