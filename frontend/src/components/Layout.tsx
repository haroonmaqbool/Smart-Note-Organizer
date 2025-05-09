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
  Divider,
  Avatar,
  Tooltip
} from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { 
  Dashboard as DashboardIcon, 
  Edit as EditIcon, 
  Search as SearchIcon, 
  School as SchoolIcon,
  Menu as MenuIcon,
  Lightbulb as LightbulbIcon
} from '@mui/icons-material';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const navItems = [
    { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { text: 'Editor', path: '/editor', icon: <EditIcon /> },
    { text: 'Search', path: '/search', icon: <SearchIcon /> },
    { text: 'Flashcards', path: '/flashcards', icon: <SchoolIcon /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 2, gap: 1 }}>
        <LightbulbIcon sx={{ color: 'primary.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Smart Notes
        </Typography>
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem 
            button 
            component={RouterLink} 
            to={item.path} 
            key={item.text}
            sx={{ 
              color: isActive(item.path) ? 'primary.main' : 'text.primary',
              backgroundColor: isActive(item.path) ? 'rgba(98, 0, 234, 0.08)' : 'transparent',
              borderRadius: '8px',
              mx: 1,
              mb: 1,
              '&:hover': {
                backgroundColor: isActive(item.path) ? 'rgba(98, 0, 234, 0.12)' : 'rgba(98, 0, 234, 0.04)',
              }
            }}
          >
            <Box sx={{ mr: 2, color: isActive(item.path) ? 'primary.main' : 'text.secondary' }}>{item.icon}</Box>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{ 
                fontWeight: isActive(item.path) ? 600 : 400
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="sticky" 
        elevation={0}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LightbulbIcon />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 700,
                letterSpacing: '0.5px'
              }}
            >
              Smart Notes
            </Typography>
          </Box>
          
          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, ml: 4, flexGrow: 1 }}>
              {navItems.map((item) => (
                <Button
                  key={item.text}
                  component={RouterLink}
                  to={item.path}
                  color="inherit"
                  startIcon={item.icon}
                  sx={{ 
                    px: 2,
                    py: 1,
                    borderRadius: '12px',
                    backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                    '&:hover': {
                      backgroundColor: isActive(item.path) ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.1)',
                    }
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>
          )}
          
          <Tooltip title="User Profile">
            <Avatar 
              sx={{ 
                bgcolor: 'secondary.main',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.05)',
                }
              }}
            >
              U
            </Avatar>
          </Tooltip>
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 280 },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Container 
        component="main" 
        maxWidth="lg"
        sx={{ 
          flexGrow: 1, 
          py: 4,
          px: { xs: 2, sm: 3, md: 4 },
          className: 'slide-up'
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
          borderColor: 'rgba(0,0,0,0.05)',
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