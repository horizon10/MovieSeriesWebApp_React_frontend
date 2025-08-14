// src/components/Navbar.js
import { Link, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton,
  Tooltip,
  useTheme as useMuiTheme,
  Fade
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PopcornIcon from '@mui/icons-material/LocalMovies';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    window.location.reload();
  };

  return (
    <AppBar 
      position="static" 
      sx={{ 
        background: darkMode 
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
        boxShadow: darkMode 
          ? '0 4px 20px rgba(0, 0, 0, 0.3)'
          : '0 4px 20px rgba(33, 150, 243, 0.3)',
        mb: 4,
        transition: 'all 0.3s ease',
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Left side - Logo and main navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            color="inherit" 
            component={Link} 
            to="/" 
            sx={{ 
              mr: 1,
              '&:hover': {
                transform: 'scale(1.1)',
                transition: 'transform 0.3s ease'
              }
            }}
          >
            <PopcornIcon fontSize="large" />
          </IconButton>
          
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              mr: 3,
              fontFamily: '"Bebas Neue", cursive',
              letterSpacing: '1.5px',
              display: { xs: 'none', sm: 'block' }
            }}
          >
            <Button 
              color="inherit" 
              component={Link} 
              to="/" 
              sx={{ 
                fontSize: '1.5rem',
                '&:hover': {
                  color: darkMode ? '#f5a623' : '#ffeb3b'
                }
              }}
            >
              CineSearch
            </Button>
          </Typography>
          
          <Button 
            color="inherit" 
            component={Link} 
            to="/" 
            sx={{ 
              mx: 1,
              '&:hover': {
                color: darkMode ? '#f5a623' : '#ffeb3b',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Ana Sayfa
          </Button>
          <Button
  color="inherit"
  component={Link}
  to="/contact"
  sx={{
    mx: 1,
    '&:hover': {
      color: darkMode ? '#f5a623' : '#ffeb3b',
      backgroundColor: 'rgba(255,255,255,0.1)'
    }
  }}
>
  İletişim
</Button>

        </Box>
        
        {/* Right side - Theme toggle and user navigation */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Theme Toggle Button */}
          <Tooltip 
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            arrow
          >
            <IconButton 
              onClick={toggleTheme}
              sx={{ 
                mx: 1,
                color: 'inherit',
                backgroundColor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  transform: 'rotate(180deg)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              <Fade in={true} key={darkMode ? 'dark' : 'light'}>
                {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </Fade>
            </IconButton>
          </Tooltip>

          {user ? (
            <>
              {(user.role === 'ROLE_ADMIN' || user.role === 'ROLE_MODERATOR') && (
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/admin"
                  sx={{ 
                    mx: 1,
                    backgroundColor: 'rgba(255,165,0,0.2)',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(255,165,0,0.3)',
                      transform: 'translateY(-2px)',
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  Admin
                </Button>
              )}
              <Button 
                color="inherit" 
                component={Link} 
                to="/profile"
                sx={{ 
                  mx: 1,
                  borderRadius: 2,
                  '&:hover': {
                    color: darkMode ? '#f5a623' : '#ffeb3b',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Profilim
              </Button>
              <Button 
                color="inherit" 
                onClick={handleLogout}
                sx={{ 
                  mx: 1,
                  backgroundColor: 'rgba(244,67,54,0.2)',
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(244,67,54,0.3)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Çıkış Yap
              </Button>
            </>
          ) : (
            <>
              <Button 
                color="inherit" 
                component={Link} 
                to="/login"
                sx={{ 
                  mx: 1,
                  borderRadius: 2,
                  '&:hover': {
                    color: darkMode ? '#f5a623' : '#ffeb3b',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Giriş Yap
              </Button>
              <Button 
                variant="outlined" 
                color="inherit" 
                component={Link} 
                to="/register"
                sx={{ 
                  mx: 1,
                  borderRadius: 2,
                  borderColor: darkMode ? '#f5a623' : '#ffeb3b',
                  color: darkMode ? '#f5a623' : '#ffeb3b',
                  '&:hover': {
                    backgroundColor: darkMode 
                      ? 'rgba(245, 166, 35, 0.1)' 
                      : 'rgba(255, 235, 59, 0.1)',
                    borderColor: darkMode ? '#ffc107' : '#fff176',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                Kayıt Ol
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;