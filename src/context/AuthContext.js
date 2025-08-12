import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedToken = localStorage.getItem('token');
        
        // Eğer token varsa, kullanıcı bilgilerini yükle
        if (storedToken) {
          const storedUser = localStorage.getItem('user');
          
          if (storedUser) {
            // Yeni format: JSON olarak kaydedilmiş kullanıcı bilgileri
            try {
              const parsedUser = JSON.parse(storedUser);
              setToken(storedToken);
              setUser(parsedUser);
              console.log('Loaded user from localStorage (JSON):', parsedUser);
            } catch (parseError) {
              console.error('Error parsing user JSON, trying old format...');
              // Eski format için fallback
              loadOldFormat(storedToken);
            }
          } else {
            // Eski format için fallback
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

    // Eski format için yedek fonksiyon
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
          
          // Yeni formata dönüştür
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('Loaded user from localStorage (old format):', userData);
        } else {
          console.warn('Incomplete user data in localStorage');
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

    loadUserFromStorage();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authApi.login(credentials);
      const { token, id, username, email, image, role } = response.data;
      
      const userData = {
        id,
        username,
        email: email || '',
        image: image || '',
        role: role || 'USER'
      };
      
      // Token'ı kaydet
      localStorage.setItem('token', token);
      
      // Kullanıcı bilgilerini JSON olarak kaydet (yeni format)
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Eski format key'leri de kaydet (geriye uyumluluk için)
      localStorage.setItem('userId', id.toString());
      localStorage.setItem('username', username);
      localStorage.setItem('email', email || '');
      localStorage.setItem('image', image || '');
      localStorage.setItem('role', role || 'USER');
      
      setToken(token);
      setUser(userData);
      
      console.log('User logged in and saved:', userData);
      
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
    // Tüm localStorage key'lerini temizle
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('image');
    localStorage.removeItem('role');
    
    setUser(null);
    setToken(null);
    
    console.log('User logged out and storage cleared');
  };

  const updateUser = (updatedUser) => {
    try {
      const newUserData = {
        ...user,
        ...updatedUser
      };
      
      // JSON formatında kaydet
      localStorage.setItem('user', JSON.stringify(newUserData));
      
      // Eski format key'leri de güncelle
      localStorage.setItem('username', newUserData.username);
      localStorage.setItem('email', newUserData.email || '');
      localStorage.setItem('image', newUserData.image || '');
      if (newUserData.role) {
        localStorage.setItem('role', newUserData.role);
      }
      
      setUser(newUserData);
      
      console.log('User updated:', newUserData);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token,
      login, 
      register, 
      logout, 
      updateUser,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);