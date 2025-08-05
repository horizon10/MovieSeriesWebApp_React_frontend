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
  Container
} from '@mui/material';
import { Link } from 'react-router-dom';

const HomePage = () => {
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

  // Popüler film/dizi listelerini oluşturmak için kullanılacak anahtar kelimeler
  const popularMovieKeywords = [
    'Avengers', 'Spider-Man', 'Batman', 'Superman', 'Star Wars', 
    'Harry Potter', 'Lord of the Rings', 'Fast Furious', 'Mission Impossible', 'Terminator'
  ];
  
  const popularSeriesKeywords = [
    'Breaking Bad', 'Game of Thrones', 'Friends', 'The Office', 'Stranger Things',
    'The Crown', 'Narcos', 'House of Cards', 'Sherlock', 'Lost'
  ];

  const actionKeywords = [
    'John Wick', 'Die Hard', 'Mad Max', 'Rambo', 'Rocky', 
    'Gladiator', 'Matrix', 'Taken', 'Bourne', 'Top Gun'
  ];

  const horrorKeywords = [
    'Halloween', 'Friday the 13th', 'Nightmare', 'Scream', 'It',
    'Conjuring', 'Insidious', 'Paranormal Activity', 'Saw', 'Exorcist'
  ];

  const comedyKeywords = [
    'Hangover', 'Anchorman', 'Dumb and Dumber', 'Ghostbusters', 'Superbad',
    'Step Brothers', 'Tropic Thunder', 'Zoolander', 'Wedding Crashers', 'Meet the Parents'
  ];

  // Kategori filmlerini getir
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
      
      // Duplicate'ları kaldır
      const uniqueMovies = allMovies.filter((movie, index, self) => 
        index === self.findIndex(m => m.imdbID === movie.imdbID)
      );

      setterFunction(uniqueMovies.slice(0, 8));
    } catch (error) {
      console.error('Error fetching category movies:', error);
    }
  };

  // Sayfa yüklendiğinde kategorileri getir
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

  // Filtreleme fonksiyonu
  const filterMovies = (movieList) => {
    return movieList.filter(movie => {
      const typeMatch = filterType === 'all' || 
        (filterType === 'movie' && movie.Type === 'movie') ||
        (filterType === 'series' && movie.Type === 'series');
      
      return typeMatch;
    });
  };

  const MovieGrid = ({ movies, title }) => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
        {title}
      </Typography>
      <Grid container spacing={2}>
        {filterMovies(movies).map((movie) => (
          <Grid item xs={6} sm={4} md={3} lg={2.4} key={movie.imdbID}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={movie.Poster !== 'N/A' ? movie.Poster : '/placeholder.jpg'}
                alt={movie.Title}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1, p: 1 }}>
                <Typography 
                  variant="body2" 
                  component="div"
                  sx={{ 
                    fontWeight: 'bold',
                    fontSize: '0.85rem',
                    lineHeight: 1.2,
                    mb: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}
                >
                  {movie.Title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {movie.Year}
                </Typography>
                {movie.Type && (
                  <Chip 
                    label={movie.Type} 
                    size="small" 
                    sx={{ ml: 1, fontSize: '0.7rem', height: '20px' }}
                  />
                )}
                <Button 
                  component={Link}
                  to={`/movie/${movie.imdbID}`}
                  variant="outlined" 
                  size="small"
                  fullWidth
                  sx={{ mt: 1, fontSize: '0.7rem', py: 0.5 }}
                >
                  Detaylar
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Arama Bölümü */}
      <Box sx={{ display: 'flex', mb: 3, gap: 2 }}>
        <TextField
          fullWidth
          label="Film/Dizi Ara"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchMovies()}
        />
        <Button 
          variant="contained" 
          onClick={searchMovies} 
          disabled={loading}
          sx={{ minWidth: '100px' }}
        >
          {loading ? <CircularProgress size={24} /> : 'Ara'}
        </Button>
      </Box>

      {/* Filtreler */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Tür</InputLabel>
          <Select
            value={filterType}
            label="Tür"
            onChange={(e) => setFilterType(e.target.value)}
          >
            <MenuItem value="all">Tümü</MenuItem>
            <MenuItem value="movie">Film</MenuItem>
            <MenuItem value="series">Dizi</MenuItem>
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Kategori</InputLabel>
          <Select
            value={filterGenre}
            label="Kategori"
            onChange={(e) => setFilterGenre(e.target.value)}
          >
            <MenuItem value="all">Tümü</MenuItem>
            <MenuItem value="action">Aksiyon</MenuItem>
            <MenuItem value="horror">Korku</MenuItem>
            <MenuItem value="comedy">Komedi</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Arama Sonuçları */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : movies.length > 0 ? (
        <MovieGrid movies={movies} title="Arama Sonuçları" />
      ) : null}

      {/* Kategori Bölümleri */}
      {loadingCategories ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Kategoriler yükleniyor...</Typography>
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
  );
};

export default HomePage;