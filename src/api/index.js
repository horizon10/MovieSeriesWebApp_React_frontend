import axios from 'axios';

const API_BASE_URL = 'http://localhost:8090'; // Update with your backend URL

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
  return Promise.reject(error);});

export const authApi = {
  register: (userData) => api.post('/login/save', userData),
  login: (credentials) => api.post('/login/auth', credentials),
};

export const omdbApi = {
  search: (title) => api.get('/api/omdb/search', { params: { title } })
  
};
export const omdbApiId = {
  search: (imdbId) => api.get('/api/omdb/searchId', { params: { imdbId } })
  
};

export const interactionApi = {
  // Favorites
  addFavorite: (imdbId) => api.post(`/api/home/favorite/${imdbId}`),
  removeFavorite: (imdbId) => api.delete(`/api/home/favorite/${imdbId}`),
  getFavorites: () => api.get('/api/home/favorite'),
  
  // Comments
  addComment: (imdbId, content) => api.post(`/api/home/comment/${imdbId}`, content),
  getComments: (imdbId) => api.get(`/api/home/comment/${imdbId}`),
  
  // Ratings
  addRating: (imdbId, score) => api.post(`/api/home/rate/${imdbId}`, score),
  getRatings: (imdbId) => api.get(`/api/home/rate/${imdbId}`),
  getAverageRating: (imdbId) => api.get(`/api/home/rate/${imdbId}/average`),
};

export const userApi = {
  getAllUsers: () => api.get('/api/users'),
  getUser: (username) => api.get(`/api/users/${username}`),
  updateUser: (id, userData) => api.put(`/api/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/api/users/${id}`),
};