import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { interactionApi } from '../api';
import { 
  Typography, 
  Box, 
  List, 
  ListItem, 
  ListItemText, 
  Divider,
  Card,
  CardContent,
  Avatar
} from '@mui/material';

const UserProfilePage = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await interactionApi.getFavorites();
        setFavorites(response.data);
      } catch (error) {
        console.error('Error fetching favorites:', error);
      }
    };
    
    fetchFavorites();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ width: 56, height: 56, mr: 2 }}>
            {user?.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h5">{user?.username}</Typography>
            <Typography variant="body2" color="text.secondary">
              Member since {new Date().toLocaleDateString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>Your Favorites</Typography>
      {favorites.length === 0 ? (
        <Typography variant="body1">You haven't added any favorites yet.</Typography>
      ) : (
        <List>
          {favorites.map((fav, index) => (
            <div key={index}>
              <ListItem>
                <ListItemText
                  primary={fav.movieTitle || fav.imdbId}
                  secondary={`Added on ${new Date(fav.createdAt).toLocaleDateString()}`}
                />
              </ListItem>
              {index < favorites.length - 1 && <Divider />}
            </div>
          ))}
        </List>
      )}
    </Box>
  );
};

export default UserProfilePage;