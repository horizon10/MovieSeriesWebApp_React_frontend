import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  if (!user) return <Navigate to="/login" />;

  if (user.role === 'ROLE_ADMIN' || user.role === 'ROLE_MODERATOR') {
    return children;
  }

  return <Navigate to="/" />;
};


export default AdminRoute;