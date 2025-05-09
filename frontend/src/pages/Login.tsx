import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Container, 
  Grid, 
  InputAdornment, 
  IconButton, 
  CircularProgress,
  Divider,
  useTheme,
  alpha,
  Alert,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Lock as LockIcon, 
  Visibility, 
  VisibilityOff,
  Email as EmailIcon,
  LoginOutlined,
  Google as GoogleIcon,
  GitHub as GitHubIcon,
  Speed as SpeedIcon,
  BugReport as TestIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Form validation
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setEmailError('');
    setPasswordError('');
    setUsernameError('');
    setError('');
    
    // Validate email
    if (!email) {
      setEmailError('Email is required');
      return;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email is invalid');
      return;
    }
    
    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      return;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    // Validate username for signup
    if (!isLogin && !username) {
      setUsernameError('Username is required');
      return;
    }
    
    try {
      setLoading(true);
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, automatically log in
      localStorage.setItem('isAuthenticated', 'true');
      navigate('/');
      
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add quick login function
  const handleTestLogin = async () => {
    setLoading(true);
    setEmail('test@example.com');
    setPassword('test123');
    
    // Simulate API call with timeout
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // For demo purposes, automatically log in
    localStorage.setItem('isAuthenticated', 'true');
    localStorage.setItem('userRole', 'tester');
    localStorage.setItem('userName', 'Test User');
    localStorage.setItem('userEmail', 'test@example.com');
    
    navigate('/');
    setLoading(false);
  };

  return (
    <Container maxWidth="lg" sx={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      py: 4
    }}>
      <Grid container spacing={4} sx={{ 
        height: { md: '600px' },
        maxHeight: '90vh',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        {/* Left side - Image/Branding */}
        <Grid item xs={12} md={6} 
          component={motion.div}
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          sx={{ 
            p: 0,
            background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
            position: 'relative',
            display: { xs: 'none', md: 'block' },
            overflow: 'hidden',
            borderRadius: { md: '16px 0 0 16px' }
          }}
        >
          <Box sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://source.unsplash.com/random?notes)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            mixBlendMode: 'soft-light',
          }} />
          
          <Box sx={{ 
            position: 'relative', 
            height: '100%', 
            p: 6,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            zIndex: 1
          }}>
            <Typography 
              variant="h2" 
              color="white" 
              gutterBottom 
              sx={{ 
                fontWeight: 800,
                mb: 2
              }}
            >
              Smart Note <br />Organizer
            </Typography>
            <Typography 
              variant="h6" 
              color="white" 
              sx={{ 
                opacity: 0.8,
                mb: 4,
                fontWeight: 400,
                maxWidth: '80%'
              }}
            >
              Organize your thoughts, boost your productivity, and never lose track of important information.
            </Typography>
          </Box>
        </Grid>
        
        {/* Right side - Login Form */}
        <Grid item xs={12} md={6}
          component={motion.div}
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                {isLogin ? 'Welcome back!' : 'Create an account'}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {isLogin 
                  ? 'Sign in to continue to your account' 
                  : 'Join us and start organizing your notes'
                }
              </Typography>
            </Box>
            
            {/* Test account button */}
            <Button
              fullWidth
              variant="outlined"
              color="success"
              size="large"
              onClick={handleTestLogin}
              disabled={loading}
              startIcon={<TestIcon />}
              sx={{ 
                mb: 3,
                py: 1.5,
                borderWidth: '2px',
                borderStyle: 'dashed',
                '&:hover': {
                  borderWidth: '2px',
                  borderStyle: 'dashed',
                  backgroundColor: alpha(theme.palette.success.main, 0.1)
                }
              }}
            >
              Quick Access (Test Account)
            </Button>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <TextField
                  label="Username"
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  error={!!usernameError}
                  helperText={usernameError}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              
              <TextField
                label="Email"
                type="email"
                variant="outlined"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!emailError}
                helperText={emailError}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                variant="outlined"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!passwordError}
                helperText={passwordError}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center', 
                mt: 1, 
                mb: 3 
              }}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                  }
                  label="Remember me"
                />
                
                {isLogin && (
                  <Typography 
                    variant="body2" 
                    color="primary"
                    sx={{ 
                      cursor: 'pointer',
                      fontWeight: 500,
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    Forgot password?
                  </Typography>
                )}
              </Box>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginOutlined />}
                sx={{ 
                  py: 1.5,
                  mb: 2
                }}
              >
                {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
              
              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  sx={{ 
                    py: 1.2,
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                    color: theme.palette.text.primary
                  }}
                >
                  Google
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GitHubIcon />}
                  sx={{ 
                    py: 1.2,
                    borderColor: alpha(theme.palette.primary.main, 0.5),
                    color: theme.palette.text.primary
                  }}
                >
                  GitHub
                </Button>
              </Box>
              
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                  <Typography
                    component="span"
                    variant="body2"
                    color="primary"
                    sx={{ 
                      ml: 1, 
                      cursor: 'pointer',
                      fontWeight: 600,
                      '&:hover': { textDecoration: 'underline' }
                    }}
                    onClick={() => setIsLogin(!isLogin)}
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </Typography>
                </Typography>
              </Box>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Login; 