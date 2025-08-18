import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LiveTv } from '@mui/icons-material';
import { interactionApi, omdbApiId, userApi } from '../api';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import {
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Tabs,
  Tab,
  Grid,
  CardMedia,
  Chip,
  Rating,
  CircularProgress,
  Container,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  InputAdornment,
  Alert,
  Collapse,
  Switch,
  FormControlLabel,
  CardActionArea,
} from '@mui/material';
import {
  Favorite,
  Star,
  Comment,
  Movie,
  Person,
  CalendarToday,
  Delete,
  Edit,
  CameraAlt,
  Visibility,
  VisibilityOff,
  Save,
  Cancel,
  Lock,
  Email,
  AccountCircle,
  Security
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import imageCompression from 'browser-image-compression';

const UserProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [favorites, setFavorites] = useState({
    all: [],
    movies: [],
    series: []
  });
  const [comments, setComments] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [movieDetails, setMovieDetails] = useState({});
  const [likedComments, setLikedComments] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    username: '',
    email: '',
    image: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [imagePreview, setImagePreview] = useState('');
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [changePassword, setChangePassword] = useState(false);
  const [alerts, setAlerts] = useState({
    show: false,
    type: 'info',
    message: ''
  });
  const [passwordStrength, setPasswordStrength] = useState(0);

  // Password strength calculator
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 25;
    if (password.match(/\d/)) strength += 25;
    if (password.match(/[^a-zA-Z\d]/)) strength += 25;
    return strength;
  };

  const loadData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      await Promise.all([
        fetchFavorites(),
        fetchUserComments(),
        fetchUserRatings(),
        fetchUserLikedComments()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLikedComments = async () => {
    try {
      const response = await interactionApi.getUserLikes();
      const likedCommentsData = response.data;

      const likedCommentsWithDetails = await Promise.all(
        likedCommentsData.map(async (like) => {
          try {
            // Yorum detaylarını al (endpoint düzeltildi)
            const commentRes = await interactionApi.getCommentLikes(like.commentId);
            const commentLikes = commentRes.data;

            // Yorumun kendisini bulmak için yorumları çek
            // Bu kısımda comment'in kendisini almak için farklı bir endpoint kullanmamız gerekebilir
            // Şimdilik comment bilgilerini like'dan alacağız

            // Film detaylarını al
            let movieDetail = null;
            if (like.imdbId) {
              movieDetail = await fetchMovieDetails(like.imdbId);
            }

            return {
              id: like.commentId,
              content: like.content || 'Yorum içeriği yüklenemedi', // Backend'den gelecek
              createdAt: like.createdAt || like.likedAt,
              imdbId: like.imdbId,
              username: like.username,
              userId: like.userId,
              movieDetail,
              likedAt: like.likedAt,
              likeCount: commentLikes.length
            };
          } catch (error) {
            console.error('Error fetching comment details:', error);
            return null;
          }
        })
      );

      // Hatalı isteklerden gelen null değerleri filtrele
      setLikedComments(likedCommentsWithDetails.filter(comment => comment !== null));
    } catch (error) {
      console.error('Error fetching liked comments:', error);
      setLikedComments([]);
    }
  };

  // Base64 conversion function
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Handle image upload
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert('error', 'Please select an image smaller than 5MB');
      return;
    }

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      onProgress: (progress) => {
        setUploadProgress(progress);
      }
    };

    try {
      const compressedFile = await imageCompression(file, options);
      setUploadProgress(30);
      const base64Image = await convertToBase64(compressedFile);
      setUploadProgress(80);

      setImagePreview(base64Image);
      setEditData(prev => ({
        ...prev,
        image: base64Image
      }));
      setUploadProgress(100);

      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      console.error("Image compression error:", error);
      showAlert('error', 'Error occurred while uploading image');
      setUploadProgress(0);
    }
  };

  // Fetch movie details
  const fetchMovieDetails = async (imdbId) => {
    if (movieDetails[imdbId]) return movieDetails[imdbId];

    try {
      const response = await omdbApiId.search(imdbId);
      const details = response.data;

      // Daha kesin tür kontrolü yapıyoruz
      let standardizedType = 'movie'; // Varsayılan olarak film
      if (details.Type) {
        const lowerType = details.Type.toLowerCase();
        if (lowerType.includes('series') || lowerType.includes('tv')) {
          standardizedType = 'series';
        }
      }

      const detailsWithStandardType = {
        ...details,
        Type: standardizedType
      };

      setMovieDetails(prev => ({ ...prev, [imdbId]: detailsWithStandardType }));
      return detailsWithStandardType;
    } catch (error) {
      console.error('Error fetching movie details:', error);
      return null;
    }
  };

  // Fetch favorites
  const fetchFavorites = async () => {
    try {
      const response = await interactionApi.getFavorites();
      const favoritesData = response.data;

      const favoritesWithDetails = await Promise.all(
        favoritesData.map(async (fav) => {
          const movieDetail = await fetchMovieDetails(fav.imdbId);
          // Tür bilgisini standartlaştırılmış şekilde alıyoruz
          const type = movieDetail?.Type || 'movie';
          return {
            ...fav,
            movieDetail,
            type
          };
        })
      );

      // Favorileri türlerine göre kesin olarak ayırıyoruz
      const movies = favoritesWithDetails.filter(item => item.type === 'movie');
      const series = favoritesWithDetails.filter(item => item.type === 'series');

      setFavorites({
        all: favoritesWithDetails,
        movies,
        series
      });
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };


  // Fetch comments
  const fetchUserComments = async () => {
    try {
      const response = await interactionApi.getUserComments();
      const commentsData = response.data;

      const commentsWithDetails = await Promise.all(
        commentsData.map(async (comment) => {
          const movieDetail = await fetchMovieDetails(comment.imdbId);

          // Yorumun beğenilip beğenilmediğini kontrol et
          try {
            const likeRes = await interactionApi.getCommentLikes(comment.id);
            const isLiked = likeRes.data.some(like => like.userId === user.id);
            return {
              ...comment,
              movieDetail,
              isLiked // Beğeni durumunu ekle
            };
          } catch (error) {
            console.error('Error checking like status:', error);
            return {
              ...comment,
              movieDetail,
              isLiked: false
            };
          }
        })
      );

      setComments(commentsWithDetails);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    }
  };

  // Fetch ratings
  const fetchUserRatings = async () => {
    try {
      const response = await interactionApi.getUserRatings();
      const ratingsData = response.data;

      const ratingsWithDetails = await Promise.all(
        ratingsData.map(async (rating) => {
          const movieDetail = await fetchMovieDetails(rating.imdbId);
          return {
            ...rating,
            movieDetail
          };
        })
      );

      setRatings(ratingsWithDetails);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
      setEditData({
        username: user.username,
        email: user.email,
        image: user.image,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setImagePreview(user.image || '');
    }
  }, [user]);

  useEffect(() => {
    if (editData.newPassword) {
      setPasswordStrength(calculatePasswordStrength(editData.newPassword));
    } else {
      setPasswordStrength(0);
    }
  }, [editData.newPassword]);

  const showAlert = (type, message) => {
    setAlerts({ show: true, type, message });
    setTimeout(() => setAlerts({ show: false, type: 'info', message: '' }), 5000);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const removeFavorite = async (imdbId) => {
    try {
      await interactionApi.removeFavorite(imdbId);
      setFavorites(prev => ({
        all: prev.all.filter(fav => fav.imdbId !== imdbId),
        movies: prev.movies.filter(fav => fav.imdbId !== imdbId),
        series: prev.series.filter(fav => fav.imdbId !== imdbId)
      }));

      showAlert('success', 'Removed from favorites successfully');
    } catch (error) {
      console.error('Error removing favorite:', error);
      showAlert('error', 'Failed to remove favorite');
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await interactionApi.deleteComment(commentId);
      setComments(comments.filter(comment => comment.id !== commentId));
      showAlert('success', 'Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      showAlert('error', 'Failed to delete comment');
    }
  };

  const deleteRating = async (ratingId) => {
    try {
      await interactionApi.deleteRating(ratingId);
      setRatings(ratings.filter(rating => rating.id !== ratingId));
      showAlert('success', 'Rating deleted successfully');
    } catch (error) {
      console.error('Error deleting rating:', error);
      showAlert('error', 'Failed to delete rating');
    }
  };

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setChangePassword(false);
    setEditData({
      username: user.username,
      email: user.email,
      image: user.image,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setImagePreview(user.image);
    setAlerts({ show: false, type: 'info', message: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    // Clear any previous alerts
    setAlerts({ show: false, type: 'info', message: '' });

    // Basic field validation
    if (!editData.username.trim()) {
      showAlert('error', 'Username is required');
      return false;
    }

    if (!editData.email.trim()) {
      showAlert('error', 'Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editData.email)) {
      showAlert('error', 'Please enter a valid email address');
      return false;
    }

    // Only validate password fields if changePassword is true
    if (changePassword) {
      if (!editData.currentPassword) {
        showAlert('error', 'Current password is required');
        return false;
      }

      if (!editData.newPassword) {
        showAlert('error', 'New password is required');
        return false;
      }

      if (editData.newPassword.length < 8) {
        showAlert('error', 'New password must be at least 8 characters long');
        return false;
      }

      if (editData.newPassword !== editData.confirmPassword) {
        showAlert('error', 'New passwords do not match');
        return false;
      }
    }

    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    try {
      // Kullanıcı adı değiştiyse kontrol et
      if (editData.username !== user.username) {
        const response = await userApi.checkUsername(editData.username, user.id);

        if (!response.data.available) {
          showAlert('error', 'Bu kullanıcı adı zaten alınmış');
          return;
        }
      }

      // Create payload with basic info
      const payload = {
        username: editData.username.trim(),
        email: editData.email.trim()
      };

      if (editData.image) {
        payload.image = editData.image;
      }
      // Only include password fields if changePassword is true
      if (changePassword && editData.newPassword) {
        payload.currentPassword = editData.currentPassword;
        payload.password = editData.newPassword.trim();
      }

      // Debugging: log the payload before sending
      console.log('Sending payload:', payload);

      const response = await userApi.updateUser(user.id, payload);
      updateUser(response.data);

      setEditMode(false);
      setChangePassword(false);
      showAlert('success', 'Profile updated successfully!');

      // Reset password fields after successful update
      setEditData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      console.error('Error updating profile:', error);

      if (error.response?.data?.error) {
        showAlert('error', error.response.data.error);
      } else if (error.response?.status === 400) {
        showAlert('error', 'Error updating profile. Please check your information.');
      } else {
        showAlert('error', 'An error occurred while updating profile. Please try again.');
      }
    }
  };


  const handleOpenImageDialog = () => {
    setOpenImageDialog(true);
  };

  const handleCloseImageDialog = () => {
    setOpenImageDialog(false);
  };

  const getPasswordStrengthColor = (strength) => {
    if (strength < 25) return '#f44336';
    if (strength < 50) return '#ff9800';
    if (strength < 75) return '#ffeb3b';
    return '#4caf50';
  };

  const getPasswordStrengthText = (strength) => {
    if (strength < 25) return 'Weak';
    if (strength < 50) return 'Fair';
    if (strength < 75) return 'Good';
    return 'Strong';
  };

  const MovieCard = ({ item, type, onRemove, additionalInfo }) => {
    const movie = item.movieDetail;
    if (!movie) return null;
return (
      <Card 
        sx={{ 
          height: 300,
          position: 'relative',
          borderRadius: 3,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          },
          '&:hover .overlay': {
            opacity: 1,
          },
          '&:hover .poster': {
            transform: 'scale(1.05)',
          }
        }}
      >
        {/* Poster Image */}
        <CardMedia
          component="img"
          height="100%"
          image={movie.Poster !== 'N/A' ? movie.Poster : '/placeholder.jpg'}
          alt={movie.Title}
          className="poster"
          sx={{ 
            objectFit: 'cover',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        
        {/* Overlay Content */}
        <Box
          className="overlay"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.3) 100%)',
            opacity: 0,
            transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: 2,
            color: 'white'
          }}
        >
          {/* Top Actions */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            {type === 'favorite' && (
              <Tooltip title="Remove from favorites">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.imdbId);
                  }}
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(244, 67, 54, 0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 1)',
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {type === 'rating' && (
              <Tooltip title="Delete rating">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteRating(item.id);
                  }}
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(244, 67, 54, 0.8)',
                    '&:hover': {
                      backgroundColor: 'rgba(244, 67, 54, 1)',
                      transform: 'scale(1.1)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          {/* Bottom Content */}
          <Box>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold', 
                mb: 1,
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                lineHeight: 1.2
              }}
            >
              {movie.Title}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Chip
                label={movie.Year}
                size="small"
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              />
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {movie.Genre?.split(',')[0]}
              </Typography>
            </Box>

            {/* Type-specific content */}
            {type === 'rating' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Rating 
                  value={item.score} 
                  readOnly 
                  size="small"
                  sx={{ 
                    '& .MuiRating-iconFilled': {
                      color: '#ffd700',
                      filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.8))'
                    }
                  }}
                />
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {item.score}/5
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {type === 'favorite' && `Added: ${new Date(item.createdAt).toLocaleDateString()}`}
                {type === 'rating' && `Rated: ${new Date(item.createdAt).toLocaleDateString()}`}
              </Typography>
              
              <Link to={`/movie/${movie.imdbID}`} style={{ textDecoration: 'none' }}>
                <Button
                  size="small"
                  variant="contained"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)',
                      transform: 'scale(1.05)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  View Details
                </Button>
              </Link>
            </Box>
          </Box>
        </Box>
      </Card>
    );
  };
  
  // Yorum kartı için yeni bileşen
  const CommentCard = ({ item, onRemove, likedComment = false }) => {
    const movie = item.movieDetail;
    if (!movie) return null;

    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2, boxShadow: 3 }}>
        <CardActionArea component={Link} to={`/movie/${movie.imdbID}`}>
          <CardMedia
            component="img"
            height="180"
            image={movie.Poster !== 'N/A' ? movie.Poster : '/placeholder.jpg'}
            alt={movie.Title}
            sx={{ objectFit: 'cover' }}
          />
          <CardContent>
            <Typography gutterBottom variant="h6" component="div" noWrap>
              {movie.Title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {movie.Year} • {movie.Genre}
            </Typography>
          </CardContent>
        </CardActionArea>
        <Divider />
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flexGrow: 1 }}>
            {likedComment ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                  Liked comment:
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    mt: 1,
                    bgcolor: 'primary.light',
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                    borderRadius: '4px'
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontStyle: 'italic',
                      color: 'primary.contrastText'
                    }}
                  >
                    "{item.content}"
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    - {item.username}
                  </Typography>
                </Paper>
              </Box>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                  Your comment:
                </Typography>
                <Paper
                  sx={{
                    p: 2,
                    mt: 1,
                    bgcolor: 'grey.800',
                    borderLeft: '4px solid',
                    borderColor: 'primary.main',
                    borderRadius: '4px'
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: 'white'
                    }}
                  >
                    {item.content}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Box>
          <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              {likedComment ? `Liked on: ${new Date(item.likedAt).toLocaleDateString()}` : `Commented on: ${new Date(item.createdAt).toLocaleDateString()}`}
            </Typography>
            <Tooltip title={likedComment ? "Beğeniyi geri al" : "Yorumu sil"}>
              <IconButton
                size="small"
                color="error"
                onClick={() => onRemove(item.id)}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>
    );
  };
  
  const StatCard = ({ icon, title, count, color }) => (
    <Card sx={{ textAlign: 'center' }}>
      <CardContent>
        <Box sx={{ color: color, mb: 1 }}>
          {icon}
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
          {count}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Alert Messages */}
      <Collapse in={alerts.show}>
        <Alert
          severity={alerts.type}
          sx={{ mb: 2 }}
          onClose={() => setAlerts({ show: false, type: 'info', message: '' })}
        >
          {alerts.message}
        </Alert>
      </Collapse>

      {/* Profile Header */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent sx={{ color: 'white', py: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    fontSize: '2.5rem',
                    cursor: editMode ? 'pointer' : 'default'
                  }}
                  src={editMode ? imagePreview : user?.image}
                  onClick={editMode ? handleOpenImageDialog : undefined}
                >
                  {!user?.image && user?.username?.charAt(0).toUpperCase()}
                </Avatar>
                {editMode && (
                  <>
                    <IconButton
                      component="label"
                      sx={{
                        position: 'absolute',
                        bottom: -5,
                        right: -5,
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        width: 35,
                        height: 35,
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.9)'
                        }
                      }}
                    >
                      <CameraAlt fontSize="small" />
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </IconButton>
                    {uploadProgress > 0 && uploadProgress < 100 && (
                      <CircularProgress
                        variant="determinate"
                        value={uploadProgress}
                        size={80}
                        sx={{
                          position: 'absolute',
                          top: 10,
                          left: 10,
                          color: 'white'
                        }}
                      />
                    )}
                  </>
                )}
              </Box>

              <Box sx={{ flex: 1, minWidth: 250 }}>
                {editMode ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      name="username"
                      value={editData.username}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                      placeholder="Username"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccountCircle sx={{ color: 'rgba(255,255,255,0.7)' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: 1,
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255,255,255,0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'rgba(255,255,255,0.8)',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: 'white',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: 'rgba(255,255,255,0.7)',
                          opacity: 1,
                        },
                      }}
                    />
                    <TextField
                      name="email"
                      value={editData.email}
                      onChange={handleInputChange}
                      variant="outlined"
                      size="small"
                      placeholder="Email"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ color: 'rgba(255,255,255,0.7)' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: 1,
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(255,255,255,0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(255,255,255,0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'rgba(255,255,255,0.8)',
                          },
                        },
                        '& .MuiInputBase-input': {
                          color: 'white',
                        },
                        '& .MuiInputBase-input::placeholder': {
                          color: 'rgba(255,255,255,0.7)',
                          opacity: 1,
                        },
                      }}
                    />

                    <FormControlLabel
                      control={
                        <Switch
                          checked={changePassword}
                          onChange={(e) => setChangePassword(e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: 'white',
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: 'rgba(255,255,255,0.5)',
                            },
                          }}
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Security fontSize="small" />
                          <Typography variant="body2">Change Password</Typography>
                        </Box>
                      }
                      sx={{ color: 'white' }}
                    />

                    <Collapse in={changePassword}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                        <TextField
                          name="currentPassword"
                          type={showPasswords.current ? 'text' : 'password'}
                          value={editData.currentPassword}
                          onChange={handleInputChange}
                          variant="outlined"
                          size="small"
                          placeholder="Current Password"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Lock sx={{ color: 'rgba(255,255,255,0.7)' }} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => togglePasswordVisibility('current')}
                                  sx={{ color: 'rgba(255,255,255,0.7)' }}
                                >
                                  {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: 1,
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: 'rgba(255,255,255,0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255,255,255,0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: 'rgba(255,255,255,0.8)',
                              },
                            },
                            '& .MuiInputBase-input': {
                              color: 'white',
                            },
                            '& .MuiInputBase-input::placeholder': {
                              color: 'rgba(255,255,255,0.7)',
                              opacity: 1,
                            },
                          }}
                        />

                        <TextField
                          name="newPassword"
                          type={showPasswords.new ? 'text' : 'password'}
                          value={editData.newPassword}
                          onChange={handleInputChange}
                          variant="outlined"
                          size="small"
                          placeholder="New Password"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Lock sx={{ color: 'rgba(255,255,255,0.7)' }} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => togglePasswordVisibility('new')}
                                  sx={{ color: 'rgba(255,255,255,0.7)' }}
                                >
                                  {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: 1,
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: 'rgba(255,255,255,0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255,255,255,0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: 'rgba(255,255,255,0.8)',
                              },
                            },
                            '& .MuiInputBase-input': {
                              color: 'white',
                            },
                            '& .MuiInputBase-input::placeholder': {
                              color: 'rgba(255,255,255,0.7)',
                              opacity: 1,
                            },
                          }}
                        />

                        {editData.newPassword && (
                          <Box sx={{ mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                                Password Strength:
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: getPasswordStrengthColor(passwordStrength),
                                  fontWeight: 'bold'
                                }}
                              >
                                {getPasswordStrengthText(passwordStrength)}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                width: '100%',
                                height: 4,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                borderRadius: 2
                              }}
                            >
                              <Box
                                sx={{
                                  width: `${passwordStrength}%`,
                                  height: '100%',
                                  backgroundColor: getPasswordStrengthColor(passwordStrength),
                                  borderRadius: 2,
                                  transition: 'width 0.3s ease, background-color 0.3s ease'
                                }}
                              />
                            </Box>
                          </Box>
                        )}

                        <TextField
                          name="confirmPassword"
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={editData.confirmPassword}
                          onChange={handleInputChange}
                          variant="outlined"
                          size="small"
                          placeholder="Confirm New Password"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <Lock sx={{ color: 'rgba(255,255,255,0.7)' }} />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => togglePasswordVisibility('confirm')}
                                  sx={{ color: 'rgba(255,255,255,0.7)' }}
                                >
                                  {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                          sx={{
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            borderRadius: 1,
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': {
                                borderColor: 'rgba(255,255,255,0.3)',
                              },
                              '&:hover fieldset': {
                                borderColor: 'rgba(255,255,255,0.5)',
                              },
                              '&.Mui-focused fieldset': {
                                borderColor: 'rgba(255,255,255,0.8)',
                              },
                            },
                            '& .MuiInputBase-input': {
                              color: 'white',
                            },
                            '& .MuiInputBase-input::placeholder': {
                              color: 'rgba(255,255,255,0.7)',
                              opacity: 1,
                            },
                          }}
                        />
                      </Box>
                    </Collapse>
                  </Box>
                ) : (
                  <>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {user?.username}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Person fontSize="small" />
                        <Typography variant="body1">Movie Enthusiast</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday fontSize="small" />
                        <Typography variant="body1">
                          Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </Box>
            {!editMode ? (
              <Tooltip title="Edit Profile">
                <IconButton
                  onClick={handleEditClick}
                  sx={{
                    color: 'white',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.3)'
                    }
                  }}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveProfile}
                  disabled={uploadProgress > 0 && uploadProgress < 100}
                >
                  {uploadProgress > 0 && uploadProgress < 100 ? 'Uploading...' : 'Save'}
                </Button>
                <Button
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'white' }}
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={3}>
          <StatCard
            icon={<Favorite sx={{ fontSize: 40 }} />}
            title="Favorites"
            count={favorites.all.length}
            color="#e91e63"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <StatCard
            icon={<Star sx={{ fontSize: 40 }} />}
            title="Ratings"
            count={ratings.length}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <StatCard
            icon={<Comment sx={{ fontSize: 40 }} />}
            title="Comments"
            count={comments.length}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <StatCard
            icon={<ThumbUpIcon sx={{ fontSize: 40 }} />}
            title="Likes"
            count={likedComments.length}
            color="#4caf50"
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<Favorite />}
            label={`All (${favorites.all.length})`}
            iconPosition="start"
          />
          <Tab
            icon={<Movie />}
            label={`Movies (${favorites.movies.length})`}
            iconPosition="start"
          />
          <Tab
            icon={<LiveTv />}
            label={`Series (${favorites.series.length})`}
            iconPosition="start"
          />
          <Tab
            icon={<Star />}
            label={`Ratings (${ratings.length})`}
            iconPosition="start"
          />
          <Tab
            icon={<Comment />}
            label={`Comments (${comments.length})`}
            iconPosition="start"
          />
          <Tab
            icon={<ThumbUpIcon />}
            label={`Liked (${likedComments.length})`}
            iconPosition="start"
          />
        </Tabs>
      </Paper>
      {activeTab === 0 && (
        <Box>
          {/* Tab Contents */}
          {favorites.all.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Favorite sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No favorites yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start adding movies and series to your favorites to see them here!
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {favorites.all.map((favorite) => (
                <Grid item xs={12} sm={6} md={4} key={favorite.imdbId}>
                  <MovieCard
                    item={favorite}
                    type="favorite"
                    onRemove={removeFavorite}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Movies Tab */}
      {activeTab === 1 && (
        <Box>
          {favorites.movies.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Movie sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No movie favorites yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start adding movies to your favorites to see them here!
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {favorites.movies.map((favorite) => (
                <Grid item xs={12} sm={6} md={4} key={favorite.imdbId}>
                  <MovieCard
                    item={favorite}
                    type="favorite"
                    onRemove={removeFavorite}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
      {/* Series Tab */}
      {activeTab === 2 && (
        <Box>
          {favorites.series.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <LiveTv sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No series favorites yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start adding series to your favorites to see them here!
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {favorites.series.map((favorite) => (
                <Grid item xs={12} sm={6} md={4} key={favorite.imdbId}>
                  <MovieCard
                    item={favorite}
                    type="favorite"
                    onRemove={removeFavorite}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
      {/* Ratings Tab */}
      {activeTab === 3 && (
        <Box>
          {ratings.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Star sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No ratings yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rate some movies to see your ratings here!
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {ratings.map((rating) => (
                <Grid item xs={12} sm={6} md={4} key={`${rating.imdbId}-${rating.id}`}>
                  <MovieCard item={rating} type="rating" />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
      {/* Comments Tab */}
      {activeTab === 4 && (
        <Box>
          {comments.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Comment sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No comments yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Leave some comments on movies to see them here!
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {comments.map((comment) => (
                <Grid item xs={12} sm={6} md={4} key={`${comment.imdbId}-${comment.id}`}>
                  <CommentCard item={comment} onRemove={deleteComment} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Liked Comments Tab */}
      {activeTab === 5 && (
        <Box>
          {likedComments.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <ThumbUpIcon sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No liked comments yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Like some comments to see them here!
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {likedComments.map((comment) => (
                <Grid item xs={12} sm={6} md={4} key={`${comment.imdbId}-${comment.id}`}>
                  <CommentCard item={comment} onRemove={deleteComment} likedComment />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Image Preview Dialog */}
      <Dialog open={openImageDialog} onClose={handleCloseImageDialog}>
        <DialogTitle>Profile Picture</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Avatar
              src={imagePreview || user?.image}
              sx={{ width: 200, height: 200 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseImageDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserProfilePage;