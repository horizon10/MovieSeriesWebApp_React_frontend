import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { omdbApiId, interactionApi } from '../api';
import {
  Box, Typography, Card, CardContent, CardMedia,
  TextField, Button, Rating, List, ListItem,
  ListItemText, IconButton, Divider, Chip, Stack, Alert
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';

const MovieDetailPage = () => {
  const { imdbId} = useParams(); // Route'dan hem imdbId hem title alınmalı
  const [movie, setMovie] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Film detaylarını çek
        const movieRes = await omdbApiId.search(imdbId);
        if (movieRes.data) {
          setMovie(movieRes.data);
        } else {
          throw new Error('Film bilgileri alınamadı');
        }

        // Yorumları çek
        const commentRes = await interactionApi.getComments(imdbId);
        setComments(commentRes.data || []);

        // Ortalama puanı çek
        const ratingRes = await interactionApi.getAverageRating(imdbId);
        setAverageRating(ratingRes.data || 0);

        // Favori durumunu kontrol et
        // const favRes = await interactionApi.getFavorites();
        // setIsFavorite(favRes.data.some(fav => fav.imdbId === imdbId));
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'Beklenmeyen bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [imdbId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      await interactionApi.addComment(imdbId, newComment);
      const updated = await interactionApi.getComments(imdbId);
      setComments(updated.data);
      setNewComment('');
    } catch (err) {
      console.error('Add comment error:', err);
      setError('Yorum eklenirken hata oluştu');
    }
  };

  const handleRateMovie = async () => {
    try {
      await interactionApi.addRating(imdbId, userRating);
      const updated = await interactionApi.getAverageRating(imdbId);
      setAverageRating(updated.data);
    } catch (err) {
      console.error('Rating error:', err);
      setError('Puanlama yapılırken hata oluştu');
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await interactionApi.removeFavorite(imdbId);
      } else {
        await interactionApi.addFavorite(imdbId);
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Favorite toggle error:', err);
      setError('Favori işlemi sırasında hata oluştu');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>Loading...</Box>;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  if (!movie) return <Alert severity="warning" sx={{ m: 2 }}>Film bulunamadı</Alert>;

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', mt: 4, p: 2 }}>
      <Card>
        <CardMedia
          component="img"
          height="500"
          image={movie.Poster !== 'N/A' ? movie.Poster : '/placeholder.jpg'}
          alt={movie.Title}
          sx={{ objectFit: 'contain' }}
        />
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography gutterBottom variant="h4" component="h1">
              {movie.Title} ({movie.Year})
            </Typography>
            <IconButton onClick={toggleFavorite} size="large">
              {isFavorite ? <FavoriteIcon color="error" /> : <FavoriteBorderIcon />}
            </IconButton>
          </Box>

          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip label={movie.Rated} size="small" />
            <Chip label={movie.Runtime} size="small" />
            <Chip label={movie.Released} size="small" />
          </Stack>

          <Typography paragraph>{movie.Plot}</Typography>
<Box sx={{ my: 2 }}>
  <Typography variant="subtitle1">Full Details:</Typography>
  <Typography><strong>Director:</strong> {movie.direction}</Typography>
  <Typography><strong>Writers:</strong> {movie.Writer}</Typography>
  <Typography><strong>Cast:</strong> {movie.Actors}</Typography>
  <Typography><strong>Genre:</strong> {movie.Genre}</Typography>
  <Typography><strong>Language:</strong> {movie.Language}</Typography>
  <Typography><strong>Country:</strong> {movie.Country}</Typography>
  <Typography><strong>Awards:</strong> {movie.Awards}</Typography>
  <Typography><strong>Release Date:</strong> {movie.Released}</Typography>
  <Typography><strong>Runtime:</strong> {movie.Runtime}</Typography>
  <Typography><strong>Rating:</strong> {movie.Rated}</Typography>
  <Typography><strong>IMDb Rating:</strong> {movie.imdbRating}/10</Typography>
</Box>

          <Box mt={2}>
            <Typography component="legend">Average Rating</Typography>
            <Rating value={averageRating} precision={0.5} readOnly />
            <Typography variant="caption">({averageRating.toFixed(1)})</Typography>
          </Box>

          <Box mt={2}>
            <Typography component="legend">Your Rating</Typography>
            <Rating
              value={userRating}
              onChange={(e, val) => setUserRating(val)}
            />
            <Button 
              onClick={handleRateMovie} 
              sx={{ ml: 2 }} 
              variant="outlined"
              disabled={userRating === 0}
            >
              Submit Rating
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box mt={4}>
        <Typography variant="h5" gutterBottom>Comments</Typography>
        <Box display="flex" mt={2}>
          <TextField
            fullWidth
            variant="outlined"
            label="Add a comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            multiline
            rows={3}
          />
          <Button 
            variant="contained" 
            onClick={handleAddComment} 
            sx={{ ml: 2, height: '100%' }}
            disabled={!newComment.trim()}
          >
            Post
          </Button>
        </Box>

        <List sx={{ mt: 2 }}>
          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <div key={index}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={comment.username || 'Anonymous'}
                    secondary={
                      <>
                        <Typography
                          component="span"
                          variant="body2"
                          color="text.primary"
                          display="block"
                          sx={{ mb: 1 }}
                        >
                          {comment.content}
                        </Typography>
                        <Typography variant="caption">
                          {new Date(comment.createdAt).toLocaleString()}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
                {index < comments.length - 1 && <Divider />}
              </div>
            ))
          ) : (
            <Typography variant="body2" sx={{ p: 2 }} color="text.secondary">
              No comments yet. Be the first to comment!
            </Typography>
          )}
        </List>
      </Box>
    </Box>
  );
};

export default MovieDetailPage;