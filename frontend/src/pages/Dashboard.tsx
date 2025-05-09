import React from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  Box, 
  Paper,
  Avatar,
  Chip,
  IconButton,
  Divider,
  useTheme
} from '@mui/material';
import { 
  Add as AddIcon, 
  Search as SearchIcon, 
  School as SchoolIcon,
  NoteAdd as NoteAddIcon,
  TrendingUp as TrendingUpIcon, 
  EmojiObjects as EmojiObjectsIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);
const MotionCard = motion(Card);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box>
      <MotionBox
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          mb: 4
        }}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold">
              Welcome to Smart Note Organizer
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Organize, search, and learn from your notes efficiently
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<NoteAddIcon />}
            size="large"
            onClick={() => navigate('/editor')}
            sx={{ 
              borderRadius: '28px',
              px: 3,
              py: 1.2,
              background: 'linear-gradient(45deg, #3f51b5 30%, #757de8 90%)',
              boxShadow: '0 3px 10px rgba(63, 81, 181, 0.4)',
              '&:hover': {
                boxShadow: '0 5px 15px rgba(63, 81, 181, 0.6)',
              }
            }}
          >
            Create New Note
          </Button>
        </Box>
      </MotionBox>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <MotionCard
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            sx={{ 
              height: '100%',
              background: 'linear-gradient(to bottom, #ffffff, #f5f7ff)'
            }}
          >
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                Quick Actions
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/editor')}
                  fullWidth
                  sx={{ 
                    py: 1.5,
                    bgcolor: theme.palette.primary.main,
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                      transform: 'translateY(-2px)',
                      transition: 'transform 0.2s',
                    }
                  }}
                >
                  New Note
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SearchIcon />}
                  onClick={() => navigate('/search')}
                  fullWidth
                  sx={{ 
                    py: 1.5,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      transition: 'transform 0.2s',
                    }
                  }}
                >
                  Search Notes
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<SchoolIcon />}
                  onClick={() => navigate('/flashcards')}
                  fullWidth
                  sx={{ 
                    py: 1.5,
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      transition: 'transform 0.2s',
                    }
                  }}
                >
                  View Flashcards
                </Button>
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>

        <Grid item xs={12} md={8}>
          <MotionCard
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            sx={{ 
              height: '100%',
              background: 'linear-gradient(to bottom, #ffffff, #f5f7ff)'
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmojiObjectsIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                  Recent Notes
                </Typography>
                <Chip label="All Notes" size="small" color="primary" onClick={() => navigate('/search')} />
              </Box>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 6
              }}>
                <Avatar 
                  sx={{ 
                    width: 80, 
                    height: 80, 
                    bgcolor: 'rgba(63, 81, 181, 0.1)',
                    mb: 2
                  }}
                >
                  <NoteAddIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
                </Avatar>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No recent notes yet
                </Typography>
                <Typography color="text.secondary" textAlign="center" sx={{ maxWidth: 400, mb: 3 }}>
                  Create your first note to get started and organize your thoughts efficiently!
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/editor')}
                  sx={{ 
                    borderRadius: '20px',
                    px: 3
                  }}
                >
                  Create Note
                </Button>
              </Box>
            </CardContent>
          </MotionCard>
        </Grid>
        
        <Grid item xs={12}>
          <MotionCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            sx={{ 
              mt: 2,
              background: 'linear-gradient(to right, #3f51b5, #757de8)',
              color: 'white',
            }}
          >
            <CardContent sx={{ py: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    Start organizing your knowledge today
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Smart Note Organizer helps you create, organize, and study your notes effortlessly.
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    size="large"
                    onClick={() => navigate('/editor')}
                    sx={{ 
                      bgcolor: 'white', 
                      color: theme.palette.primary.main,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.9)',
                      }
                    }}
                  >
                    Get Started
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </MotionCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 