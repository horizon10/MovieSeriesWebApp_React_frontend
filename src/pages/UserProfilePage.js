import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { interactionApi, omdbApiId } from '../api';
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
  Tooltip
} from '@mui/material';
import { 
  Favorite, 
  Star, 
  Comment, 
  Movie,
  Person,
  CalendarToday,
  Delete
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

const UserProfilePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [comments, setComments] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [movieDetails, setMovieDetails] = useState({});

  // Film detaylarını getir
  const fetchMovieDetails = async (imdbId) => {
    if (movieDetails[imdbId]) return movieDetails[imdbId];
    
    try {
      const response = await omdbApiId.search(imdbId);
      const details = response.data;
      setMovieDetails(prev => ({ ...prev, [imdbId]: details }));
      return details;
    } catch (error) {
      console.error('Error fetching movie details:', error);
      return null;
    }
  };

  // Favori filmleri getir
  const fetchFavorites = async () => {
    try {
      const response = await interactionApi.getFavorites();
      const favoritesData = response.data;
      
      const favoritesWithDetails = await Promise.all(
        favoritesData.map(async (fav) => {
          const movieDetail = await fetchMovieDetails(fav.imdbId);
          return {
            ...fav,
            movieDetail
          };
        })
      );
      
      setFavorites(favoritesWithDetails);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  // Kullanıcı yorumlarını getir (tüm yorumlar)
  const fetchUserComments = async () => {
    try {
      // Bu endpoint'in backend'de implemente edilmesi gerekiyor
      // Örnek: /api/home/comments/user
      const response = await interactionApi.getUserComments();
      const commentsData = response.data;

      const commentsWithDetails = await Promise.all(
        commentsData.map(async (comment) => {
          const movieDetail = await fetchMovieDetails(comment.imdbId);
          return {
            ...comment,
            movieDetail
          };
        })
      );

      setComments(commentsWithDetails);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Kullanıcı puanlarını getir (tüm puanlar)
  const fetchUserRatings = async () => {
    try {
      // Bu endpoint'in backend'de implemente edilmesi gerekiyor
      // Örnek: /api/home/ratings/user
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
    const loadData = async () => {
      setLoading(true);
      try {
        // Tüm verileri paralel olarak yükle
        await Promise.all([
          fetchFavorites(),
          fetchUserComments(),
          fetchUserRatings()
        ]);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      loadData();
    }
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const removeFavorite = async (imdbId) => {
    try {
      await interactionApi.removeFavorite(imdbId);
      setFavorites(favorites.filter(fav => fav.imdbId !== imdbId));
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      // Backend'de comment silme endpointi
      await interactionApi.deleteComment(commentId);
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const deleteRating = async (ratingId) => {
    try {
      // Backend'de rating silme endpointi
      await interactionApi.deleteRating(ratingId);
      setRatings(ratings.filter(rating => rating.id !== ratingId));
    } catch (error) {
      console.error('Error deleting rating:', error);
    }
  };

  const MovieCard = ({ item, type, onRemove }) => {
    const movie = item.movieDetail;
    if (!movie) return null;

    return (
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardMedia
          component="img"
          height="200"
          image={movie.Poster !== 'N/A' ? movie.Poster : '/placeholder.jpg'}
          alt={movie.Title}
          sx={{ objectFit: 'cover' }}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography gutterBottom variant="h6" component="div" noWrap>
            {movie.Title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {movie.Year} • {movie.Genre}
          </Typography>
          
          {type === 'favorite' && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Added: {new Date(item.createdAt).toLocaleDateString()}
              </Typography>
              <Tooltip title="Remove from favorites">
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => onRemove(item.imdbId)}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            </Box>
          )}
          
          {type === 'rating' && (
            <Box sx={{ mt: 2 }}>
              <Rating value={item.score} readOnly size="small" />
              <Typography variant="caption" display="block" color="text.secondary">
                Rated: {new Date(item.createdAt).toLocaleDateString()}
              </Typography>
              <Box sx={{ mt: 1, textAlign: 'right' }}>
                <Tooltip title="Delete rating">
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => deleteRating(item.id)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}
          
          {type === 'comment' && (
            <Box sx={{ mt: 2 }}>
              <Paper sx={{ p: 1, bgcolor: 'grey.50' }}>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  "{item.content}"
                </Typography>
              </Paper>
              <Typography variant="caption" color="text.secondary">
                Commented: {new Date(item.createdAt).toLocaleDateString()}
              </Typography>
              <Box sx={{ mt: 1, textAlign: 'right' }}>
                <Tooltip title="Delete comment">
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => deleteComment(item.id)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Link to={`/movie/${movie.imdbID}`} style={{ textDecoration: 'none' }}>
              <Chip 
                label="View Details" 
                size="small" 
                clickable
                color="primary"
                variant="outlined"
              />
            </Link>
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
      {/* Profil Başlığı */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent sx={{ color: 'white', py: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                mr: 3,
                bgcolor: 'rgba(255,255,255,0.2)',
                fontSize: '2rem'
              }}
            >
              {user?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
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
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* İstatistikler */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard 
            icon={<Favorite sx={{ fontSize: 40 }} />}
            title="Favorites"
            count={favorites.length}
            color="#e91e63"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard 
            icon={<Star sx={{ fontSize: 40 }} />}
            title="Ratings"
            count={ratings.length}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard 
            icon={<Comment sx={{ fontSize: 40 }} />}
            title="Comments"
            count={comments.length}
            color="#2196f3"
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
            label={`Favorites (${favorites.length})`}
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
        </Tabs>
      </Paper>

      {/* Tab İçerikleri */}
      {activeTab === 0 && (
        <Box>
          {favorites.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Movie sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No favorites yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Start adding movies to your favorites to see them here!
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {favorites.map((favorite) => (
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

      {activeTab === 1 && (
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

      {activeTab === 2 && (
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
                  <MovieCard item={comment} type="comment" />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
    </Container>
  );
};

export default UserProfilePage;