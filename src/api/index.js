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
  forgotPassword: (email) => api.post('/login/forgot-password', { email }), // DÜZELTİLDİ
  resetPassword: (token, newPassword) => 
      api.post('/login/reset-password', null, { params: { token, newPassword } }), // DÜZELTİLDİ
  validateResetToken: (token) => api.get(`/login/validate-reset-token?token=${token}`), // DÜZELTİLDİ
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
  // Favori işlemleri
  addFavorite: (imdbId) => api.post(`/api/home/favorite/${imdbId}`, ""),
  removeFavorite: (imdbId) => api.delete(`/api/home/favorite/${imdbId}`),
  getFavorites: () => api.get('/api/home/favorite'),
  getMostFavorited: () => api.get('/api/home/favorite/most-favorited'),

  // Yorum işlemleri
  addComment: (imdbId, content) => api.post(`/api/home/comment/${imdbId}`, content, {
    headers: {
      'Content-Type': 'text/plain'
    }
  }),
  getComments: (imdbId) => api.get(`/api/home/comment/${imdbId}`),
  getCommentsWithLikes: (imdbId) => api.get(`/api/home/comment/${imdbId}/with-likes-and-replies`),
  getUserComments: () => api.get('/api/home/comment/user'),
  deleteComment: (commentId) => api.delete(`/api/home/comment/${commentId}`),
  updateComment: (commentId, newContent) => api.put(`/api/home/comment/${commentId}`, newContent, {
    headers: {
      'Content-Type': 'text/plain'
    }
  }),

  // Yorum beğenme işlemleri
  likeComment: (commentId) => api.post(`/api/home/comment/${commentId}/like`),
  unlikeComment: (commentId) => api.delete(`/api/home/comment/${commentId}/like`),
  getCommentLikes: (commentId) => api.get(`/api/home/comment/${commentId}/likes`),
  getUserLikes: () => api.get('/api/home/comment/likes/user'),

  // Puanlama işlemleri
  addRating: (imdbId, score) => api.post(`/api/home/rate/${imdbId}`, score, {
    headers: {
      'Content-Type': 'application/json'
    }
  }),
  getRatings: (imdbId) => api.get(`/api/home/rate/${imdbId}`),
  getUserRatings: () => api.get('/api/home/rate/user'),
  deleteRating: (ratingId) => api.delete(`/api/home/rate/${ratingId}`),
  getAverageRating: (imdbId) => api.get(`/api/home/rate/${imdbId}/average`),

  addReply: (parentCommentId, content) => api.post(`/api/home/comment/${parentCommentId}/reply`, content, {
    headers: {
      'Content-Type': 'text/plain'
    }
  }),
  getReplies: (commentId) => api.get(`/api/home/comment/${commentId}/replies`),
  getCommentsWithReplies: (imdbId) => api.get(`/api/home/comment/${imdbId}/with-replies`),
};

export const userApi = {
  getAllUsers: () => api.get('/api/users'),
  getUser: (username) => api.get(`/api/users/${username}`),
  updateUser: (id, userData) => api.put(`/api/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/api/users/${id}`),
checkUsername: (username, currentUserId) =>
  api.get(`/api/users/check-username/${username}`, {
    params: { currentUserId }
  }),
};
export const adminApi = {
  // User management
  getAllUsers: () => api.get('/api/admin/users'),
  updateUserRole: (id, role) => api.put(`/api/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/api/admin/users/${id}`),
  
  // Content management
  getAllComments: () => api.get('/api/admin/comments'),
  deleteComment: (id) => api.delete(`/api/admin/comments/${id}`),
  
  // Contact message management
  getAllContactMessages: () => api.get('/api/admin/contact'),
  deleteContactMessage: (id) => api.delete(`/api/admin/contact/${id}`),
  sendContactMessage: (message) => api.post('/api/home/contact', message)
};

export const moderatorApi = {
  // Comment management
  getAllComments: () => api.get('/api/moderator/comments'),
  deleteComment: (id) => api.delete(`/api/moderator/comments/${id}`),
}; 


api.interceptors.response.use(
  response => response,
  error => {
    // Özel hata işleme
    if (error.code === 'ECONNABORTED') {
      throw { message: 'İstek zaman aşımına uğradı', isTimeout: true };
    }
    
    if (!error.response) {
      throw { message: 'Ağ bağlantı hatası', isNetworkError: true };
    }
    
    // Backend'den gelen özel mesaj
    const serverMessage = error.response.data?.message;
    
    throw {
      message: serverMessage || 'Beklenmeyen sunucu hatası',
      status: error.response.status,
      data: error.response.data
    };
  }
);