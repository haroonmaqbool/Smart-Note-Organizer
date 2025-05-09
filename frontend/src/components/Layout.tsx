import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  Button,
  useTheme,
  useMediaQuery,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Dashboard as DashboardIcon, 
  Edit as EditIcon, 
  Search as SearchIcon, 
  School as SchoolIcon,
  Menu as MenuIcon
} from '@mui/icons-material';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navItems = [
    { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { text: 'Editor', path: '/editor', icon: <EditIcon /> },
    { text: 'Search', path: '/search', icon: <SearchIcon /> },
    { text: 'Flashcards', path: '/flashcards', icon: <SchoolIcon /> },
  ];

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        Smart Note Organizer
      </Typography>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem 
            button 
            component={RouterLink} 
            to={item.path} 
            key={item.text}
            sx={{ 
              color: 'text.primary',
              '&:hover': {
                backgroundColor: 'rgba(63, 81, 181, 0.08)',
              }
            }}
          >
            <Box sx={{ mr: 2 }}>{item.icon}</Box>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="sticky" 
        sx={{ 
          background: 'linear-gradient(45deg, #3f51b5 30%, #757de8 90%)',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 700,
              letterSpacing: '0.5px'
            }}
          >
            Smart Note Organizer
          </Typography>
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.text}
                  component={RouterLink}
                  to={item.path}
                  color="inherit"
                  startIcon={item.icon}
                  sx={{ 
                    px: 2,
                    borderRadius: '20px',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    }
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Container 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          py: 4,
          px: { xs: 2, sm: 3, md: 4 }
        }}
      >
        {children}
      </Container>

      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          px: 2, 
          mt: 'auto', 
          backgroundColor: theme.palette.background.paper,
          borderTop: '1px solid',
          borderColor: 'divider',
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Smart Note Organizer © {new Date().getFullYear()}
        </Typography>
      </Box>
    </Box>
  );
};

export default Layout; 