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
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Tooltip,
  Stack,
  Paper,
  Fade,
  Menu,
  MenuItem,
  Chip
} from '@mui/material';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { 
  Dashboard as DashboardIcon, 
  Edit as EditIcon, 
  Search as SearchIcon, 
  School as SchoolIcon,
  Menu as MenuIcon,
  NoteAlt as NoteIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();

  // Add user info state from localStorage
  const [userName, setUserName] = React.useState<string>('User');
  const [userEmail, setUserEmail] = React.useState<string>('user@example.com');
  const [userRole, setUserRole] = React.useState<string>('');

  // Load user info from localStorage
  React.useEffect(() => {
    const storedName = localStorage.getItem('userName');
    const storedEmail = localStorage.getItem('userEmail');
    const storedRole = localStorage.getItem('userRole');
    
    if (storedName) setUserName(storedName);
    if (storedEmail) setUserEmail(storedEmail);
    if (storedRole) setUserRole(storedRole);
  }, []);

  // Add user-related states
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    
    navigate('/login');
  };

  const navItems = [
    { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { text: 'Editor', path: '/editor', icon: <EditIcon /> },
    { text: 'Search', path: '/search', icon: <SearchIcon /> },
    { text: 'Flashcards', path: '/flashcards', icon: <SchoolIcon /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  const drawer = (
    <Box sx={{ width: 280, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        p: 2,
        background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${alpha(theme.palette.primary.main, 0.8)}, ${alpha(theme.palette.secondary.dark, 0.7)})`,
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.15\'%3E%3Cpath d=\'M50 50c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10s-10-4.477-10-10 4.477-10 10-10zM10 10c0-5.523 4.477-10 10-10s10 4.477 10 10-4.477 10-10 10c0 5.523-4.477 10-10 10S0 25.523 0 20s4.477-10 10-10zm10 8c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm40 40c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z\' /%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        backgroundSize: '80px 80px',
        backgroundRepeat: 'repeat',
      }}>
        <Box
          sx={{
            width: 70,
            height: 70,
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.9)',
            mb: 1,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            padding: '6px',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
          }}
        >
          <img 
            src="/logo.jpeg" 
            alt="NoteNest Logo" 
            style={{ 
              width: '100%',
              height: 'auto',
              objectFit: 'scale-down'
            }} 
          />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          NoteNest
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Your cozy note-taking home
        </Typography>
      </Box>
      
      <Divider />
      
      {/* User Profile Section */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        alignItems: 'center',
        backgroundColor: theme.palette.background.default
      }}>
        <Avatar sx={{ 
          bgcolor: userRole === 'tester' ? theme.palette.success.main : theme.palette.secondary.main,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}>
          <PersonIcon />
        </Avatar>
        <Box sx={{ ml: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              {userName}
            </Typography>
            {userRole === 'tester' && (
              <Chip
                label="Test User"
                size="small"
                color="success"
                sx={{ 
                  height: 20, 
                  fontSize: '0.6rem',
                  fontWeight: 'bold',
                  '& .MuiChip-label': { 
                    padding: '0 4px'
                  }
                }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {userEmail}
          </Typography>
        </Box>
      </Box>
      
      <Divider />
      
      <List sx={{ py: 2, flexGrow: 1 }}>
        {navItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            component={RouterLink} 
            to={item.path}
            selected={isActive(item.path)}
            onClick={isMobile ? handleDrawerToggle : undefined}
            sx={{
              mb: 1,
              mx: 1,
              borderRadius: 2,
              '&.Mui-selected': {
                background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                color: 'white',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
                '&:hover': {
                  background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${alpha(theme.palette.primary.main, 0.9)})`,
                  opacity: 0.95,
                }
              },
              '&:hover': {
                backgroundColor: `${theme.palette.primary.light}22`,
                transform: 'translateX(5px)',
                transition: 'transform 0.3s ease-in-out'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <ListItemIcon sx={{ 
              color: isActive(item.path) ? 'white' : theme.palette.primary.main,
              minWidth: 40
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text} 
              primaryTypographyProps={{ 
                fontWeight: isActive(item.path) ? 600 : 400
              }}
            />
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
          Tools & Account
        </Typography>
        <Button 
          variant="outlined" 
          fullWidth 
          startIcon={<SettingsIcon />}
          sx={{ 
            mb: 1, 
            justifyContent: 'flex-start',
            borderRadius: 2,
          }}
        >
          Settings
        </Button>
        <Button 
          variant="outlined" 
          fullWidth 
          startIcon={<HelpIcon />}
          sx={{ 
            mb: 1,
            justifyContent: 'flex-start',
            borderRadius: 2,
          }}
        >
          Help & Support
        </Button>
        <Button 
          variant="outlined" 
          color="error"
          fullWidth 
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ 
            justifyContent: 'flex-start',
            borderRadius: 2,
          }}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="fixed" color="primary" elevation={0} sx={{ 
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: alpha(theme.palette.background.paper, 0.9),
        color: theme.palette.text.primary,
        background: `linear-gradient(90deg, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.default, 0.8)})`,
        backdropFilter: 'blur(10px)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
      }}>
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
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1 
            }}
          >
            <Box
              sx={{ 
                background: 'rgba(255, 255, 255, 0.9)',
                width: 40, 
                height: 40,
                borderRadius: '8px',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative',
                padding: '4px',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
              }}
            >
              <img 
                src="/logo.jpeg" 
                alt="NoteNest Logo" 
                style={{ 
                  width: '100%',
                  height: 'auto',
                  objectFit: 'scale-down'
                }} 
              />
            </Box>
            <Typography 
              variant="h6" 
              component="h1" 
              sx={{ 
                fontWeight: 700, 
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              NoteNest
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Desktop Navigation Menu */}
          {!isMobile && (
            <Stack direction="row" spacing={1}>
              {navItems.map((item) => (
                <Button
                  key={item.text}
                  component={RouterLink}
                  to={item.path}
                  startIcon={item.icon}
                  variant={isActive(item.path) ? "contained" : "text"}
                  color={isActive(item.path) ? "primary" : "inherit"}
                  size="large"
                  sx={{
                    fontWeight: isActive(item.path) ? 600 : 500,
                    px: 2,
                    borderRadius: 2,
                    ...(isActive(item.path) && {
                      background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                    })
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Stack>
          )}
          
          {/* User Menu */}
          <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Account settings">
              <IconButton
                onClick={handleMenuClick}
                size="small"
                aria-controls={open ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                sx={{ 
                  ml: 2,
                  p: 0.5, 
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  }
                }}
              >
                <Avatar 
                  alt="User" 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: theme.palette.secondary.main 
                  }}
                >
                  <PersonIcon fontSize="small" />
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
          
          {/* Account Menu */}
          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={open}
            onClose={handleMenuClose}
            onClick={handleMenuClose}
            PaperProps={{
              elevation: 2,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
                mt: 1.5,
                borderRadius: 2,
                minWidth: 200,
                '&:before': {
                  content: '""',
                  display: 'block',
                  position: 'absolute',
                  top: 0,
                  right: 14,
                  width: 10,
                  height: 10,
                  bgcolor: 'background.paper',
                  transform: 'translateY(-50%) rotate(45deg)',
                  zIndex: 0,
                },
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem sx={{ py: 1.5 }}>
              <Avatar sx={{ mr: 2, bgcolor: userRole === 'tester' ? theme.palette.success.main : theme.palette.secondary.main }} />
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>{userName}</Typography>
                  {userRole === 'tester' && (
                    <Chip
                      label="Test User"
                      size="small"
                      color="success"
                      sx={{ 
                        height: 20, 
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        '& .MuiChip-label': { 
                          padding: '0 4px'
                        }
                      }}
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">{userEmail}</Typography>
              </Box>
            </MenuItem>
            
            <Divider />
            
            <MenuItem sx={{ py: 1 }}>
              <ListItemIcon>
                <PersonIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <Typography>My Profile</Typography>
            </MenuItem>
            
            <MenuItem sx={{ py: 1 }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" color="primary" />
              </ListItemIcon>
              <Typography>Settings</Typography>
            </MenuItem>
            
            <Divider />
            
            <MenuItem onClick={handleLogout} sx={{ py: 1 }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              <Typography color="error">Logout</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* Permanent drawer for desktop */}
        {!isMobile && (
          <Drawer
            variant="permanent"
            sx={{
              width: 280,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: { 
                width: 280, 
                boxSizing: 'border-box',
                borderRight: `1px solid ${theme.palette.divider}`,
                boxShadow: 'none',
                background: `linear-gradient(180deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`,
              },
              display: { xs: 'none', md: 'block' }
            }}
          >
            <Toolbar /> {/* For spacing under the AppBar */}
            {drawer}
          </Drawer>
        )}
        
        {/* Temporary drawer for mobile */}
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
        
        {/* Main content */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 3,
            width: { md: `calc(100% - 280px)` },
            marginTop: "64px", // Height of AppBar
            backgroundColor: 'transparent',
            position: 'relative',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2360A5FA\' fill-opacity=\'0.12\'%3E%3Cpath d=\'M24.8 30.2c-5.3-5.3-5.3-13.9 0-19.2 5.3-5.3 13.9-5.3 19.2 0 5.3 5.3 5.3 13.9 0 19.2l-9.6 9.6-9.6-9.6zm40 40c-5.3-5.3-5.3-13.9 0-19.2 5.3-5.3 13.9-5.3 19.2 0 5.3 5.3 5.3 13.9 0 19.2l-9.6 9.6-9.6-9.6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            backgroundPosition: 'center top',
            backgroundRepeat: 'repeat',
            backgroundSize: '80px 80px',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '240px',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.2)}, ${alpha(theme.palette.secondary.dark, 0.15)})`,
              zIndex: -1,
              borderRadius: '0 0 30px 30px',
            }
          }}
        >
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Fade in={true} timeout={800}>
              <Paper 
                elevation={0} 
                sx={{ 
                  p: { xs: 2, sm: 3 }, 
                  backgroundColor: 'transparent',
                  position: 'relative',
                  zIndex: 1,
                  borderRadius: '20px',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.75)}, ${alpha(theme.palette.background.default, 0.9)})`,
                    backdropFilter: 'blur(10px)',
                    zIndex: -1,
                    borderRadius: 'inherit',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                  }
                }}
              >
                {children}
              </Paper>
            </Fade>
          </Container>
        </Box>
      </Box>

      <Box 
        component="footer" 
        sx={{ 
          py: 4,
          px: 2,
          mt: 'auto',
          background: alpha(theme.palette.background.paper, 0.4),
          borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          position: 'relative',
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'44\' height=\'12\' viewBox=\'0 0 44 12\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M20 12v-2L0 0v10l4 2h16zm18 0l4-2V0L22 10v2h16zM20 0v8L4 0h16zm18 0L22 8V0h16z\' fill=\'%2360A5FA\' fill-opacity=\'0.08\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
          backgroundSize: '44px 12px',
          backgroundRepeat: 'repeat',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', sm: 'flex-start' },
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            <Box sx={{ 
              mb: { xs: 2, sm: 0 } }}>
              <Typography variant="subtitle2" color="text.primary" gutterBottom sx={{ 
                fontWeight: 600, 
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
              }}>
                NoteNest
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your cozy note-taking home
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="caption" color="text.secondary">
                © {new Date().getFullYear()} NoteNest. All rights reserved.
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Layout; 