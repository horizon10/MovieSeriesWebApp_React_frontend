import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { omdbApi } from '../api';
import { 
  TextField, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

const searchMovies = async () => {
  setLoading(true);
  try {
    const response = await omdbApi.search(searchTerm);
    console.log('API Response:', response.data);

    // Tek film detayı gelirse diziye çevir
    if (response.data && response.data.imdbID) {
      setMovies([response.data]); // Tek filmi dizi içinde göster
    } 
    // Film listesi gelirse direkt ata
    else if (response.data && response.data.Search) {
      setMovies(response.data.Search);
    }
    // Hiç veri gelmezse
    else {
      setMovies([]);
      console.warn('No movies found for:', searchTerm);
    }
  } catch (error) {
    console.error('Search error:', error);
    setMovies([]);
  } finally {
    setLoading(false);
  }
};

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Welcome, {user?.username}</Typography>
      <Box sx={{ display: 'flex', mb: 3 }}>
        <TextField
          fullWidth
          label="Search for movies"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchMovies()}
        />
        <Button 
          variant="contained" 
          onClick={searchMovies} 
          sx={{ ml: 2 }}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Search'}
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {movies.map((movie) => (
            <Grid item xs={12} sm={6} md={4} key={movie.imdbID}>
              <Card>
                <CardMedia
                  component="img"
                  height="300"
                  image={movie.Poster !== 'N/A' ? movie.Poster : '/placeholder.jpg'}
                  alt={movie.Title}
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {movie.Title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {movie.Year}
                  </Typography>
                  <Button 
                    component={Link}
                    to={`/movie/${movie.imdbID}`}
                    variant="outlined" 
                    size="small"
                    sx={{ mt: 2 }}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default HomePage;