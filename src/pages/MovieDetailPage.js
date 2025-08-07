import { useState, useEffect } from 'react';

import { omdbApiId, interactionApi } from '../api';
import {
  Box, Typography, Card, CardContent, CardMedia,
  TextField, Button, Rating, List, ListItem,
  ListItemText, IconButton, Divider, Chip, Stack, Alert, Snackbar,
  Paper, Grid, Avatar, Fade, Skeleton, Container, LinearProgress,
  Backdrop, CircularProgress
} from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useAuth } from '../context/AuthContext';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import StarIcon from '@mui/icons-material/Star';
import CommentIcon from '@mui/icons-material/Comment';
import ShareIcon from '@mui/icons-material/Share';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PublicIcon from '@mui/icons-material/Public';
import MovieIcon from '@mui/icons-material/Movie';
import PersonIcon from '@mui/icons-material/Person';
import { useParams, useNavigate } from 'react-router-dom';

const MovieDetailPage = () => {
  const { imdbId } = useParams();
  const [movie, setMovie] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

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
        try {
          const commentRes = await interactionApi.getComments(imdbId);
          setComments(commentRes.data || []);
        } catch (err) {
          console.warn('Comments fetch error:', err);
          setComments([]);
        }

        // Ortalama puanı çek
        try {
          const ratingRes = await interactionApi.getAverageRating(imdbId);
          setAverageRating(ratingRes.data || 0);
        } catch (err) {
          console.warn('Average rating fetch error:', err);
          setAverageRating(0);
        }

        // Favori durumunu kontrol et
        try {
          const favRes = await interactionApi.getFavorites();
          setIsFavorite(favRes.data.some(fav => fav.imdbId === imdbId));
        } catch (err) {
          console.warn('Favorites fetch error:', err);
          setIsFavorite(false);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'Beklenmeyen bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };
    
    if (imdbId) {
      fetchData();
    }
  }, [imdbId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      setError('Yorum boş olamaz');
      return;
    }

    try {
      setError(null);
      await interactionApi.addComment(imdbId, newComment.trim());
      
      // Yorumları yenile
      const updated = await interactionApi.getComments(imdbId);
      setComments(updated.data || []);
      setNewComment('');
      setSuccessMessage('Yorum başarıyla eklendi');
    } catch (err) {
      console.error('Add comment error:', err);
      setError('Yorum eklenirken hata oluştu: ' + (err.response?.data || err.message));
    }
  };

  const handleRateMovie = async () => {
    if (userRating === 0) {
      setError('Lütfen bir puan seçin');
      return;
    }

    try {
      setError(null);
      await interactionApi.addRating(imdbId, userRating);
      
      // Ortalama puanı yenile
      const updated = await interactionApi.getAverageRating(imdbId);
      setAverageRating(updated.data || 0);
      setSuccessMessage('Puanlama başarıyla kaydedildi');
    } catch (err) {
      console.error('Rating error:', err);
      setError('Puanlama yapılırken hata oluştu: ' + (err.response?.data || err.message));
    }
  };

  const toggleFavorite = async () => {
    try {
      setError(null);
      if (isFavorite) {
        await interactionApi.removeFavorite(imdbId);
        setSuccessMessage('Film favorilerden çıkarıldı');
      } else {
        await interactionApi.addFavorite(imdbId);
        setSuccessMessage('Film favorilere eklendi');
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Favorite toggle error:', err);
      setError('Favori işlemi sırasında hata oluştu: ' + (err.response?.data || err.message));
    }
  };

  const handleCloseSnackbar = () => {
    setSuccessMessage('');
    setError(null);
  };

  if (loading) {
    return (
      <Backdrop open sx={{ zIndex: 1300, color: '#fff' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2 }}>Film yükleniyor...</Typography>
        </Box>
      </Backdrop>
    );
  }

  if (!movie) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Alert 
          severity="warning" 
          sx={{ 
            borderRadius: 3,
            fontSize: '1.1rem',
            py: 2
          }}
        >
          Film bulunamadı
        </Alert>
      </Container>
    );
  }
  const getValidImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/')) {
    return url;
  }
  return `${process.env.REACT_APP_API_BASE_URL}${url}`;
};
  

  return (

<Box sx={{ 
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
  pb: 4,
  position: 'relative',
  color: '#ffffff' // Tüm yazılar için varsayılan beyaz renk
}}>
      {/* Backdrop Image */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '60vh',
          backgroundImage: movie.Poster !== 'N/A' ? `url(${movie.Poster})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.1,
          zIndex: 0
        }}
      />

      {/* Success/Error Snackbars */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success"
          sx={{ borderRadius: 2 }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="error"
          sx={{ borderRadius: 2 }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pt: 4 }}>
        <Fade in timeout={800}>
          <Grid container spacing={4}>
            {/* Film Posteri */}
            <Grid item xs={12} md={4}>
              <Paper 
                elevation={20}
                sx={{ 
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'scale(1.02)'
                  }
                }}
              >
                <CardMedia
                  component="img"
                  image={movie.Poster !== 'N/A' ? movie.Poster : '/placeholder.jpg'}
                  alt={movie.Title}
                  sx={{ 
                    height: { xs: 400, md: 600 },
                    objectFit: 'cover'
                  }}
                />
              </Paper>
            </Grid>

            {/* Film Bilgileri */}
            <Grid item xs={12} md={8}>
              <Paper 
                sx={{ 
                  p: 4, 
                  borderRadius: 4,
                  background: 'rgba(30, 30, 30, 0.95)',
                  backdropFilter: 'blur(10px)',
                  mb: 3
                }}
                elevation={10}
              >
                {/* Başlık ve Favori */}
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                  <Box>
                    <Typography 
                      variant="h3" 
                      component="h1" 
                      sx={{ 
                        fontWeight: 'bold',
                        background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1
                      }}
                    >
                      {movie.Title}
                    </Typography>
                    <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                      ({movie.Year})
                    </Typography>
                  </Box>
                    <IconButton 
    onClick={user ? toggleFavorite : () => navigate('/login')} 
    size="large"
    sx={{
      background: isFavorite ? 'rgba(244, 67, 54, 0.1)' : 'rgba(0,0,0,0.05)',
      '&:hover': {
        background: isFavorite ? 'rgba(244, 67, 54, 0.2)' : 'rgba(0,0,0,0.1)',
        transform: 'scale(1.1)'
      },
      transition: 'all 0.2s ease'
    }}
  >
    {isFavorite ? (
      <FavoriteIcon sx={{ color: '#f44336', fontSize: 32 }} />
    ) : (
      <FavoriteBorderIcon sx={{ fontSize: 32 }} />
    )}
  </IconButton>
                </Box>

                {/* Film Etiketleri */}
                <Stack direction="row" spacing={1} sx={{ mb: 3, flexWrap: 'wrap', gap: 1 }}>
                  <Chip 
                    label={movie.Rated} 
                    color="primary" 
                    sx={{ fontWeight: 'bold' }}
                  />
                  <Chip 
                    icon={<AccessTimeIcon />}
                    label={movie.Runtime} 
                    variant="outlined"
                  />
                  <Chip 
                    icon={<CalendarTodayIcon />}
                    label={movie.Released} 
                    variant="outlined"
                  />
                  <Chip 
                    icon={<PublicIcon />}
                    label={movie.Country} 
                    variant="outlined"
                  />
                </Stack>

                {/* Özet */}
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 3,
                    fontSize: '1.1rem',
                    lineHeight: 1.8,
                    fontStyle: 'italic',
                    color: 'text.secondary'
                  }}
                >
                  "{movie.Plot}"
                </Typography>

                {/* Puanlama Bölümü */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, borderRadius: 2, background: 'rgba(25, 118, 210, 0.05)' }}>
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                        <StarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Ortalama Puan
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Rating
  value={userRating}
  onChange={(e, val) => user ? setUserRating(val || 0) : navigate('/login')}
  size="large"
/>
                        <Typography variant="h6" color="primary">
                          ({averageRating.toFixed(1)})
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, borderRadius: 2, background: 'rgba(76, 175, 80, 0.05)' }}>
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Puanınız
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Rating
                          value={userRating}
                          onChange={(e, val) => setUserRating(val || 0)}
                          size="large"
                        />
                        <Button 
                          onClick={handleRateMovie} 
                          variant="contained"
                          disabled={userRating === 0}
                          sx={{ borderRadius: 2 }}
                        >
                          Oyla
                        </Button>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>

              {/* Detaylı Bilgiler */}
              <Paper 
                sx={{ 
                  p: 4, 
                  borderRadius: 4,
                  background: 'rgba(30, 30, 30, 0.95)',
                  backdropFilter: 'blur(10px)'
                }}
                elevation={10}
              >
                <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                  <MovieIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Detaylı Bilgiler
                </Typography>
                
                <Grid container spacing={2}>
                  {[
                    { label: 'Yönetmen', value: movie.Director, icon: '🎬' },
                    { label: 'Senaryo', value: movie.Writer, icon: '✍️' },
                    { label: 'Oyuncular', value: movie.Actors, icon: '🎭' },
                    { label: 'Tür', value: movie.Genre, icon: '🎪' },
                    { label: 'Dil', value: movie.Language, icon: '🌍' },
                    { label: 'Ödüller', value: movie.Awards, icon: '🏆' },
                    { label: 'IMDb Puanı', value: `${movie.imdbRating}/10`, icon: '⭐' }
                  ].map((item, index) => (
                    <Grid item xs={12} key={index}>
                      <Box 
                        sx={{ 
                          display: 'flex',
                          alignItems: 'flex-start',
                          p: 2,
                          borderRadius: 2,
                          background: index % 2 === 0 ? 'rgba(0,0,0,0.03)' : 'transparent',
                          transition: 'background 0.2s ease',
                          '&:hover': {
                            background: 'rgba(25, 118, 210, 0.05)'
                          }
                        }}
                      >
                        <Typography sx={{ fontSize: '1.2rem', mr: 2 }}>
                          {item.icon}
                        </Typography>
                        <Box>
                          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
                            {item.label}:
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {item.value}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Fade>

        {/* Yorumlar Bölümü */}
        <Fade in timeout={1200}>
          <Paper 
            sx={{ 
              mt: 4, 
              p: 4, 
              borderRadius: 4,
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(10px)'
            }}
            elevation={10}
          >
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
              <CommentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Yorumlar ({comments.length})
            </Typography>

            {/* Yorum Ekleme */}
            {user ? (
  <Paper sx={{ p: 3, mb: 3, background: 'rgba(25, 118, 210, 0.05)' }} elevation={2}>
    <TextField
      fullWidth
      variant="outlined"
      label="Yorumunuzu yazın..."
      value={newComment}
      onChange={(e) => setNewComment(e.target.value)}
      multiline
      rows={3}
      sx={{ mb: 2 }}
      onKeyPress={(e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          handleAddComment();
        }
      }}
    />
    <Box display="flex" justifyContent="space-between" alignItems="center">
      <Typography variant="caption" color="text.secondary">
        Ctrl + Enter ile gönder
      </Typography>
      <Button 
        variant="contained" 
        onClick={handleAddComment}
        disabled={!newComment.trim()}
        sx={{ borderRadius: 2, px: 3 }}
      >
        Yorum Yap
      </Button>
    </Box>
  </Paper>
) : (
  <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
    <Button 
      variant="outlined" 
      onClick={() => navigate('/login')}
      startIcon={<CommentIcon />}
    >
      Yorum yapmak için giriş yapın
    </Button>
  </Paper>
)}

            {/* Yorumlar Listesi */}
            {comments.length > 0 ? (
              <List sx={{ maxHeight: 500, overflow: 'auto' }}>
                {comments.map((comment, index) => (
                  <Box key={comment.id || index}>
                    <ListItem 
                      alignItems="flex-start"
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        background: 'rgba(0,0,0,0.02)',
                        '&:hover': {
                          background: 'rgba(25, 118, 210, 0.05)'
                        }
                      }}
                    >
                      <Avatar 
            sx={{ mr: 2, mt: 0.5, bgcolor: 'primary.main' }}
            src={comment.userImage || undefined}
          >
            {!comment.userImage && <PersonIcon />}
          </Avatar>
                      <ListItemText
  primary={
    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
      {comment.username || 'Anonim Kullanıcı'}
    </Typography>
  }
  secondary={
    <>
      <Typography
        variant="body1"
        component="div"
        sx={{ 
          mt: 1,
          mb: 1,
          color: 'text.primary',
          lineHeight: 1.6
        }}
      >
        {comment.content}
      </Typography>
      <Typography 
        variant="caption" 
        component="div" 
        color="text.secondary"
      >
        {comment.createdAt ? new Date(comment.createdAt).toLocaleString('tr-TR') : 'Şimdi'}
      </Typography>
    </>
  }
  secondaryTypographyProps={{ component: "div" }}
/>
                    </ListItem>
                    {index < comments.length - 1 && <Divider sx={{ my: 1 }} />}
                  </Box>
                ))}
              </List>
            ) : (
              <Paper 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  background: 'rgba(0,0,0,0.02)',
                  borderStyle: 'dashed',
                  borderWidth: 2,
                  borderColor: 'divider'
                }}
              >
                <CommentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  Henüz yorum yapılmamış
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  İlk yorumu yapan siz olun!
                </Typography>
              </Paper>
            )}
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default MovieDetailPage;