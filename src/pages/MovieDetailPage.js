// src/components/MovieDetailPage.js
import { useState, useEffect } from 'react';
import { omdbApiId, interactionApi, omdbApi } from '../api';
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
import ReplyIcon from '@mui/icons-material/Reply';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useTheme } from '../context/ThemeContext';

const MovieDetailPage = () => {
  const { imdbId } = useParams();
  const { darkMode } = useTheme();
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
  const [collapsedComments, setCollapsedComments] = useState(new Set());
  const [similarMovies, setSimilarMovies] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const [similarError, setSimilarError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Film detaylarını çek
        const movieRes = await omdbApiId.search(imdbId);
if (movieRes.data) {
  setMovie(movieRes.data);

  // Benzer filmleri çek
  try {
    setLoadingSimilar(true);
    
    // Film başlığını URL encode yap
    const encodedTitle = encodeURIComponent(movieRes.data.Title);
    const similarRes = await omdbApi.getSimilarMovies(encodedTitle);
    
    setSimilarMovies(similarRes.data.Search || []);
  } catch (err) {
    console.warn('Similar movies fetch error:', err);
    
    // Fallback: Gelişmiş benzer film araması dene
    try {
      const advancedSimilarRes = await omdbApi.getAdvancedSimilarMovies(imdbId);
      if (advancedSimilarRes.data && advancedSimilarRes.data.Search) {
        setSimilarMovies(advancedSimilarRes.data.Search);
      } else {
        setSimilarError('Benzer film bulunamadı');
      }
    } catch (fallbackErr) {
      console.warn('Advanced similar movies fetch error:', fallbackErr);
      setSimilarError('Benzer filmler yüklenirken hata oluştu.');
    }
  } finally {
    setLoadingSimilar(false);
  }

} else {
  throw new Error('Film bilgileri alınamadı');
}

        // Yorumları ve beğenileri yanıtlarla birlikte çek - kullanıcı giriş yapmamış olsa bile
        try {
          const commentRes = await interactionApi.getCommentsWithLikes(imdbId);
          console.log('Yorumlar ve beğeniler:', commentRes.data);
          
          const commentsData = commentRes.data || [];
          setComments(commentsData);
          
          // Beğeni bilgilerini state'lere ayarla
          const likesData = {};
          const userLikesData = {};
          
          const processComments = (comments) => {
            comments.forEach(comment => {
              likesData[comment.id] = comment.likeCount || 0;
              userLikesData[comment.id] = comment.isLikedByCurrentUser || false;
              
              // Yanıtları da işle
              if (comment.replies && comment.replies.length > 0) {
                processComments(comment.replies);
              }
            });
          };
          
          processComments(commentsData);
          
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

        // Favori durumunu kontrol et (sadece kullanıcı giriş yaptıysa)
        if (user) {
          try {
            const favRes = await interactionApi.getFavorites();
            setIsFavorite(favRes.data.some(fav => fav.imdbId === imdbId));
          } catch (err) {
          console.warn('Favorites fetch error:', err);
          setIsFavorite(false);
          }
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
  }, [imdbId, user]);

  const getValidImageUrl = (url) => {
  if (!url) return null;
  if (
    url.startsWith('http') ||
    url.startsWith('/') ||
    url.startsWith('data:image')
  ) {
    return url;
  }
  return `${process.env.REACT_APP_API_BASE_URL}${url}`;
  };

  const refreshComments = async () => {
    try {
      // Yorumları beğenilerle birlikte yenile
      const updated = await interactionApi.getCommentsWithLikes(imdbId);
      const commentsData = updated.data || [];
      setComments(commentsData);
      
      // Beğeni bilgilerini güncelle
      const likesData = {};
      const userLikesData = {};
      
      const processComments = (comments) => {
        comments.forEach(comment => {
          likesData[comment.id] = comment.likeCount || 0;
          userLikesData[comment.id] = comment.isLikedByCurrentUser || false;
          
          if (comment.replies && comment.replies.length > 0) {
            processComments(comment.replies);
          }
        });
      };
      
      processComments(commentsData);
      
      setCommentLikes(likesData);
      setUserLikedComments(userLikesData);
    } catch (err) {
      console.error('Refresh comments error:', err);
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!newComment.trim()) {
      setError('Yorum boş olamaz');
      return;
    }

    try {
      setError(null);
      await interactionApi.addComment(imdbId, newComment.trim());
      await refreshComments();
      setNewComment('');
      setSuccessMessage('Yorum başarıyla eklendi');
    } catch (err) {
      console.error('Add comment error:', err);
      setError('Yorum eklenirken hata oluştu: ' + (err.response?.data || err.message));
    }
  };

  const handleAddReply = async (parentCommentId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!replyContent.trim()) {
      setError('Yanıt boş olamaz');
      return;
    }

    try {
      setError(null);
      await interactionApi.addReply(parentCommentId, replyContent.trim());
      await refreshComments();
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
      await interactionApi.likeComment(commentId);
      await refreshComments();
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
      await refreshComments();
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
      await refreshComments();
      setSuccessMessage('Yorum başarıyla silindi');
    } catch (err) {
      console.error('Delete comment error:', err);
      setError('Yorum silinirken hata oluştu: ' + (err.response?.data || err.message));
    }
  };

  const toggleCollapseComment = (commentId) => {
    const newCollapsed = new Set(collapsedComments);
    if (newCollapsed.has(commentId)) {
      newCollapsed.delete(commentId);
    } else {
      newCollapsed.add(commentId);
    }
    setCollapsedComments(newCollapsed);
  };

  // Reddit benzeri yorum render fonksiyonu
  const renderComment = (comment, depth = 0) => {
    const isDeleted = comment.content === '[DELETED]' || !comment.content;
    const isCollapsed = collapsedComments.has(comment.id);
    const maxDepth = 5;
    
    return (
      <Box key={comment.id} sx={{ 
        borderLeft: depth > 0 ? '2px solid rgba(255,255,255,0.1)' : 'none',
        ml: depth * 2,
        pl: depth > 0 ? 2 : 0
      }}>
        {/* Ana yorum satırı */}
        <Box sx={{ 
          py: 1,
          px: 1,
          '&:hover': {
            bgcolor: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
            borderRadius: 1
          },
          transition: 'background-color 0.2s ease'
        }}>
          <Box display="flex" alignItems="flex-start" gap={1}>
            {/* Avatar */}
            <Avatar 
              sx={{ width: 28, height: 28, bgcolor: isDeleted ? 'grey.500' : 'primary.main', fontSize: '0.8rem' }}
              src={!isDeleted && comment.userImage ? getValidImageUrl(comment.userImage) : undefined}
            >
              {!isDeleted && !comment.userImage && comment.username?.charAt(0)?.toUpperCase()}
              {isDeleted && '🗑️'}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Kullanıcı bilgileri ve collapse butonu */}
              <Box display="flex" alignItems="center" gap={1} sx={{ mb: 0.5 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: isDeleted ? 'grey.500' : 'text.primary',
                    fontSize: '0.85rem'
                  }}
                >
                  {isDeleted ? '[deleted]' : (comment.username || 'Anonim')}
                </Typography>
                
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {comment.createdAt ? new Date(comment.createdAt).toLocaleString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit'
                  }) : 'şimdi'}
                </Typography>

                {comment.replies && comment.replies.length > 0 && (
                  <IconButton 
                    size="small"
                    onClick={() => toggleCollapseComment(comment.id)}
                    sx={{ p: 0.5 }}
                  >
                    {isCollapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
                  </IconButton>
                )}
              </Box>

              {/* Yorum içeriği */}
              {!isCollapsed && (
                <>
                  {editingCommentId === comment.id ? (
                    <Box sx={{ mb: 1 }}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        value={editingCommentContent}
                        onChange={(e) => setEditingCommentContent(e.target.value)}
                        multiline
                        rows={2}
                        sx={{ mb: 1 }}
                      />
                      <Box display="flex" gap={1}>
                        <Button size="small" variant="contained" onClick={handleUpdateComment}>
                          Kaydet
                        </Button>
                        <Button size="small" variant="outlined" onClick={cancelEditing}>
                          İptal
                        </Button>
                      </Box>
                    </Box>
                  ) : (
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        mb: 1,
                        color: isDeleted ? 'grey.500' : 'text.primary',
                        fontStyle: isDeleted ? 'italic' : 'normal',
                        lineHeight: 1.4
                      }}
                    >
                      {isDeleted ? 'Bu yorum silinmiştir' : comment.content}
                    </Typography>
                  )}

                  {/* Aksiyon butonları */}
                  {!isDeleted && (
                    <Box display="flex" alignItems="center" gap={1}>
                      {/* Beğeni */}
                      <Box display="flex" alignItems="center">
                        <IconButton 
                          size="small"
                          onClick={() => handleLikeComment(comment.id)}
                          color={userLikedComments[comment.id] ? 'primary' : 'default'}
                          sx={{ p: 0.5 }}
                        >
                          {userLikedComments[comment.id] ? (
                            <ThumbUpIcon sx={{ fontSize: 16 }} />
                          ) : (
                            <ThumbUpOutlinedIcon sx={{ fontSize: 16 }} />
                          )}
                        </IconButton>
                        <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                          {commentLikes[comment.id] || 0}
                        </Typography>
                      </Box>

                      {/* Yanıtla */}
                      {depth < maxDepth && (
                        <Button 
                          size="small" 
                          onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                          sx={{ 
                            minWidth: 'auto',
                            p: 0.5,
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            color: replyingTo === comment.id ? 'primary.main' : 'text.secondary'
                          }}
                        >
                          yanıtla
                        </Button>
                      )}

                      {/* Düzenle/Sil - sadece kendi yorumları için */}
                      {user && comment.userId === user.id && (
                        <>
                          <Button 
                            size="small"
                            onClick={() => startEditingComment(comment.id, comment.content)}
                            sx={{ 
                              minWidth: 'auto',
                              p: 0.5,
                              fontSize: '0.75rem',
                              textTransform: 'none',
                              color: 'text.secondary'
                            }}
                          >
                            düzenle
                          </Button>
                          <Button 
                            size="small"
                            onClick={() => handleDeleteComment(comment.id)}
                            sx={{ 
                              minWidth: 'auto',
                              p: 0.5,
                              fontSize: '0.75rem',
                              textTransform: 'none',
                              color: 'error.main'
                            }}
                          >
                            sil
                          </Button>
                        </>
                      )}
                    </Box>
                  )}

                  {/* Yanıt formu */}
                  {replyingTo === comment.id && depth < maxDepth && (
                    <Box sx={{ mt: 1, mb: 1 }}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        size="small"
                        placeholder="Yanıtınızı yazın..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        multiline
                        rows={2}
                        sx={{ mb: 1 }}
                      />
                      <Box display="flex" gap={1}>
                        <Button 
                          size="small" 
                          variant="contained"
                          onClick={() => handleAddReply(comment.id)}
                          disabled={!replyContent.trim()}
                        >
                          Yanıtla
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyContent('');
                          }}
                        >
                          İptal
                        </Button>
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Box>
        </Box>

        {/* Yanıtlar */}
        {!isCollapsed && comment.replies && comment.replies.length > 0 && (
          <Box sx={{ mt: 0.5 }}>
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </Box>
        )}
      </Box>
    );
  };

  const handleRateMovie = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    
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
    if (!user) {
      navigate('/login');
      return;
    }
    
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
      background: darkMode 
        ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)' 
        : 'linear-gradient(135deg, #f0f0f0 0%, #ffffff 100%)',
      pb: 4,
      position: 'relative',
      color: darkMode ? '#ffffff' : '#000000'
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
          opacity: darkMode ? 0.1 : 0.05,
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
                elevation={darkMode ? 20 : 10}
                sx={{ 
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: darkMode ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.95)',
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
                  background: darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
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
                        background: darkMode 
                          ? 'linear-gradient(45deg, #1976d2, #42a5f5)'
                          : 'linear-gradient(45deg, #1565c0, #42a5f5)',
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
                    onClick={toggleFavorite} 
                    size="large"
                    sx={{
                      background: isFavorite 
                        ? (darkMode ? 'rgba(244, 67, 54, 0.2)' : 'rgba(244, 67, 54, 0.1)') 
                        : (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                      '&:hover': {
                        background: isFavorite 
                          ? (darkMode ? 'rgba(244, 67, 54, 0.3)' : 'rgba(244, 67, 54, 0.2)')
                          : (darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                        transform: 'scale(1.1)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {isFavorite ? (
                      <FavoriteIcon sx={{ color: '#f44336', fontSize: 32 }} />
                    ) : (
                      <FavoriteBorderIcon sx={{ fontSize: 32, color: darkMode ? 'inherit' : 'primary.main' }} />
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
                    <Paper sx={{ p: 2, borderRadius: 2, background: darkMode ? 'rgba(25, 118, 210, 0.05)' : 'rgba(25, 118, 210, 0.08)' }}>
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                        <StarIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                        Ortalama Puan
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Rating
                          value={averageRating}
                          readOnly
                          size="large"
                        />
                        <Typography variant="h6" color="primary">
                          ({averageRating.toFixed(1)})
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, borderRadius: 2, background: darkMode ? 'rgba(76, 175, 80, 0.05)' : 'rgba(76, 175, 80, 0.08)' }}>
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                        {user ? 'Puanınız' : 'Puan vermek için giriş yapın'}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Rating
                          value={userRating}
                          onChange={(e, val) => setUserRating(val || 0)}
                          size="large"
                          disabled={!user}
                        />
                        <Button 
                          onClick={handleRateMovie} 
                          variant="contained"
                          disabled={userRating === 0 || !user}
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
                  background: darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
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
                    { label: 'Senaryo', value: movie.Writer, icon: '✏️' },
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
                          background: index % 2 === 0 
                            ? (darkMode ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.02)') 
                            : 'transparent',
                          transition: 'background 0.2s ease',
                          '&:hover': {
                            background: darkMode ? 'rgba(25, 118, 210, 0.05)' : 'rgba(25, 118, 210, 0.08)'
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

        {/* Önerilen Dizi/Film Bölümü - YORUMLARIN ÜSTÜNDE */}
        {similarMovies.length > 0 && (
          <Fade in timeout={1000}>
            <Paper 
              sx={{ 
                p: 3, 
                mt: 4, 
                borderRadius: 4,
                background: darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}
              elevation={10}
            >
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
                <MovieIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Önerilen Dizi/Film
              </Typography>
              <Grid container spacing={2}>
                {similarMovies.map((similarMovie) => (
                  <Grid item xs={6} sm={4} md={3} lg={2.4} key={similarMovie.imdbID}>
                    <Card 
                      onClick={() => navigate(`/movie/${similarMovie.imdbID}`)}
                      sx={{ 
                        cursor: 'pointer', 
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'scale(1.05)',
                          boxShadow: darkMode ? '0 4px 20px rgba(255,255,255,0.1)' : '0 4px 20px rgba(0,0,0,0.2)'
                        },
                        height: '100%'
                      }}
                    >
                      <CardMedia
                        component="img"
                        image={similarMovie.Poster !== 'N/A' ? similarMovie.Poster : '/placeholder.jpg'}
                        alt={similarMovie.Title}
                        sx={{ 
                          aspectRatio: '2/3', 
                          objectFit: 'cover',
                          height: '200px'
                        }}
                      />
                      <CardContent sx={{ p: 1.5, textAlign: 'center' }}>
                        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                          {similarMovie.Title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({similarMovie.Year})
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Fade>
        )}

        {/* Yorumlar Bölümü - Reddit Tarzı */}
        <Fade in timeout={1200}>
          <Paper 
            sx={{ 
              mt: 4, 
              p: 3, 
              borderRadius: 4,
              background: darkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)'
            }}
            elevation={10}
          >
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
              <CommentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Yorumlar ({comments.length})
            </Typography>

            {/* Yorum Ekleme */}
            <Box sx={{ mb: 3 }}>
              {user ? (
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2,
                  border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  background: darkMode ? 'rgba(25, 118, 210, 0.02)' : 'rgba(25, 118, 210, 0.05)'
                }}>
                  <Box display="flex" gap={2} alignItems="flex-start">
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: 'primary.main'
                      }}
                      src={user.image ? getValidImageUrl(user.image) : undefined}
                    >
                      {!user.image && user.username?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Yorumunuzu yazın..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        multiline
                        rows={3}
                        size="small"
                        sx={{ mb: 1 }}
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
                          size="small"
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          sx={{ borderRadius: 2 }}
                        >
                          Yorum Yap
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ 
                  p: 3, 
                  textAlign: 'center',
                  border: `1px dashed ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                  borderRadius: 2
                }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Yorum yapmak ve beğenmek için giriş yapın
                  </Typography>
                  <Button 
                    variant="outlined" 
                    onClick={() => navigate('/login')}
                    startIcon={<CommentIcon />}
                  >
                    Giriş Yap
                  </Button>
                </Box>
              )}
            </Box>

            {/* Yorumlar Listesi - Reddit Tarzı */}
            {comments.length > 0 ? (
              <Box>
                {comments.map((comment, index) => (
                  <Box key={comment.id || index}>
                    {renderComment(comment)}
                    {index < comments.length - 1 && (
                      <Divider 
                        sx={{ 
                          my: 1, 
                          bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                        }} 
                      />
                    )}
                  </Box>
                ))}
              </Box>
            ) : (
              <Box 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  border: `1px dashed ${darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                  borderRadius: 2
                }}
              >
                <CommentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  Henüz yorum yapılmamış
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  İlk yorumu yapan siz olun!
                </Typography>
              </Box>
            )}

          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default MovieDetailPage;