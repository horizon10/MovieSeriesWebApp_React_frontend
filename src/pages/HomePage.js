import { useState, useEffect } from 'react';
import { interactionApi, omdbApi } from '../api';
import { 
  TextField, 
  Button, 
  Grid, 
  Card, 
  CardContent, 
  CardMedia, 
  Typography,
  Box,
  CircularProgress,
  Chip,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Container,
  Paper,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
  Fade,
  Backdrop
} from '@mui/material';
import { Link } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import MovieIcon from '@mui/icons-material/Movie';
import TvIcon from '@mui/icons-material/Tv';
import TheatersIcon from '@mui/icons-material/Theaters';
import ExploreIcon from '@mui/icons-material/Explore';
import FavoriteIcon from '@mui/icons-material/Favorite';

const HomePage = () => {
   const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isDark = theme.palette.mode === 'dark';

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularSeries, setPopularSeries] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);
  const [horrorMovies, setHorrorMovies] = useState([]);
  const [comedyMovies, setComedyMovies] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterGenre, setFilterGenre] = useState('all');
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [mostFavorited, setMostFavorited] = useState([]);
  const [loadingMostFavorited, setLoadingMostFavorited] = useState(false);

  const popularMovieKeywords = [
    'Avengers', 'Spider-Man', 'Batman', 'Superman', 'Star Wars', 
    'Harry_Potter', 'Lord_of_the_Rings', 'Fast_Furious', 'Mission_Impossible', 'Terminator'
  ];
  
  const popularSeriesKeywords = [
    'Breaking_Bad', 'Game_of_Thrones', 'Friends', 'The_Office', 'Stranger_Things',
    'The_Crown', 'Narcos', 'House_of_Cards', 'Sherlock', 'Lost'
  ];
  const actionKeywords = [
    'John_Wick', 'Die_Hard', 'Mad_Max', 'Rambo', 'Rocky', 
    'Gladiator', 'Matrix', 'Taken', 'Bourne', 'Top_Gun'
  ];
  const horrorKeywords = [
    'Halloween', 'Friday_the_13th', 'Nightmare', 'Scream', 'It',
    'Conjuring', 'Insidious', 'Paranormal_Activity', 'Saw', 'Exorcist'
  ];
  const comedyKeywords = [
    'Hangover', 'Anchorman', 'Dumb_and_Dumber', 'Ghostbusters', 'Superbad',
    'Step_Brothers', 'Tropic_Thunder', 'Zoolander', 'Wedding_Crashers', 'Meet_the_Parents'
  ];

  const fetchMostFavorited = async () => {
    setLoadingMostFavorited(true);
    try {
      const response = await interactionApi.getMostFavorited();
      if (response.data) {
        const moviePromises = response.data.map(async (imdbId) => {
          try {
            const movieResponse = await omdbApi.searchById(imdbId);
            return movieResponse.data;
          } catch (error) {
            console.error(`Error fetching movie ${imdbId}:`, error);
            return null;
          }
        });
        const movies = await Promise.all(moviePromises);
        setMostFavorited(movies.filter(movie => movie !== null));
      }
    } catch (error) {
      console.error('Error fetching most favorited:', error);
    } finally {
      setLoadingMostFavorited(false);
    }
  };

  const fetchCategoryMovies = async (keywords, setterFunction) => {
    try {
      const promises = keywords.slice(0, 5).map(async (keyword) => {
        try {
          const response = await omdbApi.search(keyword);
          if (response.data?.Search) {
            return response.data.Search.slice(0, 2);
          }
          return [];
        } catch (error) {
          console.error(`Error fetching ${keyword}:`, error);
          return [];
        }
      });
      const results = await Promise.all(promises);
      const allMovies = results.flat();
      const uniqueMovies = allMovies.filter((movie, index, self) => 
        index === self.findIndex(m => m.imdbID === movie.imdbID)
      );
      setterFunction(uniqueMovies.slice(0, 8));
    } catch (error) {
      console.error('Error fetching category movies:', error);
    }
  };

  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      await Promise.all([
        fetchCategoryMovies(popularMovieKeywords, setPopularMovies),
        fetchCategoryMovies(popularSeriesKeywords, setPopularSeries),
        fetchCategoryMovies(actionKeywords, setActionMovies),
        fetchCategoryMovies(horrorKeywords, setHorrorMovies),
        fetchCategoryMovies(comedyKeywords, setComedyMovies),
        fetchMostFavorited()
      ]);
      setLoadingCategories(false);
    };
    loadCategories();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults(null);
      return;
    }

    setLoadingSearch(true);
    try {
      const response = await omdbApi.search(searchTerm);
      if (response.data?.Search) {
        setSearchResults(response.data.Search);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  const filterMovies = (movieList) => {
    return movieList.filter(movie => {
      const typeMatch = filterType === 'all' || 
        (filterType === 'movie' && movie.Type === 'movie') ||
        (filterType === 'series' && movie.Type === 'series');
      
      const genreMatch = filterGenre === 'all' || 
        (filterGenre === 'action' && actionKeywords.some(keyword => movie.Title.includes(keyword.replace(/_/g, ' ')))) ||
        (filterGenre === 'horror' && horrorKeywords.some(keyword => movie.Title.includes(keyword.replace(/_/g, ' ')))) ||
        (filterGenre === 'comedy' && comedyKeywords.some(keyword => movie.Title.includes(keyword.replace(/_/g, ' ')))) ||
        (filterGenre === 'action' && movie.Title.includes('Action')) ||
        (filterGenre === 'horror' && movie.Title.includes('Horror')) ||
        (filterGenre === 'comedy' && movie.Title.includes('Comedy'));
      
      return typeMatch && genreMatch;
    });
  };

  const MovieCard = ({ movie }) => (
    <Card 
      component={Link}
      to={`/movie/${movie.imdbID}`}
      sx={{ 
        height: '400px',
        display: 'flex', 
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        background: theme.palette.background.paper,
        borderRadius: '12px',
        overflow: 'hidden',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[isDark ? 8 : 4],
        textDecoration: 'none',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: theme.shadows[isDark ? 16 : 8],
          '& .poster-overlay': {
            opacity: 1
          }
        }
      }}
    >
      <Box sx={{
        position: 'relative',
        height: '100%',
        width: '100%'
      }}>
        <CardMedia
          component="img"
          image={movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster'}
          alt={movie.Title}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
        <Box className="poster-overlay" sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          p: 3,
          color: 'white'
        }}>
          <Typography variant="h6" sx={{ 
            fontWeight: 'bold',
            mb: 1,
            textShadow: '0 2px 4px rgba(0,0,0,0.5)'
          }}>
            {movie.Title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={movie.Type === 'movie' ? 'Film' : 'Dizi'} 
              size="small"
              sx={{
                fontWeight: 'bold',
                backgroundColor: movie.Type === 'movie' ? '#1976d2' : '#9c27b0',
                color: 'white'
              }}
            />
            <Chip 
              label={movie.Year}
              size="small"
              variant="outlined"
              sx={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white'
              }}
            />
          </Box>
        </Box>
        <Chip 
          label={movie.Type === 'movie' ? 'Film' : 'Dizi'} 
          size="small"
          sx={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            fontWeight: 'bold',
            backgroundColor: movie.Type === 'movie' ? '#1976d2' : '#9c27b0',
            color: 'white',
            zIndex: 2
          }}
        />
      </Box>
    </Card>
  );

  const MovieGrid = ({ movies, title }) => (
    <Fade in timeout={800}>
      <Box sx={{ mb: 5 }}>
        <Paper 
          elevation={2}
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 3,
            background: theme.palette.background.paper,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: theme.shadows[isDark ? 8 : 4]
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 'bold',
                color: theme.palette.text.primary,
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                mb: 3,
                position: 'relative',
                '&:after': {
                  content: '""',
                  display: 'block',
                  width: '60px',
                  height: '4px',
                  background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                  borderRadius: '2px',
                  mt: 1
                }
              }}
            >
              {title}
            </Typography>
          </Box>
          <Grid container spacing={3}>
            {movies.map((movie) => (
              <Grid item xs={6} sm={4} md={3} lg={2.4} key={movie.imdbID}>
                <MovieCard movie={movie} />
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Box>
    </Fade>
  );

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: theme.palette.background.default,
      pb: 4,
      transition: 'background 0.3s ease'
    }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Search & Filter Section */}
        <Fade in timeout={600}>
          <Paper 
            elevation={10} 
            sx={{ 
              p: { xs: 3, md: 5 }, 
              mb: 4, 
              borderRadius: 4,
              background: theme.palette.background.paper,
              backdropFilter: 'blur(15px)',
              border: `1px solid ${theme.palette.divider}`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
              <Box sx={{ mb: 4 }}>
                <ExploreIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
                <Typography 
                  variant="h3" 
                  component="h1" 
                  sx={{ 
                    color: theme.palette.text.primary, 
                    fontWeight: 'bold',
                    mb: 1,
                    background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Film ve Dizi Keşfedin
                </Typography>
                <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
                  Binlerce film ve dizi arasında aradığınızı bulun
                </Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                gap: 2,
                maxWidth: '900px',
                mx: 'auto',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TextField
                  fullWidth
                  label="Film veya dizi adı girin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  variant="filled"
                  InputProps={{
                    startAdornment: (
                      <InputLabel htmlFor="search-input" sx={{ color: theme.palette.text.secondary, pr: 1 }}>
                        <SearchIcon sx={{ color: theme.palette.primary.main }} />
                      </InputLabel>
                    ),
                    disableUnderline: true,
                    sx: { borderRadius: 2 }
                  }}
                  sx={{
                    '& .MuiFilledInput-root': {
                      backgroundColor: theme.palette.action.hover,
                      borderRadius: 2,
                      '&:hover': {
                        backgroundColor: theme.palette.action.selected,
                      },
                      '&.Mui-focused': {
                        backgroundColor: theme.palette.action.selected,
                      }
                    }
                  }}
                />
                
                <FormControl sx={{ minWidth: 120 }} size="small">
                    <InputLabel id="filter-type-label" sx={{ color: theme.palette.text.primary }}>Tür</InputLabel>
                    <Select
                      labelId="filter-type-label"
                      value={filterType}
                      label="Tür"
                      onChange={(e) => setFilterType(e.target.value)}
                      sx={{ 
                        color: theme.palette.text.primary,
                        '.MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                        '.MuiSvgIcon-root': { color: theme.palette.action.active }
                      }}
                    >
                      <MenuItem value="all">Tümü</MenuItem>
                      <MenuItem value="movie">Filmler</MenuItem>
                      <MenuItem value="series">Diziler</MenuItem>
                    </Select>
                  </FormControl>
                  <Button 
                    variant="contained" 
                    onClick={handleSearch} 
                    disabled={loadingSearch || !searchTerm.trim()}
                    sx={{ 
                      minWidth: isMobile ? '100%' : '140px',
                      height: '56px',
                      fontWeight: 'bold',
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                      },
                      '&:disabled': {
                        background: theme.palette.action.disabledBackground,
                        color: theme.palette.action.disabled
                      },
                      transition: 'all 0.3s ease'
                    }}
                    startIcon={loadingSearch ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                  >
                    {loadingSearch ? 'Aranıyor...' : 'Ara'}
                  </Button>
              </Box>
            </Box>
          </Paper>
        </Fade>

        {/* Dynamic Content Display */}
        {loadingSearch ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 8 }}>
            <CircularProgress size={60} color="primary" />
            <Typography sx={{ ml: 2, color: theme.palette.text.primary, fontSize: '1.2rem' }}>Aranıyor...</Typography>
          </Box>
        ) : searchResults && searchResults.length > 0 ? (
          <MovieGrid movies={filterMovies(searchResults)} title={`"${searchTerm}" için Sonuçlar`} />
        ) : searchResults && searchResults.length === 0 ? (
          <Box sx={{ my: 4, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: theme.palette.text.secondary }}>
              "{searchTerm}" için sonuç bulunamadı.
            </Typography>
          </Box>
        ) : (
          /* Categories Section - Sadece searchResults null ise gösterilir */
          loadingCategories ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 8 }}>
              <CircularProgress size={60} color="primary" />
              <Typography sx={{ ml: 2, color: theme.palette.text.primary, fontSize: '1.2rem' }}>Kategoriler yükleniyor...</Typography>
            </Box>
          ) : (
            <>
              {mostFavorited.length > 0 && (
                <MovieGrid movies={filterMovies(mostFavorited)} title="🔥 En Çok Favorilenenler" />
              )}
              {popularMovies.length > 0 && (
                <MovieGrid movies={filterMovies(popularMovies)} title="🎬 Popüler Filmler" />
              )}
              {popularSeries.length > 0 && (
                <MovieGrid movies={filterMovies(popularSeries)} title="📺 Popüler Diziler" />
              )}
              {actionMovies.length > 0 && (
                <MovieGrid movies={filterMovies(actionMovies)} title="💥 Aksiyon Filmleri" />
              )}
              {horrorMovies.length > 0 && (
                <MovieGrid movies={filterMovies(horrorMovies)} title="👻 Korku Filmleri" />
              )}
              {comedyMovies.length > 0 && (
                <MovieGrid movies={filterMovies(comedyMovies)} title="😄 Komedi Filmleri" />
              )}
            </>
          )
        )}
      </Container>
    </Box>
  );
};

export default HomePage;