import React from 'react';
import { Box, Typography, Button, Grid, Card, CardContent, CardActions, Chip } from '@mui/material';
import { Add as AddIcon, Note as NoteIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const Dashboard: React.FC = () => {
  // Sample notes data
  const notes = [
    {
      id: 1,
      title: 'Research on React Hooks',
      tags: ['react', 'javascript', 'hooks'],
      preview: 'Notes about useState, useEffect, and custom hooks...',
      date: '2023-04-15'
    },
    {
      id: 2,
      title: 'Project Ideas',
      tags: ['ideas', 'projects'],
      preview: 'List of potential project ideas to work on...',
      date: '2023-04-12'
    },
    {
      id: 3,
      title: 'Meeting Notes',
      tags: ['meeting', 'work'],
      preview: 'Minutes from the team meeting discussing...',
      date: '2023-04-10'
    }
  ];

  return (
    <Box className="fade-in">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          My Notes
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          component={Link}
          to="/editor"
        >
          Create Note
        </Button>
      </Box>

      <Grid container spacing={3}>
        {notes.map((note) => (
          <Grid item xs={12} sm={6} md={4} key={note.id}>
            <Card className="card-hover" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ p: 3, flexGrow: 1 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 1, 
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
                  {note.preview}
                </Typography>
                
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  sx={{ display: 'block', mt: 2 }}
                >
                  Last edited: {note.date}
                </Typography>
              </CardContent>
              
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button 
                  size="small" 
                  startIcon={<NoteIcon />} 
                  component={Link}
                  to={`/editor?id=${note.id}`}
                >
                  Open
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard; 