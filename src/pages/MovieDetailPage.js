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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';

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
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [commentLikes, setCommentLikes] = useState({}); 
  const [userLikedComments, setUserLikedComments] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

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

        // Yorumları ve beğenileri çek
        try {
          const commentRes = await interactionApi.getCommentsWithLikes(imdbId);
          console.log('Yorumlar ve beğeniler:', commentRes.data);
          
          const commentsData = commentRes.data || [];
          setComments(commentsData);
          
          // Beğeni bilgilerini state'lere ayarla
          const likesData = {};
          const userLikesData = {};
          
          commentsData.forEach(comment => {
            likesData[comment.id] = comment.likeCount || 0;
            userLikesData[comment.id] = comment.isLikedByCurrentUser || false;
          });
          
          setCommentLikes(likesData);
          setUserLikedComments(userLikesData);
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
    
    if (imdbId && user) {
      fetchData();
    }
  }, [imdbId, user]);

  const getValidImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http') || url.startsWith('/')) {
      return url;
    }
    return `${process.env.REACT_APP_API_BASE_URL}${url}`;
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      setError('Yorum boş olamaz');
      return;
    }

    try {
      setError(null);
      await interactionApi.addComment(imdbId, newComment.trim());
      
      // Yorumları beğenilerle birlikte yenile
      const updated = await interactionApi.getCommentsWithLikes(imdbId);
      const commentsData = updated.data || [];
      setComments(commentsData);
      
      // Beğeni bilgilerini güncelle
      const likesData = {};
      const userLikesData = {};
      
      commentsData.forEach(comment => {
        likesData[comment.id] = comment.likeCount || 0;
        userLikesData[comment.id] = comment.isLikedByCurrentUser || false;
      });
      
      setCommentLikes(likesData);
      setUserLikedComments(userLikesData);
      
      setNewComment('');
      setSuccessMessage('Yorum başarıyla eklendi');
    } catch (err) {
      console.error('Add comment error:', err);
      setError('Yorum eklenirken hata oluştu: ' + (err.response?.data || err.message));
    }
  };

  const handleAddReply = async (parentCommentId) => {
    if (!replyContent.trim()) {
      setError('Yanıt boş olamaz');
      return;
    }

    try {
      setError(null);
      await interactionApi.addReply(parentCommentId, replyContent.trim());
      
      // Yorumları yenile
      const updated = await interactionApi.getCommentsWithLikes(imdbId);
      const commentsData = updated.data || [];
      setComments(commentsData);
      
      // Beğeni bilgilerini güncelle
      const likesData = {};
      const userLikesData = {};
      
      commentsData.forEach(comment => {
        likesData[comment.id] = comment.likeCount || 0;
        userLikesData[comment.id] = comment.isLikedByCurrentUser || false;
      });
      
      setCommentLikes(likesData);
      setUserLikedComments(userLikesData);
      
      setReplyingTo(null);
      setReplyContent('');
      setSuccessMessage('Yanıt başarıyla eklendi');
    } catch (err) {
      console.error('Add reply error:', err);
      setError('Yanıt eklenirken hata oluştu: ' + (err.response?.data || err.message));
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setError(null);
      
      await interactionApi.likeComment(commentId); // backend toggle mantığını çalıştırır

      // Güncel beğeni bilgilerini backend'den çek
      const updated = await interactionApi.getCommentsWithLikes(imdbId);
      const commentsData = updated.data || [];
      setComments(commentsData);

      const likesData = {};
      const userLikesData = {};
      commentsData.forEach(comment => {
        likesData[comment.id] = comment.likeCount || 0;
        userLikesData[comment.id] = comment.isLikedByCurrentUser || false;
      });
      setCommentLikes(likesData);
      setUserLikedComments(userLikesData);

    } catch (err) {
      console.error('Like comment error:', err);
      setError('Beğeni işlemi sırasında hata oluştu: ' + (err.response?.data || err.message));
    }
  };

  const startEditingComment = (commentId, currentContent) => {
    setEditingCommentId(commentId);
    setEditingCommentContent(currentContent);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
  };

  const handleUpdateComment = async () => {
    if (!editingCommentContent.trim()) {
      setError('Yorum boş olamaz');
      return;
    }

    try {
      setError(null);
      await interactionApi.updateComment(editingCommentId, editingCommentContent.trim());
      
      // Yorumları beğenilerle birlikte yenile
      const updated = await interactionApi.getCommentsWithLikes(imdbId);
      const commentsData = updated.data || [];
      setComments(commentsData);
      
      // Beğeni bilgilerini güncelle
      const likesData = {};
      const userLikesData = {};
      
      commentsData.forEach(comment => {
        likesData[comment.id] = comment.likeCount || 0;
        userLikesData[comment.id] = comment.isLikedByCurrentUser || false;
      });
      
      setCommentLikes(likesData);
      setUserLikedComments(userLikesData);
      
      setEditingCommentId(null);
      setEditingCommentContent('');
      setSuccessMessage('Yorum başarıyla güncellendi');
    } catch (err) {
      console.error('Update comment error:', err);
      setError('Yorum güncellenirken hata oluştu: ' + (err.response?.data || err.message));
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      setError(null);
      await interactionApi.deleteComment(commentId);
      
      // Yorumları beğenilerle birlikte yenile
      const updated = await interactionApi.getCommentsWithLikes(imdbId);
      const commentsData = updated.data || [];
      setComments(commentsData);
      
      // Beğeni bilgilerini güncelle
      const likesData = {};
      const userLikesData = {};
      
      commentsData.forEach(comment => {
        likesData[comment.id] = comment.likeCount || 0;
        userLikesData[comment.id] = comment.isLikedByCurrentUser || false;
      });
      
      setCommentLikes(likesData);
      setUserLikedComments(userLikesData);
      
      setSuccessMessage('Yorum başarıyla silindi');
    } catch (err) {
      console.error('Delete comment error:', err);
      setError('Yorum silinirken hata oluştu: ' + (err.response?.data || err.message));
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

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      pb: 4,
      position: 'relative',
      color: '#ffffff'
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
  <List sx={{ maxHeight: 600, overflow: 'auto' }}>
    {comments.map((comment, index) => (
      <Box key={comment.id || index}>
        <ListItem 
          alignItems="flex-start"
          sx={{
            borderRadius: 3,
            mb: 2,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'rgba(25, 118, 210, 0.05)',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }
          }}
        >
          <Avatar 
            sx={{ 
              mr: 2, 
              mt: 0.5, 
              bgcolor: 'primary.main',
              width: 45,
              height: 45,
              border: '2px solid rgba(25, 118, 210, 0.3)'
            }}
            src={comment.userImage ? getValidImageUrl(comment.userImage) : undefined}
          >
            {!comment.userImage && <PersonIcon />}
          </Avatar>
          
          {editingCommentId === comment.id ? (
            <Box sx={{ width: '100%' }}>
              <TextField
                fullWidth
                variant="outlined"
                value={editingCommentContent}
                onChange={(e) => setEditingCommentContent(e.target.value)}
                multiline
                rows={3}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <Box display="flex" justifyContent="flex-end" gap={1}>
                <Button 
                  variant="outlined" 
                  onClick={cancelEditing}
                  sx={{ borderRadius: 2 }}
                >
                  İptal
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleUpdateComment}
                  disabled={!editingCommentContent.trim()}
                  sx={{ borderRadius: 2 }}
                >
                  Güncelle
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ width: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 'bold', 
                        color: 'primary.main',
                        fontSize: '1.1rem'
                      }}>
                        {comment.username || 'Anonim Kullanıcı'}
                      </Typography>
                      <Chip 
                        label="Yorum" 
                        size="small" 
                        sx={{ 
                          height: 20, 
                          fontSize: '0.7rem',
                          bgcolor: 'primary.main',
                          color: 'white'
                        }} 
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Paper
                        sx={{
                          p: 2,
                          mt: 1,
                          mb: 2,
                          background: 'rgba(255,255,255,0.03)',
                          borderRadius: 2,
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}
                      >
                        <Typography
                          variant="body1"
                          component="div"
                          sx={{ 
                            color: 'text.primary',
                            lineHeight: 1.6,
                            fontSize: '0.95rem'
                          }}
                        >
                          {comment.content}
                        </Typography>
                      </Paper>
                      
                      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
                        <Typography 
                          variant="caption" 
                          component="div" 
                          color="text.secondary"
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleString('tr-TR') : 'Şimdi'}
                        </Typography>
                        
                        <Box display="flex" alignItems="center" gap={1}>
                          {/* Beğeni butonu ve sayacı */}
                          <Box 
                            display="flex" 
                            alignItems="center"
                            sx={{
                              bgcolor: userLikedComments[comment.id] ? 'rgba(25, 118, 210, 0.1)' : 'rgba(0,0,0,0.05)',
                              borderRadius: 2,
                              px: 1,
                              py: 0.5
                            }}
                          >
                            <IconButton 
                              onClick={() => handleLikeComment(comment.id)} 
                              size="small"
                              color={userLikedComments[comment.id] ? 'primary' : 'default'}
                              sx={{ p: 0.5 }}
                            >
                              {userLikedComments[comment.id] ? (
                                <ThumbUpIcon fontSize="small" />
                              ) : (
                                <ThumbUpOutlinedIcon fontSize="small" />
                              )}
                            </IconButton>
                            <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 'bold' }}>
                              {commentLikes[comment.id] || 0}
                            </Typography>
                          </Box>
                          
                          {/* Yanıt butonu */}
                          <Button 
                            size="small" 
                            startIcon={<CommentIcon fontSize="small" />}
                            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                            sx={{
                              borderRadius: 2,
                              bgcolor: replyingTo === comment.id ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                              '&:hover': {
                                bgcolor: 'rgba(25, 118, 210, 0.15)'
                              }
                            }}
                          >
                            Yanıtla
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  }
                  secondaryTypographyProps={{ component: "div" }}
                />
                
                {/* Yalnızca kendi yorumlarını düzenleyebilir */}
                {user && comment.userId === user.id && (
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton 
                      onClick={() => startEditingComment(comment.id, comment.content)} 
                      size="small" 
                      sx={{ 
                        bgcolor: 'rgba(0,0,0,0.05)',
                        '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.1)' }
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      onClick={() => handleDeleteComment(comment.id)} 
                      size="small"
                      sx={{ 
                        bgcolor: 'rgba(0,0,0,0.05)',
                        '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.1)' }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
              </Box>
              
              {/* Yanıt formu */}
              {/* Yanıt formu */}
{replyingTo === comment.id && (
  <Fade in timeout={300}>
    <Box sx={{ 
      mt: 2,
      ml: 4,
      position: 'relative',
      '&:before': {
        content: '""',
        position: 'absolute',
        left: -24,
        top: 0,
        bottom: 0,
        width: 2,
        backgroundColor: 'rgba(25, 118, 210, 0.2)',
        borderRadius: 2
      }
    }}>
      <Paper
        sx={{ 
          p: 2,
          borderRadius: 2,
          background: 'rgba(25, 118, 210, 0.03)',
          borderLeft: '3px solid',
          borderColor: 'primary.main'
        }}
      >
        <Box display="flex" alignItems="center" gap={1} sx={{ mb: 2 }}>
          <CommentIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
            {comment.username} kullanıcısına yanıt yazıyorsunuz
          </Typography>
        </Box>
        <TextField
          fullWidth
          variant="outlined"
          label="Yanıtınızı yazın..."
          value={replyContent}
          onChange={(e) => setReplyContent(e.target.value)}
          multiline
          rows={2}
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              borderRadius: 1,
              background: 'rgba(255,255,255,0.9)'
            }
          }}
        />
        <Box display="flex" justifyContent="flex-end" gap={1}>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => {
              setReplyingTo(null);
              setReplyContent('');
            }}
            sx={{ borderRadius: 1 }}
          >
            İptal
          </Button>
          <Button 
            variant="contained" 
            size="small"
            onClick={() => handleAddReply(comment.id)}
            disabled={!replyContent.trim()}
            sx={{ borderRadius: 1 }}
          >
            Gönder
          </Button>
        </Box>
      </Paper>
    </Box>
  </Fade>
)}
              
              {/* Yanıtlar */}
{comment.replies && comment.replies.length > 0 && (
  <Box sx={{ 
    mt: 2,
    ml: 4, // Ana yanıt kutusunu biraz içeri kaydır
    position: 'relative',
    '&:before': {
      content: '""',
      position: 'absolute',
      left: -24,
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: 'rgba(25, 118, 210, 0.2)',
      borderRadius: 2
    }
  }}>
    {comment.replies.map((reply, replyIndex) => (
      <Paper
        key={reply.id}
        sx={{
          mb: 2,
          p: 2,
          borderRadius: 2,
          background: 'rgba(25, 118, 210, 0.03)',
          borderLeft: '3px solid',
          borderColor: 'primary.main',
          position: 'relative',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            background: 'rgba(25, 118, 210, 0.05)'
          }
        }}
      >
        {/* Yanıt bağlantı çizgisi için nokta */}
        <Box
          sx={{
            position: 'absolute',
            left: -27,
            top: 20,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'primary.main'
          }}
        />
        
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32,
              bgcolor: 'primary.main',
              color: 'white',
              fontSize: '0.8rem',
              border: '2px solid rgba(25, 118, 210, 0.3)'
            }} 
            src={reply.userImage ? getValidImageUrl(reply.userImage) : undefined}
          >
            {!reply.userImage && reply.username?.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {reply.username}
              </Typography>
              <Chip 
                label="Yanıt" 
                size="small" 
                sx={{ 
                  height: 18, 
                  fontSize: '0.65rem',
                  bgcolor: 'primary.main',
                  color: 'white'
                }} 
              />
              <Typography 
                variant="caption" 
                color="text.secondary" 
                sx={{ ml: 'auto' }}
              >
                {new Date(reply.createdAt).toLocaleString('tr-TR')}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ 
              lineHeight: 1.6,
              color: 'text.primary'
            }}>
              {reply.content}
            </Typography>
            
            {/* Yanıt beğeni butonu */}
            <Box display="flex" justifyContent="flex-end" sx={{ mt: 1 }}>
              <Box 
                display="flex" 
                alignItems="center"
                sx={{
                  bgcolor: userLikedComments[reply.id] ? 'rgba(25, 118, 210, 0.1)' : 'rgba(0,0,0,0.05)',
                  borderRadius: 2,
                  px: 1,
                  py: 0.5
                }}
              >
                <IconButton 
                  onClick={() => handleLikeComment(reply.id)} 
                  size="small"
                  color={userLikedComments[reply.id] ? 'primary' : 'default'}
                  sx={{ p: 0.5 }}
                >
                  {userLikedComments[reply.id] ? (
                    <ThumbUpIcon fontSize="small" />
                  ) : (
                    <ThumbUpOutlinedIcon fontSize="small" />
                  )}
                </IconButton>
                <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 'bold' }}>
                  {commentLikes[reply.id] || 0}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
    ))}
  </Box>
)}
            </Box>
          )}
        </ListItem>
        {index < comments.length - 1 && (
          <Divider 
            sx={{ 
              my: 2, 
              bgcolor: 'rgba(255,255,255,0.1)',
              height: 2,
              borderRadius: 1
            }} 
          />
        )}
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
      borderColor: 'divider',
      borderRadius: 3
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