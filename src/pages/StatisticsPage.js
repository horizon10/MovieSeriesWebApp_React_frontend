import React, { useState, useEffect } from 'react';
import { adminApi, omdbApiId } from '../api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '@mui/material/styles';
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Alert,
  Avatar,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useMediaQuery,
  Skeleton,
  Tabs,
  Tab
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Comment as CommentIcon,
  Favorite as FavoriteIcon,
  Email as EmailIcon,
  AdminPanelSettings as AdminIcon,
  Gavel as ModeratorIcon,
  Person as UserIcon,
  Movie as MovieIcon,
  AccessTime as TimeIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as LineChartIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const StatisticsPage = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [movieDetails, setMovieDetails] = useState({});
  const [activeTab, setActiveTab] = useState(0);

  // Modern color palette
  const colors = {
    primary: '#6366f1',
    secondary: '#f59e0b',
    success: '#10b981',
    info: '#06b6d4',
    warning: '#f59e0b',
    error: '#ef4444',
    text: isDark ? '#e0e0e0' : '#424242'
  };

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await adminApi.getStatistics();
      setStatistics(response.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      setError('İstatistikler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchMovieDetails = async (imdbIds) => {
    const details = {};
    const promises = imdbIds.map(async (imdbId) => {
      if (imdbId) {
        try {
          const response = await omdbApiId.search(imdbId);
          if (response.data && response.data.Title) {
            details[imdbId] = { title: response.data.Title, year: response.data.Year };
          }
        } catch (err) {
          console.error(`Failed to fetch details for IMDb ID: ${imdbId}`, err);
        }
      }
    });
    await Promise.all(promises);
    setMovieDetails(details);
  };

  useEffect(() => {
    if (user?.role === 'ROLE_ADMIN') {
      fetchStatistics();
    }
  }, [user]);

  useEffect(() => {
    if (statistics) {
      const allImdbIds = [
        ...(statistics.mostCommentedMovies?.map(m => m.imdbId) || []),
        ...(statistics.mostFavoritedMovies?.map(m => m.imdbId) || [])
      ].filter(id => id);
      fetchMovieDetails([...new Set(allImdbIds)]);
    }
  }, [statistics]);

  if (!user || user.role !== 'ROLE_ADMIN') {
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
          İstatistikleri görüntülemek için admin yetkisi gereklidir.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: isMobile ? 1 : 2,
        maxWidth: 1600,
        mx: 'auto'
      }}>
        <Grid container spacing={2}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Grid item xs={6} sm={3} key={index}>
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2, mt: 2 }} />
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {Array.from({ length: 2 }).map((_, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" onClose={() => setError('')} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Box>
    );
  }

  // Data processing functions
  const roleDistributionData = [
    { name: 'Admin', value: statistics?.adminCount || 0, icon: <AdminIcon />, color: colors.error },
    { name: 'Moderatör', value: statistics?.moderatorCount || 0, icon: <ModeratorIcon />, color: colors.warning },
    { name: 'Kullanıcı', value: statistics?.userCount || 0, icon: <UserIcon />, color: colors.primary }
  ];

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
  };

  const formatChartData = (data, countKey) => {
    return data?.map(item => ({
      ...item,
      name: movieDetails[item.imdbId]?.title || item.imdbId,
      count: item[countKey]
    })) || [];
  };

  const StatCard = ({ title, value, icon, color, trend }) => (
    <Card sx={{
      height: '100%',
      background: isDark 
        ? `linear-gradient(135deg, ${color}20 0%, ${color}10 100%)` 
        : `linear-gradient(135deg, ${color}08 0%, ${color}04 100%)`,
      border: isDark ? `1px solid ${color}30` : 'none',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      borderRadius: 2,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
      }
    }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight="bold" color={color} sx={{ mt: 0.5 }}>
              {value?.toLocaleString() || 0}
            </Typography>
            {trend && (
              <Chip
                label={`↗ ${trend}`}
                size="small"
                sx={{
                  bgcolor: `${colors.success}20`,
                  color: colors.success,
                  fontSize: '0.7rem',
                  height: 20,
                  mt: 0.5
                }}
              />
            )}
          </Box>
          <Avatar sx={{
            bgcolor: `${color}20`,
            color: color,
            width: 36,
            height: 36
          }}>
            {React.cloneElement(icon, { sx: { fontSize: 18 } })}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const OverviewTab = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Summary Cards */}
      <Grid 
    container 
    spacing={1.5} 
    justifyContent="center" 
    alignItems="flex-start"
  >
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Toplam Kullanıcı"
            value={statistics?.totalUsers}
            icon={<PeopleIcon />}
            color={colors.primary}
            trend="+12%"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Toplam Yorum"
            value={statistics?.totalComments}
            icon={<CommentIcon />}
            color={colors.secondary}
            trend="+8%"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Toplam Favori"
            value={statistics?.totalFavorites}
            icon={<FavoriteIcon />}
            color={colors.success}
            trend="+15%"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="İletişim Mesajı"
            value={statistics?.totalContactMessages}
            icon={<EmailIcon />}
            color={colors.info}
            trend="+5%"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid 
    container 
    spacing={1.5} 
    justifyContent="center" 
    alignItems="flex-start"
  >
        {/* User Growth Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ 
            height: '100%', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            background: isDark ? 'rgba(255,255,255,0.02)' : '#fff',
            border: isDark ? '1px solid rgba(255,255,255,0.05)' : 'none'
          }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 1.5,
                gap: 1
              }}>
                <LineChartIcon color="primary" sx={{ fontSize: 18 }} />
                <Typography variant="h6" color="primary" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  Kullanıcı Büyümesi
                </Typography>
              </Box>
              <Box sx={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statistics?.monthlyUserGrowth || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#eee'} />
                    <XAxis
                      dataKey="monthYear"
                      tick={{ fill: colors.text, fontSize: 10 }}
                    />
                    <YAxis tick={{ fill: colors.text, fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? '#2D3748' : '#fff',
                        borderColor: isDark ? '#4A5568' : '#ddd',
                        borderRadius: 6,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        fontSize: 12
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="userCount"
                      stroke={colors.primary}
                      strokeWidth={2}
                      dot={{ fill: colors.primary, strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Role Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            background: isDark ? 'rgba(255,255,255,0.02)' : '#fff',
            border: isDark ? '1px solid rgba(255,255,255,0.05)' : 'none'
          }}>
            <CardContent sx={{ p: 1.5 }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 1.5,
                gap: 1
              }}>
                <PieChartIcon color="primary" sx={{ fontSize: 18 }} />
                <Typography variant="h6" color="primary" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  Rol Dağılımı
                </Typography>
              </Box>
              <Box sx={{ height: 160, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {roleDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: isDark ? '#2D3748' : '#fff',
                        borderColor: isDark ? '#4A5568' : '#ddd',
                        borderRadius: 6,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        fontSize: 12
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {roleDistributionData.map((item) => (
                  <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                        {item.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>
                      {item.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const ChartsTab = () => (
    <Grid 
    container 
    spacing={1.5} 
    justifyContent="center" 
    alignItems="flex-start"
  >
      {/* Most Commented Movies */}
      <Grid item xs={12} md={6}>
        <Card sx={{ 
          height: '100%', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          background: isDark ? 'rgba(255,255,255,0.02)' : '#fff',
          border: isDark ? '1px solid rgba(255,255,255,0.05)' : 'none'
        }}>
          <CardContent sx={{ p: 1.5 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 1.5,
              gap: 1
            }}>
              <CommentIcon color="secondary" sx={{ fontSize: 18 }} />
              <Typography variant="h6" color="secondary" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                En Çok Yorumlanan Filmler
              </Typography>
            </Box>
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formatChartData(statistics?.mostCommentedMovies, 'commentCount')}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#eee'} />
                  <XAxis
                    dataKey="name"
                    angle={-30}
                    textAnchor="end"
                    height={50}
                    tick={{ fill: colors.text, fontSize: 10 }}
                  />
                  <YAxis tick={{ fill: colors.text, fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: isDark ? '#2D3748' : '#fff',
                      borderColor: isDark ? '#4A5568' : '#ddd',
                      borderRadius: 6,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: 12
                    }}
                  />
                  <Bar dataKey="count" fill={colors.secondary} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Most Favorited Movies */}
      <Grid item xs={12} md={6}>
        <Card sx={{ 
          height: '100%', 
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          background: isDark ? 'rgba(255,255,255,0.02)' : '#fff',
          border: isDark ? '1px solid rgba(255,255,255,0.05)' : 'none'
        }}>
          <CardContent sx={{ p: 1.5 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 1.5,
              gap: 1
            }}>
              <FavoriteIcon color="success" sx={{ fontSize: 18 }} />
              <Typography variant="h6" color="success.main" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                En Çok Favorilenen Filmler
              </Typography>
            </Box>
            <Box sx={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formatChartData(statistics?.mostFavoritedMovies, 'favoriteCount')}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#444' : '#eee'} />
                  <XAxis
                    dataKey="name"
                    angle={-30}
                    textAnchor="end"
                    height={50}
                    tick={{ fill: colors.text, fontSize: 10 }}
                  />
                  <YAxis tick={{ fill: colors.text, fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: isDark ? '#2D3748' : '#fff',
                      borderColor: isDark ? '#4A5568' : '#ddd',
                      borderRadius: 6,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      fontSize: 12
                    }}
                  />
                  <Bar dataKey="count" fill={colors.success} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const ActivityTab = () => (
    <Grid 
    container 
    spacing={1.5} 
    justifyContent="center" 
    alignItems="flex-start"
  >
    {/* Recent Users */}
    <Grid item xs={12} md={5}>
      <Card sx={{ 
        height: '100%',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        background: isDark ? 'rgba(255,255,255,0.02)' : '#fff',
        border: isDark ? '1px solid rgba(255,255,255,0.05)' : 'none'
      }}>
        <CardContent sx={{ p: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, gap: 1 }}>
            <PeopleIcon color="primary" sx={{ fontSize: 18 }} />
            <Typography variant="h6" color="primary" sx={{ fontSize: '1rem', fontWeight: 600 }}>
              Son Kullanıcılar
            </Typography>
          </Box>
          <List sx={{ maxHeight: 300, overflow: 'auto', py: 0 }}>
            {statistics?.recentUsers?.slice(0, 6).map((user, index) => (
              <React.Fragment key={user.id}>
                  <ListItem sx={{
                    px: 1,
                    py: 1,
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      borderRadius: 1
                    }
                  }}>
                    <ListItemAvatar sx={{ minWidth: 36 }}>
                      <Avatar sx={{
                        width: 30,
                        height: 30,
                        bgcolor:
                          user.role === 'ROLE_ADMIN' ? colors.error :
                            user.role === 'ROLE_MODERATOR' ? colors.warning :
                              colors.primary
                      }}>
                        {user.role === 'ROLE_ADMIN' ? <AdminIcon sx={{ fontSize: 16 }} /> :
                          user.role === 'ROLE_MODERATOR' ? <ModeratorIcon sx={{ fontSize: 16 }} /> :
                            <UserIcon sx={{ fontSize: 16 }} />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
                            {user.username}
                          </Typography>
                          <Chip
                            label={user.role === 'ROLE_ADMIN' ? 'Admin' :
                              user.role === 'ROLE_MODERATOR' ? 'Mod' : 'User'}
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.6rem',
                              bgcolor:
                                user.role === 'ROLE_ADMIN' ? `${colors.error}20` :
                                  user.role === 'ROLE_MODERATOR' ? `${colors.warning}20` :
                                    `${colors.primary}20`,
                              color:
                                user.role === 'ROLE_ADMIN' ? colors.error :
                                  user.role === 'ROLE_MODERATOR' ? colors.warning :
                                    colors.primary
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.7rem' }}>
                            {user.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {formatDate(user.createdAt)}
                          </Typography>
                        </Box>
                      }
                      sx={{ my: 0 }}
                    />
                  </ListItem>
                  {index < Math.min(5, (statistics?.recentUsers?.length || 0) - 1) && (
                    <Divider variant="inset" component="li" sx={{ my: 0.5 }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Comments */}
      <Grid item xs={12} md={6}>
        <Card sx={{ 
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          background: isDark ? 'rgba(255,255,255,0.02)' : '#fff',
          border: isDark ? '1px solid rgba(255,255,255,0.05)' : 'none'
        }}>
          <CardContent sx={{ p: 1.5 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 1.5,
              gap: 1
            }}>
              <CommentIcon color="secondary" sx={{ fontSize: 18 }} />
              <Typography variant="h6" color="secondary" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                Son Yorumlar
              </Typography>
            </Box>
            <List sx={{ maxHeight: 300, overflow: 'auto', py: 0 }}>
              {statistics?.recentComments?.slice(0, 5).map((comment, index) => (
                <React.Fragment key={comment.id}>
                  <ListItem sx={{
                    px: 1,
                    py: 1,
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                      borderRadius: 1
                    }
                  }}>
                    <ListItemAvatar sx={{ minWidth: 36 }}>
                      <Avatar sx={{
                        width: 30,
                        height: 30,
                        bgcolor: colors.secondary
                      }}>
                        <MovieIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
                            {comment.username}
                          </Typography>
                          <Chip
                            label={`${movieDetails[comment.imdbId]?.title?.substring(0, 15) || 'Film'}...`}
                            size="small"
                            variant="outlined"
                            color="secondary"
                            sx={{ height: 18, fontSize: '0.6rem' }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              fontSize: '0.7rem'
                            }}
                          >
                            {comment.content}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <TimeIcon sx={{ fontSize: 10, color: colors.text }} />
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                              {formatDate(comment.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      sx={{ my: 0 }}
                    />
                  </ListItem>
                  {index < Math.min(4, (statistics?.recentComments?.length || 0) - 1) && (
                    <Divider variant="inset" component="li" sx={{ my: 0.5 }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: isMobile ? 1 : 1.5, maxWidth: 1600, mx: 'auto' }}>
      {/* Header */}
      <Card sx={{
        mb: 1.5,
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        color: 'white',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        borderRadius: 2
      }}>
        <CardContent sx={{ py: 1.5, px: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 40,
              height: 40,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20
            }}>
              📊
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ fontSize: '1.5rem', mb: 0.5 }}>
                İstatistik Paneli
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.8rem' }}>
                Platform performansı ve kullanım analizleri
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Card sx={{ 
        mb: 1.5, 
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        background: isDark ? 'rgba(255,255,255,0.02)' : '#fff',
        border: isDark ? '1px solid rgba(255,255,255,0.05)' : 'none'
      }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{
            minHeight: 44,
            '& .MuiTab-root': {
              minHeight: 44,
              fontSize: '0.8rem',
              fontWeight: 500,
              py: 1
            },
            '& .Mui-selected': {
              color: colors.primary,
              bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'
            }
          }}
        >
          <Tab
            icon={<TrendingUpIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Genel Bakış"
          />
          <Tab
            icon={<MovieIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Film İstatistikleri"
          />
          <Tab
            icon={<TimeIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Son Aktiviteler"
          />
        </Tabs>
      </Card>

      {/* Tab Content */}
      <Box sx={{ mb: 1.5 }}>
        {activeTab === 0 && <OverviewTab />}
        {activeTab === 1 && <ChartsTab />}
        {activeTab === 2 && <ActivityTab />}
      </Box>

      {/* Summary Footer */}
      <Paper sx={{
        p: 1.5,
        textAlign: 'center',
        bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        border: isDark ? '1px solid rgba(255,255,255,0.05)' : 'none'
      }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors.primary }} />
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              <strong style={{ color: colors.primary }}>{statistics?.totalUsers}</strong> kullanıcı
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors.secondary }} />
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              <strong style={{ color: colors.secondary }}>{statistics?.totalComments}</strong> yorum
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors.success }} />
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              <strong style={{ color: colors.success }}>{statistics?.totalFavorites}</strong> favori
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors.info }} />
            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
              <strong style={{ color: colors.info }}>{statistics?.totalContactMessages}</strong> mesaj
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default StatisticsPage;