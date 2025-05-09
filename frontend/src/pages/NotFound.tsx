import React from 'react';
import { Box, Button, Container, Typography, Paper, useTheme } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { SentimentDissatisfied, Home as HomeIcon } from '@mui/icons-material';

const NotFound: React.FC = () => {
  const theme = useTheme();

  return (
    <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
      <Paper
        elevation={0}
        sx={{
          p: 6,
          borderRadius: 4,
          background: `linear-gradient(145deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.default} 100%)`,
          border: `1px solid ${theme.palette.divider}`,
        }}
        className="fade-in"
      >
        <Box sx={{ mb: 4 }}>
          <SentimentDissatisfied 
            sx={{ 
              fontSize: 100, 
              color: theme.palette.primary.main,
              mb: 2,
              opacity: 0.8
            }} 
          />
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            404
          </Typography>
          <Typography variant="h4" gutterBottom color="text.secondary">
            Page Not Found
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 2, mb: 4, maxWidth: 600, mx: 'auto' }}>
            The page you are looking for doesn't exist or has been moved.
            Please check the URL or return to the homepage.
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          component={RouterLink}
          to="/"
          startIcon={<HomeIcon />}
          size="large"
          sx={{
            px: 4,
            py: 1.5,
            borderRadius: 2,
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-3px)',
              boxShadow: `0 8px 15px ${theme.palette.primary.main}33`,
            }
          }}
        >
          Back to Home
        </Button>
      </Paper>
    </Container>
  );
};

export default NotFound; 