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
  Chip,
  InputBase,
  alpha
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
  Home as HomeIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
  Notifications as NotificationsIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import HelpSupportPanel from './HelpSupportPanel';

interface LayoutProps {
  children: React.ReactNode;
  toggleThemeMode: () => void;
  themeMode: 'light' | 'dark';
}

const Layout: React.FC<LayoutProps> = ({ children, toggleThemeMode, themeMode }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const location = useLocation();
  
  // Add state for sidebar collapse
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  
  // Add user menu state
  const [userMenuAnchor, setUserMenuAnchor] = React.useState<null | HTMLElement>(null);
  const userMenuOpen = Boolean(userMenuAnchor);
  
  // Add help support panel state
  const [helpPanelOpen, setHelpPanelOpen] = React.useState(false);

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

    // Load sidebar collapsed state from localStorage
    const storedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (storedSidebarState) {
      setSidebarCollapsed(storedSidebarState === 'true');
    }
  }, []);

  // Save sidebar state to localStorage when changed
  React.useEffect(() => {
    localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString());
  }, [sidebarCollapsed]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  const handleHelpPanelOpen = () => {
    setHelpPanelOpen(true);
  };
  
  const handleHelpPanelClose = () => {
    setHelpPanelOpen(false);
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

  // Define sidebar widths
  const expandedWidth = 280;
  const collapsedWidth = 70;
  const sidebarWidth = sidebarCollapsed ? collapsedWidth : expandedWidth;

  const drawer = (
    <Box sx={{ 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      overflow: 'hidden' // Remove scrollbars
    }}>
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
        {/* Remove the top right toggle button since we'll add a centered one */}
        
        <Box
          sx={{
            width: sidebarCollapsed ? 50 : 70,
            height: sidebarCollapsed ? 50 : 70,
            borderRadius: '10px',
            background: '#FFFFFF', // Solid white background for better contrast
            mb: 1,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            padding: '6px',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            transition: 'all 0.3s ease',
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
        <Typography variant="h6" sx={{ fontWeight: 600, display: sidebarCollapsed ? 'none' : 'block' }}>
          NoteNest
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            opacity: 0.8,
            display: sidebarCollapsed ? 'none' : 'block',
            textAlign: 'center',
            fontSize: '0.85rem',
            fontStyle: 'italic',
            mt: 0.5,
            fontWeight: 500
          }}
        >
          Think it. Note it. Own it.
        </Typography>
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
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
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
                transform: sidebarCollapsed ? 'scale(1.1)' : 'translateX(5px)',
                transition: 'all 0.3s ease-in-out'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <Tooltip title={sidebarCollapsed ? item.text : ""} placement="right">
              <ListItemIcon sx={{ 
                color: isActive(item.path) ? 'white' : theme.palette.primary.main,
                minWidth: sidebarCollapsed ? 0 : 40,
                mr: sidebarCollapsed ? 0 : 2,
                justifyContent: 'center'
              }}>
                {item.icon}
              </ListItemIcon>
            </Tooltip>
            {!sidebarCollapsed && (
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{ 
                  fontWeight: isActive(item.path) ? 600 : 400
                }}
              />
            )}
          </ListItem>
        ))}
      </List>
      
      <Divider />
      
      <Box sx={{ p: sidebarCollapsed ? 1 : 2, display: 'flex', flexDirection: 'column', alignItems: sidebarCollapsed ? 'center' : 'flex-start' }}>
        {!sidebarCollapsed && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
            Tools & Account
          </Typography>
        )}
        
        {sidebarCollapsed ? (
          <Tooltip title="Help & Support" placement="right">
            <IconButton 
              color="primary"
              sx={{ mb: 1 }}
              onClick={handleHelpPanelOpen}
            >
              <HelpIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <Button 
            variant="outlined" 
            fullWidth 
            startIcon={<HelpIcon />}
            onClick={handleHelpPanelOpen}
            sx={{ 
              mb: 1,
              justifyContent: 'flex-start',
              borderRadius: 2,
            }}
          >
            Help & Support
          </Button>
        )}
        
        {sidebarCollapsed ? (
          <Tooltip title="Logout" placement="right">
            <IconButton 
              color="error"
              onClick={handleLogout}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
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
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Help & Support Panel */}
      <HelpSupportPanel 
        open={helpPanelOpen} 
        onClose={handleHelpPanelClose} 
      />
      
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
                background: '#FFFFFF', // Solid white background for better contrast
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
          
          {/* Spacer */}
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Right side toolbar items */}
          <Stack direction="row" spacing={1} alignItems="center">
            {/* Search button - navigates to search page */}
            <Tooltip title="Search">
              <IconButton 
                color="inherit" 
                onClick={() => navigate('/search')}
                sx={{ borderRadius: 2 }}
              >
                <SearchIcon />
              </IconButton>
            </Tooltip>
            
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton 
                color="inherit"
                sx={{ borderRadius: 2 }}
              >
                <NotificationsIcon />
              </IconButton>
            </Tooltip>
            
            {/* Dark/Light mode toggle */}
            <Tooltip title={`Switch to ${themeMode === 'dark' ? 'light' : 'dark'} mode`}>
              <IconButton
                onClick={toggleThemeMode}
                color="inherit"
                sx={{ 
                  ml: 1, 
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    transform: 'rotate(30deg)'
                  }
                }}
              >
                {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>
            
            {/* User profile menu */}
            <Box sx={{ ml: 1 }}>
              <Tooltip title="Account settings">
                <IconButton
                  onClick={handleUserMenuOpen}
                  size="small"
                  edge="end"
                  aria-label="account of current user"
                  aria-controls={userMenuOpen ? 'account-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={userMenuOpen ? 'true' : undefined}
                  sx={{ 
                    ml: 1,
                    p: 0.5,
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    borderRadius: '50%'
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: theme.palette.primary.main
                    }}
                  >
                    {userName.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
            </Box>
            
            {/* User Menu */}
            <Menu
              anchorEl={userMenuAnchor}
              id="account-menu"
              open={userMenuOpen}
              onClose={handleUserMenuClose}
              onClick={handleUserMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                elevation: 3,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                  mt: 1.5,
                  borderRadius: 2,
                  width: 220,
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
            >
              <Box sx={{ px: 2, pt: 2, pb: 1 }}>
                <Typography variant="subtitle2" noWrap>
                  {userName}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {userEmail}
                </Typography>
              </Box>
              
              <Divider />
              
              <MenuItem component={RouterLink} to="/profile">
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                My Profile
              </MenuItem>
              
              <MenuItem component={RouterLink} to="/settings">
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                Settings
              </MenuItem>
              
              <Divider />
              
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Stack>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* Permanent drawer for desktop - with dynamic width */}
        {!isMobile && (
          <>
            <Drawer
              variant="permanent"
              sx={{
                width: sidebarWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: { 
                  width: sidebarWidth, 
                  boxSizing: 'border-box',
                  borderRight: `1px solid ${theme.palette.divider}`,
                  boxShadow: 'none',
                  background: `linear-gradient(180deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.background.default, 1)} 100%)`,
                  overflowX: 'hidden',
                  transition: 'width 0.3s ease'
                },
                display: { xs: 'none', md: 'block' }
              }}
            >
              <Toolbar /> {/* For spacing under the AppBar */}
              {drawer}
            </Drawer>

            {/* Add the vertical toggle bar */}
            <Box
              onClick={toggleSidebar}
              sx={{
                position: 'fixed',
                left: sidebarWidth - 3,
                top: '50%',
                transform: 'translateY(-50%)',
                height: '160px',
                width: '18px',
                backgroundColor: alpha(theme.palette.primary.main, 0.65),
                borderRadius: '8px',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
                zIndex: theme.zIndex.drawer + 2,
                cursor: 'pointer',
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.dark, 0.75),
                  boxShadow: `0 0 15px ${alpha(theme.palette.primary.main, 0.4)}`,
                  transform: 'translateY(-50%) scale(1.05)',
                },
                transition: 'all 0.3s ease, left 0.3s ease, transform 0.2s ease',
                backdropFilter: 'blur(2px)',
              }}
            >
              {/* Add a subtle drag bar pattern */}
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    height: '4px',
                    width: '6px',
                    backgroundColor: 'white',
                    borderRadius: '2px',
                    margin: '3px 0',
                  }}
                />
              ))}
              <Box
                sx={{
                  height: '24px',
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: 'white',
                  marginTop: '8px',
                }}
              >
                {sidebarCollapsed ? (
                  <ChevronRightIcon sx={{ fontSize: '22px', opacity: 1 }} />
                ) : (
                  <ChevronLeftIcon sx={{ fontSize: '22px', opacity: 1 }} />
                )}
              </Box>
            </Box>
          </>
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
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: expandedWidth,
              overflowX: 'hidden'
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Main content - adjust width based on sidebar state */}
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            p: 3,
            width: { md: `calc(100% - ${sidebarWidth}px)` },
            marginTop: "64px", // Height of AppBar
            backgroundColor: 'transparent',
            position: 'relative',
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'80\' height=\'80\' viewBox=\'0 0 80 80\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%2360A5FA\' fill-opacity=\'0.12\'%3E%3Cpath d=\'M24.8 30.2c-5.3-5.3-5.3-13.9 0-19.2 5.3-5.3 13.9-5.3 19.2 0 5.3 5.3 5.3 13.9 0 19.2l-9.6 9.6-9.6-9.6zm40 40c-5.3-5.3-5.3-13.9 0-19.2 5.3-5.3 13.9-5.3 19.2 0 5.3 5.3 5.3 13.9 0 19.2l-9.6 9.6-9.6-9.6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
            backgroundPosition: 'center top',
            backgroundRepeat: 'repeat',
            backgroundSize: '80px 80px',
            transition: 'width 0.3s ease',
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
                Think it. Note it. Own it.
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