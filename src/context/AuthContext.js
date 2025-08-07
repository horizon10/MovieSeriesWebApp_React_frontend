import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // You might want to add an endpoint to validate token and get user info
      setUser({ username: localStorage.getItem('username') });
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
  try {
    const response = await authApi.login(credentials);
    const { token, id, username, email, image } = response.data;
    
    // Tüm kullanıcı bilgilerini kaydet
    localStorage.setItem('token', token);
    localStorage.setItem('userId', id);
    localStorage.setItem('username', username);
    localStorage.setItem('email', email || '');
    localStorage.setItem('image', image || '');
    
    setUser({
      id, // Artık ID mevcut
      username,
      email,
      image
    });
    
    return response;
  } catch (error) {
    throw error;
  }
};



  const register = async (userData) => {
    try {
      const response = await authApi.register(userData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setUser(null);
  };
  const updateUser = (updatedUser) => {
  localStorage.setItem('username', updatedUser.username);
  localStorage.setItem('email', updatedUser.email || '');
  localStorage.setItem('image', updatedUser.image || '');
  
  setUser(prev => ({
    ...prev,
    ...updatedUser
  }));
};

  return (
  <AuthContext.Provider value={{ 
    user, 
    login, 
    register, 
    logout, 
    updateUser, // Bu satırı ekledik
    loading 
  }}>
    {children}
  </AuthContext.Provider>
);
};


export const useAuth = () => useContext(AuthContext);