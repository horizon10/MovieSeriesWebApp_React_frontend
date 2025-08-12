import { Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import PopcornIcon from '@mui/icons-material/LocalMovies';

const Navbar = () => {
  const { user, logout } = useAuth();
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
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        mb: 4
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
                  color: '#f5a623'
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
                color: '#f5a623',
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            Home
          </Button>
        </Box>
        
        {/* Right side - User navigation */}
        <Box>
          {user ? (
            <>
              {(user.role === 'ROLE_ADMIN'|| user.role === 'ROLE_MODERATOR') && (
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/admin"
                  sx={{ 
                    mx: 1,
                    backgroundColor: 'rgba(255,165,0,0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,165,0,0.3)'
                    }
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
                  '&:hover': {
                    color: '#f5a623'
                  }
                }}
              >
                My Profile
              </Button>
              <Button 
                color="inherit" 
                onClick={handleLogout}
                sx={{ 
                  mx: 1,
                  backgroundColor: 'rgba(255,0,0,0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,0,0,0.3)'
                  }
                }}
              >
                Logout
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
                  '&:hover': {
                    color: '#f5a623'
                  }
                }}
              >
                Login
              </Button>
              <Button 
                variant="outlined" 
                color="inherit" 
                component={Link} 
                to="/register"
                sx={{ 
                  mx: 1,
                  borderColor: '#f5a623',
                  color: '#f5a623',
                  '&:hover': {
                    backgroundColor: 'rgba(245, 166, 35, 0.1)',
                    borderColor: '#ffc107'
                  }
                }}
              >
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;