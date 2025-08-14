import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';
import { jwtDecode } from 'jwt-decode';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedToken = localStorage.getItem('token');

        if (storedToken) {
          const decoded = jwtDecode(storedToken);
          const currentTime = Date.now() / 1000;

          if (decoded.exp && decoded.exp < currentTime) {
            // Token süresi dolmuş
            console.log('Token expired, logging out...');
            logout();
            return;
          }

          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
            console.log('Loaded user from localStorage:', JSON.parse(storedUser));
          } else {
            // Eski format fallback
            loadOldFormat(storedToken);
          }
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        clearStorage();
      } finally {
        setLoading(false);
      }
    };

    const loadOldFormat = (storedToken) => {
      try {
        const id = localStorage.getItem('userId');
        const username = localStorage.getItem('username');
        const email = localStorage.getItem('email');
        const image = localStorage.getItem('image');
        const role = localStorage.getItem('role');

        if (username && id) {
          const userData = {
            id: parseInt(id),
            username,
            email: email || '',
            image: image || '',
            role: role || 'USER'
          };
          setToken(storedToken);
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('Loaded user from old format:', userData);
        } else {
          clearStorage();
        }
      } catch (error) {
        console.error('Error loading old format:', error);
        clearStorage();
      }
    };

    const clearStorage = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      localStorage.removeItem('username');
      localStorage.removeItem('email');
      localStorage.removeItem('image');
      localStorage.removeItem('role');
    };

    const logout = () => {
      clearStorage();
      setUser(null);
      setToken(null);
      console.log('User logged out due to token expiration');
    };

    loadUserFromStorage();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authApi.login(credentials);
      const { token, id, username, email, image, role } = response.data;

      const userData = { id, username, email: email || '', image: image || '', role: role || 'USER' };

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('userId', id.toString());
      localStorage.setItem('username', username);
      localStorage.setItem('email', email || '');
      localStorage.setItem('image', image || '');
      localStorage.setItem('role', role || 'USER');

      setToken(token);
      setUser(userData);

      console.log('User logged in:', userData);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      return await authApi.register(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('image');
    localStorage.removeItem('role');
    setUser(null);
    setToken(null);
    console.log('User manually logged out');
  };

  const updateUser = (updatedUser) => {
    const newUserData = { ...user, ...updatedUser };
    localStorage.setItem('user', JSON.stringify(newUserData));
    if (newUserData.username) localStorage.setItem('username', newUserData.username);
    if (newUserData.email) localStorage.setItem('email', newUserData.email);
    if (newUserData.image) localStorage.setItem('image', newUserData.image);
    if (newUserData.role) localStorage.setItem('role', newUserData.role);
    setUser(newUserData);
    console.log('User updated:', newUserData);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
