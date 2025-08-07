import axios from 'axios';

const API_BASE_URL = 'http://localhost:8090';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (userData) => api.post('/login/save', userData),
  login: (credentials) => api.post('/login/auth', credentials),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) => api.post('/api/auth/reset-password', { token, newPassword }),
  validateResetToken: (token) => api.get(`/api/auth/validate-reset-token?token=${token}`),
};

export const omdbApi = {
  // Arama listesi (kategori aramaları için)
  search: (title) => api.get('/api/omdb/search', { params: { title } }),
  
  // Tek film arama
  searchMovie: (title) => api.get('/api/omdb/movie', { params: { title } }),
  
  // ID ile arama
  searchById: (imdbId) => api.get('/api/omdb/searchId', { params: { imdbId } }),
  
  // Tür filtreli arama
  searchByType: (title, type) => api.get('/api/omdb/search/type', { 
    params: { title, type } 
  }),
  
  // Yıl filtreli arama
  searchByYear: (title, year) => api.get('/api/omdb/search/year', { 
    params: { title, year } 
  }),
  
  // Sayfa bazlı arama
  searchWithPage: (title, page = 1) => api.get('/api/omdb/search/page', { 
    params: { title, page } 
  }),
  
  // Gelişmiş arama
  advancedSearch: (title, type, year, page = 1) => api.get('/api/omdb/search/advanced', { 
    params: { title, type, year, page } 
  }),
};

export const omdbApiId = {
  search: (imdbId) => api.get('/api/omdb/searchId', { params: { imdbId } })
};

export const interactionApi = {
  addFavorite: (imdbId) => api.post(`/api/home/favorite/${imdbId}`, ""),
  removeFavorite: (imdbId) => api.delete(`/api/home/favorite/${imdbId}`),
  getFavorites: () => api.get('/api/home/favorite'),
  addComment: (imdbId, content) => api.post(`/api/home/comment/${imdbId}`, content, {
    headers: {
      'Content-Type': 'text/plain'
    }
  }),
  getComments: (imdbId) => api.get(`/api/home/comment/${imdbId}`),
  getUserComments: () => api.get('/api/home/comment/user'),
  deleteComment: (commentId) => api.delete(`/api/home/comment/${commentId}`),
  addRating: (imdbId, score) => api.post(`/api/home/rate/${imdbId}`, score, {
    headers: {
      'Content-Type': 'application/json'
    }
  }),
  getRatings: (imdbId) => api.get(`/api/home/rate/${imdbId}`),
  getUserRatings: () => api.get('/api/home/rate/user'),
  deleteRating: (ratingId) => api.delete(`/api/home/rate/${ratingId}`),
  getAverageRating: (imdbId) => api.get(`/api/home/rate/${imdbId}/average`),
};

export const userApi = {
  getAllUsers: () => api.get('/api/users'),
  getUser: (username) => api.get(`/api/users/${username}`),
  updateUser: (id, userData) => api.put(`/api/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/api/users/${id}`),
};