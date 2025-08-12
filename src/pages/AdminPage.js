import { useState, useEffect } from 'react';
import { userApi, interactionApi, adminApi, moderatorApi } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Person as PersonIcon,
  Comment as CommentIcon
} from '@mui/icons-material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // User management state (admin only)
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // Comment management state (admin + moderator)
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  
  // Common state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    role: 'ROLE_USER'
  });

  // Fetch users (admin only)
  const fetchUsers = async () => {
    if (user?.role !== 'ROLE_ADMIN') return;
    
    setLoadingUsers(true);
    setError('');
    try {
      const response = await userApi.getAllUsers();
      setUsers(response.data || []);
      console.log('Fetched users:', response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Kullanıcıları getirirken hata oluştu');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch comments (admin + moderator)
  const fetchComments = async () => {
    if (!['ROLE_ADMIN', 'ROLE_MODERATOR'].includes(user?.role)) return;
    
    setLoadingComments(true);
    setError('');
    try {
      // Use the appropriate API based on role
      const api = user.role === 'ROLE_ADMIN' ? adminApi : moderatorApi;
      const response = await api.getAllComments();
      console.log('API Response:', response);
      
      // Ensure comments is always an array
      const commentsData = Array.isArray(response.data) ? response.data : 
                          Array.isArray(response) ? response : [];
      
      setComments(commentsData);
      console.log('Fetched comments:', commentsData);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
      setError('Yorumları getirirken hata oluştu');
      setComments([]); // Ensure comments is an empty array on error
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ROLE_ADMIN') {
      fetchUsers();
    }
    if (['ROLE_ADMIN', 'ROLE_MODERATOR'].includes(user?.role)) {
      fetchComments();
    }
  }, [user]);

  // User management handlers
  const handleEditUser = (userData) => {
    setCurrentUser(userData);
    setUserForm({
      username: userData.username || '',
      email: userData.email || '',
      role: userData.role || 'ROLE_USER'
    });
    setOpenUserDialog(true);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await userApi.deleteUser(id);
      setSuccess('Kullanıcı başarıyla silindi');
      fetchUsers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to delete user:', error);
      setError('Kullanıcı silinirken hata oluştu');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleUpdateUser = async () => {
  try {
    // Rol değişikliği için özel bir istek yapmaya gerek kalmadı
    await userApi.updateUser(currentUser.id, {
      username: userForm.username,
      email: userForm.email,
    });
    await adminApi.updateUserRole(currentUser.id, userForm.role);

    setSuccess('Kullanıcı başarıyla güncellendi');
    setOpenUserDialog(false);
    fetchUsers();
    setTimeout(() => setSuccess(''), 3000);
  } catch (error) {
    console.error('Failed to update user:', error);
    setError(error.response?.data?.message || 'Kullanıcı güncellenirken hata oluştu');
    setTimeout(() => setError(''), 3000);
  }
};

  // Comment management handlers
  const handleDeleteComment = async (id) => {
    if (!window.confirm('Bu yorumu silmek istediğinizden emin misiniz?')) return;
    
    try {
      await moderatorApi.deleteComment(id);
      setSuccess('Yorum başarıyla silindi');
      fetchComments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      setError('Yorum silinirken hata oluştu');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'error';
      case 'ROLE_MODERATOR':
        return 'warning';
      case 'ROLE_USER':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'Admin';
      case 'ROLE_MODERATOR':
        return 'Moderatör';
      case 'ROLE_USER':
        return 'Kullanıcı';
      default:
        return 'Bilinmiyor';
    }
  };

  if (!user || !['ROLE_ADMIN', 'ROLE_MODERATOR'].includes(user.role)) {
    return (
      <Box sx={{ 
        p: 3, 
        textAlign: 'center', 
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Typography variant="h4" color="error" gutterBottom>
          Erişim Reddedildi
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Bu sayfaya erişim için yeterli yetkiniz bulunmuyor.
        </Typography>
      </Box>
    );
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <CardContent>
          <Typography variant="h4" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
            🛠️ Yönetim Paneli
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            Hoş geldiniz, {user.username}! Rol: {getRoleLabel(user.role)}
          </Typography>
        </CardContent>
      </Card>
      
      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 64,
              fontSize: '1rem',
              fontWeight: 500
            }
          }}
        >
          {user.role === 'ROLE_ADMIN' && (
            <Tab 
              icon={<PersonIcon />} 
              label="Kullanıcı Yönetimi" 
              iconPosition="start"
            />
          )}
          <Tab 
            icon={<CommentIcon />} 
            label="Yorum Yönetimi" 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* User Management Tab (Admin only) */}
      {user.role === 'ROLE_ADMIN' && (
        <TabPanel value={activeTab} index={0}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ 
                display: 'flex', 
                alignItems: 'center',
                color: 'primary.main',
                fontWeight: 'bold'
              }}>
                <PersonIcon sx={{ mr: 1 }} />
                Kullanıcı Yönetimi
              </Typography>

              {loadingUsers ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress size={40} />
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                  <Table>
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Kullanıcı Adı</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>E-posta</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Rol</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>İşlemler</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {users.length > 0 ? (
                        users.map((userData) => (
                          <TableRow key={userData.id} hover>
                            <TableCell>{userData.id}</TableCell>
                            <TableCell>{userData.username}</TableCell>
                            <TableCell>{userData.email}</TableCell>
                            <TableCell>
                              <Chip
                                label={getRoleLabel(userData.role)}
                                color={getRoleColor(userData.role)}
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Tooltip title="Düzenle">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleEditUser(userData)}
                                >
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Sil">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteUser(userData.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            <Typography variant="body1" color="text.secondary">
                              Henüz kullanıcı bulunmuyor
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </TabPanel>
      )}

      {/* Comment Management Tab */}
      <TabPanel value={activeTab} index={user.role === 'ROLE_ADMIN' ? 1 : 0}>
        <Card>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ 
              display: 'flex', 
              alignItems: 'center',
              color: 'primary.main',
              fontWeight: 'bold'
            }}>
              <CommentIcon sx={{ mr: 1 }} />
              Yorum Yönetimi
            </Typography>

            {loadingComments ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={40} />
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>İçerik</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Film ID</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Kullanıcı</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Oluşturulma Tarihi</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {comments.length > 0 ? (
                      comments.map((comment) => (
                        <TableRow key={comment.id} hover>
                          <TableCell>{comment.id}</TableCell>
                          <TableCell>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                maxWidth: 200, 
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {comment.content}
                            </Typography>
                          </TableCell>
                          <TableCell>{comment.imdbId}</TableCell>
                          <TableCell>
                            {comment.username ? (
                              <Chip label={comment.username} size="small" variant="outlined" />
                            ) : (
                              <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                Silinmiş Kullanıcı
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {comment.createdAt ? 
                              new Date(comment.createdAt).toLocaleDateString('tr-TR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 
                              '-'
                            }
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Yorumu Sil">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Typography variant="body1" color="text.secondary">
                            Henüz yorum bulunmuyor
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </TabPanel>

      {/* Edit User Dialog */}
      <Dialog 
        open={openUserDialog} 
        onClose={() => setOpenUserDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 'bold'
        }}>
          Kullanıcı Düzenle
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            margin="dense"
            label="Kullanıcı Adı"
            fullWidth
            variant="outlined"
            value={userForm.username}
            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="E-posta"
            type="email"
            fullWidth
            variant="outlined"
            value={userForm.email}
            onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Select
            value={userForm.role}
            onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
            fullWidth
            variant="outlined"
          >
            <MenuItem value="ROLE_USER">Kullanıcı</MenuItem>
            <MenuItem value="ROLE_MODERATOR">Moderatör</MenuItem>
            <MenuItem value="ROLE_ADMIN">Admin</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Button onClick={() => setOpenUserDialog(false)} variant="outlined">
            İptal
          </Button>
          <Button onClick={handleUpdateUser} variant="contained">
            Değişiklikleri Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPage;