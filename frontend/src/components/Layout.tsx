import React, { useState, useEffect, createContext, useContext } from 'react';
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
  alpha,
  Snackbar,
  Alert,
  Badge
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

// Create notification context
interface NotificationItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: Date;
  read: boolean;
  category?: 'note' | 'flashcard' | 'system';
  title?: string; // Optional title for the notification (e.g., note title)
}

interface NotificationContextType {
  showNotification: (message: string, type: 'success' | 'error' | 'info' | 'warning', category?: 'note' | 'flashcard' | 'system', title?: string) => void;
  notifications: NotificationItem[];
  unreadCount: number;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Hook to use notification system
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

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

  // Notification system state
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    type: 'success'
  });

  // Store notification history
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    // Try to load saved notifications from localStorage
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      try {
        return JSON.parse(savedNotifications);
      } catch (e) {
        console.error('Failed to parse saved notifications:', e);
        return [];
      }
    }
    return [];
  });
  
  // Calculate unread count from loaded notifications
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    return notifications.filter(n => !n.read).length;
  });
  
  // Notification menu state
  const [notificationMenuAnchor, setNotificationMenuAnchor] = useState<null | HTMLElement>(null);
  const notificationMenuOpen = Boolean(notificationMenuAnchor);
  
  // Demo notification menu state (separate from main notification menu)
  const [demoMenuAnchor, setDemoMenuAnchor] = useState<null | HTMLElement>(null);
  const demoMenuOpen = Boolean(demoMenuAnchor);

  // Function to show notification
  const showNotification = (
    message: string, 
    type: 'success' | 'error' | 'info' | 'warning' = 'success',
    category: 'note' | 'flashcard' | 'system' = 'system',
    title?: string
  ) => {
    // Format message with title for notes and flashcards
    let displayMessage = message;
    if ((category === 'note' || category === 'flashcard') && title) {
      displayMessage = `"${title}" ${message}`;
    }
    
    // Show the toast notification
    setNotification({
      open: true,
      message: displayMessage,
      type
    });
    
    // Add to notification history
    const newNotification: NotificationItem = {
      id: Date.now().toString(),
      message: displayMessage,
      type,
      timestamp: new Date(),
      read: false,
      category,
      title
    };
    
    // Update notifications and save to localStorage
    const updatedNotifications = [newNotification, ...notifications].slice(0, 50);
    setNotifications(updatedNotifications);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    
    setUnreadCount(prev => prev + 1);
  };

  // Function to handle demo menu
  const handleDemoMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault(); // Prevent default context menu
    setDemoMenuAnchor(event.currentTarget);
  };

  const handleDemoMenuClose = () => {
    setDemoMenuAnchor(null);
  };

  // Function to mark all notifications as read
  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({ 
      ...notification, 
      read: true 
    }));
    
    setNotifications(updatedNotifications);
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    setUnreadCount(0);
  };

  // Function to handle notification close
  const handleNotificationClose = (_?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification({ ...notification, open: false });
  };
  
  // Function to handle notification menu
  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationMenuAnchor(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationMenuAnchor(null);
    
    // Mark all as read when closing menu
    markAllAsRead();
  };

  // Handle help panel
  const handleHelpPanelOpen = () => {
    setHelpPanelOpen(true);
  };

  const handleHelpPanelClose = () => {
    setHelpPanelOpen(false);
  };

  // Functions to handle user menu
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  // Function to toggle sidebar collapse state
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };
  
  // Function to handle logout
  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    
    // Use React Router's navigate instead of direct window changes
    navigate('/login');
  };

  // Function to navigate to dashboard when logo is clicked
  const handleLogoClick = () => {
    // Use React Router's navigate instead of direct window changes
    navigate('/');
  };

  // Load user info from localStorage on component mount
  React.useEffect(() => {
    const storedName = localStorage.getItem('userName');
    const storedEmail = localStorage.getItem('userEmail');
    const storedRole = localStorage.getItem('userRole');
    
    if (storedName) setUserName(storedName);
    if (storedEmail) setUserEmail(storedEmail);
    if (storedRole) setUserRole(storedRole);
    
    // Check if sidebar state is stored
    const storedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (storedSidebarState !== null) {
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
            cursor: 'pointer' // Add cursor pointer to indicate clickability
          }}
          onClick={handleLogoClick} // Add click handler to navigate to dashboard
        >
          <img 
            src="/logo.jpg" 
            alt="Nest Logo" 
            style={{ 
              width: '100%',
              height: 'auto',
              objectFit: 'scale-down'
            }} 
          />
        </Box>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600, 
            display: sidebarCollapsed ? 'none' : 'block',
            cursor: 'pointer' // Add cursor pointer to indicate clickability
          }}
          onClick={handleLogoClick} // Add click handler to navigate to dashboard
        >
          Nest
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
    <NotificationContext.Provider value={{ 
      showNotification, 
      notifications,
      unreadCount,
      markAllAsRead
    }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Help & Support Panel */}
        <HelpSupportPanel 
          open={helpPanelOpen} 
          onClose={handleHelpPanelClose} 
        />
        
        {/* Notification Snackbar */}
        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          open={notification.open}
          autoHideDuration={4000}
          onClose={handleNotificationClose}
          sx={{
            mt: 8, // To position below the app bar
            '& .MuiAlert-root': {
              minWidth: '250px',
              boxShadow: 'none', // Remove shadow that might cause performance issues
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderRadius: 2,
              backgroundColor: theme.palette.background.paper, // Use solid color instead of alpha
              // Remove backdropFilter which can cause rendering issues
              '&.MuiAlert-standardSuccess': {
                borderLeft: `4px solid ${theme.palette.success.main}`
              },
              '&.MuiAlert-standardError': {
                borderLeft: `4px solid ${theme.palette.error.main}`
              },
              '&.MuiAlert-standardWarning': {
                borderLeft: `4px solid ${theme.palette.warning.main}`
              },
              '&.MuiAlert-standardInfo': {
                borderLeft: `4px solid ${theme.palette.info.main}`
              },
            }
          }}
        >
          <Alert
            onClose={handleNotificationClose}
            severity={notification.type}
            elevation={0}
            variant="standard"
            iconMapping={{
              success: <NotificationsIcon fontSize="inherit" />,
              error: <NotificationsIcon fontSize="inherit" />,
              warning: <NotificationsIcon fontSize="inherit" />,
              info: <NotificationsIcon fontSize="inherit" />
            }}
            sx={{
              alignItems: 'center',
              '& .MuiAlert-icon': {
                padding: theme.spacing(1),
                borderRadius: '50%',
                backgroundColor: theme.palette.background.paper, // Use solid color
                color: theme.palette.primary.main,
              },
              '& .MuiAlert-message': {
                fontWeight: 500,
              },
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
        
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
                gap: 1,
                cursor: 'pointer' // Add cursor pointer to indicate clickability
              }}
              onClick={handleLogoClick} // Add click handler to navigate to dashboard
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
                  src="/logo.jpg" 
                  alt="Nest Logo" 
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
                Nest
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
              <Tooltip title="Notifications (right-click for test options)">
                <IconButton 
                  color="inherit"
                  sx={{ borderRadius: 2 }}
                  onClick={handleNotificationMenuOpen}
                  onContextMenu={handleDemoMenuOpen}
                  aria-label={`${unreadCount} unread notifications`}
                  aria-controls={notificationMenuOpen ? 'notification-menu' : undefined}
                  aria-haspopup="true"
                  aria-expanded={notificationMenuOpen ? 'true' : undefined}
                >
                  <Badge 
                    badgeContent={unreadCount} 
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        // Remove the animation that might cause performance issues
                      }
                    }}
                  >
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              
              {/* Notification Menu */}
              <Menu
                id="notification-menu"
                anchorEl={notificationMenuAnchor}
                open={notificationMenuOpen}
                onClose={handleNotificationMenuClose}
                sx={{
                  mt: 1.5,
                  '& .MuiPaper-root': {
                    width: 320,
                    maxHeight: 400,
                    overflow: 'auto',
                    boxShadow: theme.shadows[4],
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    p: 0,
                  },
                  '& .MuiList-root': {
                    p: 0,
                  }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    overflow: 'visible',
                    filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
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
                <Box sx={{ 
                  p: 2, 
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`, 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Notifications
                  </Typography>
                  {notifications.length > 0 && (
                    <Button 
                      size="small" 
                      onClick={() => {
                        setNotifications([]);
                        localStorage.setItem('notifications', JSON.stringify([]));
                        setUnreadCount(0);
                      }} 
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Clear All
                    </Button>
                  )}
                </Box>
                
                {notifications.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <NotificationsIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      No notifications yet
                    </Typography>
                  </Box>
                ) : (
                  <List sx={{ p: 0 }}>
                    {notifications.map((notif) => {
                      const isRecent = new Date().getTime() - notif.timestamp.getTime() < 1000 * 60 * 60; // Less than an hour old
                      
                      // Determine the icon based on notification category
                      let icon;
                      switch (notif.category) {
                        case 'note':
                          icon = <NoteIcon fontSize="small" />;
                          break;
                        case 'flashcard':
                          icon = <SchoolIcon fontSize="small" />;
                          break;
                        default:
                          icon = <NotificationsIcon fontSize="small" />;
                      }
                      
                      // Format the timestamp
                      const timeAgo = () => {
                        // Ensure timestamp is a Date object
                        const timestamp = notif.timestamp instanceof Date ? 
                          notif.timestamp : new Date(notif.timestamp);
                        
                        const seconds = Math.floor((new Date().getTime() - timestamp.getTime()) / 1000);
                        
                        if (seconds < 60) return 'Just now';
                        
                        const minutes = Math.floor(seconds / 60);
                        if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
                        
                        const hours = Math.floor(minutes / 60);
                        if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
                        
                        const days = Math.floor(hours / 24);
                        if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
                        
                        return timestamp.toLocaleDateString();
                      };
                      
                      return (
                        <MenuItem 
                          key={notif.id} 
                          sx={{ 
                            py: 1,
                            px: 2,
                            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                            opacity: notif.read ? 0.8 : 1,
                            position: 'relative',
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.04),
                            },
                            ...(isRecent && !notif.read ? {
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                left: 3,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                backgroundColor: theme.palette.primary.main,
                              }
                            } : {}),
                          }}
                        >
                          <ListItemIcon sx={{ 
                            color: theme.palette[notif.type].main,
                            minWidth: 36,
                          }}>
                            {icon}
                          </ListItemIcon>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" sx={{ fontWeight: notif.read ? 400 : 500 }}>
                              {notif.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {timeAgo()}
                            </Typography>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </List>
                )}
              </Menu>
              
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

              {/* Demo notification triggers - right click the bell for testing options */}
              <Menu
                id="notification-demo-menu"
                anchorEl={demoMenuAnchor}
                open={demoMenuOpen}
                onClose={handleDemoMenuClose}
                MenuListProps={{
                  'aria-labelledby': 'demo-notification-button',
                }}
              >
                <MenuItem onClick={() => {
                  showNotification('created successfully', 'success', 'note', 'My Important Note');
                  handleDemoMenuClose();
                }}>
                  Add Note Notification
                </MenuItem>
                <MenuItem onClick={() => {
                  showNotification('Flashcards generated successfully', 'success', 'flashcard');
                  handleDemoMenuClose();
                }}>
                  Add Flashcard Notification
                </MenuItem>
                <MenuItem onClick={() => {
                  showNotification('This is an info message', 'info', 'system');
                  handleDemoMenuClose();
                }}>
                  Add Info Notification
                </MenuItem>
                <MenuItem onClick={() => {
                  showNotification('Something went wrong', 'error', 'system');
                  handleDemoMenuClose();
                }}>
                  Add Error Notification
                </MenuItem>
              </Menu>
              
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
                  Nest
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Think it. Note it. Own it.
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="text.secondary">
                  © {new Date().getFullYear()} Nest. All rights reserved.
                </Typography>
              </Box>
            </Box>
          </Container>
        </Box>
      </Box>
    </NotificationContext.Provider>
  );
};

export default Layout; 