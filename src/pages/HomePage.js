import { useState, useEffect } from 'react';
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
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import MoodBadIcon from '@mui/icons-material/MoodBad';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExploreIcon from '@mui/icons-material/Explore';

const HomePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchTerm, setSearchTerm] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popularMovies, setPopularMovies] = useState([]);
  const [popularSeries, setPopularSeries] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);
  const [horrorMovies, setHorrorMovies] = useState([]);
  const [comedyMovies, setComedyMovies] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterGenre, setFilterGenre] = useState('all');
  const [loadingCategories, setLoadingCategories] = useState(false);

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
        fetchCategoryMovies(comedyKeywords, setComedyMovies)
      ]);
      
      setLoadingCategories(false);
    };

    loadCategories();
  }, []);

  const searchMovies = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const response = await omdbApi.search(searchTerm);
      
      if (response.data?.Search) {
        setMovies(response.data.Search);
      } else {
        setMovies([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const filterMovies = (movieList) => {
    return movieList.filter(movie => {
      const typeMatch = filterType === 'all' || 
        (filterType === 'movie' && movie.Type === 'movie') ||
        (filterType === 'series' && movie.Type === 'series');
      
      return typeMatch;
    });
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case '🎬 Popüler Filmler':
        return <MovieIcon sx={{ mr: 1, color: '#1976d2' }} />;
      case '📺 Popüler Diziler':
        return <TvIcon sx={{ mr: 1, color: '#9c27b0' }} />;
      case '💥 Aksiyon Filmleri':
        return <TheatersIcon sx={{ mr: 1, color: '#f44336' }} />;
      case '👻 Korku Filmleri':
        return <MoodBadIcon sx={{ mr: 1, color: '#ff9800' }} />;
      case '😄 Komedi Filmleri':
        return <EmojiEmotionsIcon sx={{ mr: 1, color: '#4caf50' }} />;
      default:
        return null;
    }
  };

  const MovieGrid = ({ movies, title }) => (
    <Fade in timeout={800}>
      <Box sx={{ mb: 5 }}>
        <Paper 
          elevation={2}
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: 3,
            background: 'rgba(30, 30, 30, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {getCategoryIcon(title)}
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 'bold',
                color: '#ffffff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
              }}
            >
              {title}
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            {filterMovies(movies).map((movie) => (
              <Grid item xs={6} sm={4} md={3} lg={2.4} key={movie.imdbID}>
                <Card 
                  sx={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: 'rgba(25, 118, 210, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                      '& .movie-poster': {
                        transform: 'scale(1.05)'
                      }
                    }
                  }}
                >
                  <Box sx={{ overflow: 'hidden', position: 'relative' }}>
                    <CardMedia
                      component="img"
                      height="280"
                      image={movie.Poster !== 'N/A' ? movie.Poster : '/placeholder.jpg'}
                      alt={movie.Title}
                      className="movie-poster"
                      sx={{ 
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease'
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1
                      }}
                    >
                      {movie.Type && (
                        <Chip 
                          label={movie.Type === 'movie' ? 'Film' : 'Dizi'} 
                          size="small" 
                          sx={{ 
                            fontSize: '0.7rem', 
                            height: '22px',
                            fontWeight: 'bold',
                            background: movie.Type === 'movie' ? 
                              'rgba(25, 118, 210, 0.9)' : 'rgba(156, 39, 176, 0.9)',
                            color: 'white',
                            backdropFilter: 'blur(10px)'
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    <Typography 
                      variant="subtitle1" 
                      component="div"
                      sx={{ 
                        fontWeight: 'bold',
                        lineHeight: 1.3,
                        mb: 1.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        minHeight: '2.6em',
                        color: '#ffffffff'
                      }}
                    >
                      {movie.Title}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Chip 
                        label={movie.Year}
                        size="small" 
                        variant="outlined"
                        sx={{ 
                          fontSize: '0.7rem', 
                          height: '22px',
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}
                      />
                    </Box>
                    
                    <Button 
                      component={Link}
                      to={`/movie/${movie.imdbID}`}
                      variant="contained" 
                      size="small"
                      fullWidth
                      sx={{ 
                        mt: 'auto',
                        fontSize: '0.8rem', 
                        py: 1,
                        borderRadius: 2,
                        fontWeight: 'bold',
                        background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(25, 118, 210, 0.4)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Detayları Gör
                    </Button>
                  </CardContent>
                </Card>
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
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      pb: 4
    }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Hero Search Section */}
        <Fade in timeout={600}>
          <Paper 
            elevation={10} 
            sx={{ 
              p: { xs: 3, md: 5 }, 
              mb: 4, 
              borderRadius: 4,
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Decorative Elements */}
            <Box
              sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 200,
                height: 200,
                background: 'radial-gradient(circle, rgba(25, 118, 210, 0.1) 0%, transparent 70%)',
                borderRadius: '50%'
              }}
            />
            
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <ExploreIcon sx={{ fontSize: 48, color: '#1976d2', mb: 2 }} />
                <Typography 
                  variant="h3" 
                  component="h1" 
                  sx={{ 
                    color: '#ffffff', 
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
                <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Binlerce film ve dizi arasında aradığınızı bulun
                </Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'column' : 'row',
                gap: 2,
                maxWidth: '800px',
                mx: 'auto'
              }}>
                <TextField
                  fullWidth
                  label="Film veya dizi adı girin..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchMovies()}
                  variant="filled"
                  InputProps={{
                    sx: {
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: 2,
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 1)',
                      }
                    }
                  }}
                  InputLabelProps={{
                    sx: { color: 'rgba(0,0,0,0.6)' }
                  }}
                />
                <Button 
                  variant="contained" 
                  onClick={searchMovies} 
                  disabled={loading || !searchTerm.trim()}
                  sx={{ 
                    minWidth: isMobile ? '100%' : '140px',
                    height: isMobile ? '56px' : '56px',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)'
                    },
                    '&:disabled': {
                      background: 'rgba(0,0,0,0.12)',
                      color: 'rgba(0,0,0,0.26)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                >
                  {loading ? 'Aranıyor...' : 'Ara'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Fade>

        {/* Filters Section */}
        <Fade in timeout={800}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              mb: 4, 
              borderRadius: 3,
              background: 'rgba(30, 30, 30, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FilterListIcon sx={{ mr: 1, color: '#1976d2' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
                Filtrele
              </Typography>
            </Box>
            <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <FormControl sx={{ minWidth: 120 }} size="small">
                <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Tür</InputLabel>
                <Select
                  value={filterType}
                  label="Tür"
                  onChange={(e) => setFilterType(e.target.value)}
                  sx={{ 
                    color: '#ffffff',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.5)'
                    },
                    '.MuiSvgIcon-root': {
                      color: '#ffffff'
                    }
                  }}
                >
                  <MenuItem value="all">Tümü</MenuItem>
                  <MenuItem value="movie">Filmler</MenuItem>
                  <MenuItem value="series">Diziler</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 120 }} size="small">
                <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Kategori</InputLabel>
                <Select
                  value={filterGenre}
                  label="Kategori"
                  onChange={(e) => setFilterGenre(e.target.value)}
                  sx={{ 
                    color: '#ffffff',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.3)'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255,255,255,0.5)'
                    },
                    '.MuiSvgIcon-root': {
                      color: '#ffffff'
                    }
                  }}
                >
                  <MenuItem value="all">Tümü</MenuItem>
                  <MenuItem value="action">Aksiyon</MenuItem>
                  <MenuItem value="horror">Korku</MenuItem>
                  <MenuItem value="comedy">Komedi</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>
        </Fade>

        {/* Search Results */}
        {loading ? (
          <Backdrop open sx={{ zIndex: 1300, color: '#fff' }}>
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress size={60} />
              <Typography sx={{ mt: 2 }}>Aranıyor...</Typography>
            </Box>
          </Backdrop>
        ) : movies.length > 0 ? (
          <>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#ffffff' }}>
              Arama Sonuçları
            </Typography>
            <MovieGrid movies={movies} title="🔍 Arama Sonuçları" />
            <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.1)' }} />
          </>
        ) : null}

        {/* Categories Section */}
        {loadingCategories ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 8 }}>
            <CircularProgress size={60} />
            <Typography sx={{ ml: 2, color: '#ffffff', fontSize: '1.2rem' }}>Kategoriler yükleniyor...</Typography>
          </Box>
        ) : (
          <>
            {popularMovies.length > 0 && (
              <MovieGrid movies={popularMovies} title="🎬 Popüler Filmler" />
            )}
            
            {popularSeries.length > 0 && (
              <MovieGrid movies={popularSeries} title="📺 Popüler Diziler" />
            )}
            
            {actionMovies.length > 0 && (
              <MovieGrid movies={actionMovies} title="💥 Aksiyon Filmleri" />
            )}
            
            {horrorMovies.length > 0 && (
              <MovieGrid movies={horrorMovies} title="👻 Korku Filmleri" />
            )}
            
            {comedyMovies.length > 0 && (
              <MovieGrid movies={comedyMovies} title="😄 Komedi Filmleri" />
            )}
          </>
        )}
      </Container>
    </Box>
  );
};

export default HomePage;