import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // In a real app, you would check the user's role from the backend
  return user ? children : <Navigate to="/login" />;
};

export default AdminRoute;