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
    primary: isDark ? '#6366f1' : '#6366f1',
    secondary: isDark ? '#f59e0b' : '#f59e0b',
    success: isDark ? '#10b981' : '#10b981',
    info: isDark ? '#06b6d4' : '#06b6d4',
    warning: isDark ? '#f59e0b' : '#f59e0b',
    error: isDark ? '#ef4444' : '#ef4444',
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
        gap: 3,
        p: isMobile ? 1 : 3,
        maxWidth: 1600,
        mx: 'auto'
      }}>
        <Grid container spacing={3}>
          {Array.from({ length: 4 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={350} sx={{ borderRadius: 2 }} />
        <Grid container spacing={3}>
          {Array.from({ length: 2 }).map((_, index) => (
            <Grid item xs={12} md={6} key={index}>
              <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
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
      borderLeft: `4px solid ${color}`,
      boxShadow: theme.shadows[2],
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: theme.shadows[4]
      }
    }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight="bold" color={color}>
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
            width: 40,
            height: 40
          }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  const OverviewTab = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Summary Cards - İki üstte, iki altta */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={6}>
          <StatCard
            title="Toplam Kullanıcı"
            value={statistics?.totalUsers}
            icon={<PeopleIcon sx={{ fontSize: 20 }} />}
            color={colors.primary}
            trend="+12%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <StatCard
            title="Toplam Yorum"
            value={statistics?.totalComments}
            icon={<CommentIcon sx={{ fontSize: 20 }} />}
            color={colors.secondary}
            trend="+8%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <StatCard
            title="Toplam Favori"
            value={statistics?.totalFavorites}
            icon={<FavoriteIcon sx={{ fontSize: 20 }} />}
            color={colors.success}
            trend="+15%"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <StatCard
            title="İletişim Mesajı"
            value={statistics?.totalContactMessages}
            icon={<EmailIcon sx={{ fontSize: 20 }} />}
            color={colors.info}
            trend="+5%"
          />
        </Grid>
      </Grid>

      {/* Charts Row - Tam genişlikte alt alta */}
      <Grid container spacing={2}>
        {/* User Growth Chart */}
        <Grid item xs={12} md={12}>
          <Card sx={{ height: '100%', boxShadow: theme.shadows[2] }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2,
                gap: 1
              }}>
                <LineChartIcon color="primary" sx={{ fontSize: 20 }} />
                <Typography variant="h6" color="primary">
                  Kullanıcı Büyümesi
                </Typography>
              </Box>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={statistics?.monthlyUserGrowth || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#555' : '#eee'} />
                    <XAxis
                      dataKey="monthYear"
                      tick={{ fill: colors.text, fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: colors.text, fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        background: isDark ? theme.palette.background.paper : '#fff',
                        borderColor: isDark ? '#555' : '#ddd',
                        borderRadius: 8,
                        boxShadow: theme.shadows[3]
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="userCount"
                      stroke={colors.primary}
                      strokeWidth={3}
                      dot={{ fill: colors.primary, strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Role Distribution */}
        <Grid item xs={12} md={12}>
          <Card sx={{ height: '100%', boxShadow: theme.shadows[2] }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                mb: 2,
                gap: 1
              }}>
                <PieChartIcon color="primary" sx={{ fontSize: 20 }} />
                <Typography variant="h6" color="primary">
                  Rol Dağılımı
                </Typography>
              </Box>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={roleDistributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {roleDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: isDark ? theme.palette.background.paper : '#fff',
                        borderColor: isDark ? '#555' : '#ddd',
                        borderRadius: 8,
                        boxShadow: theme.shadows[2]
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {roleDistributionData.map((item) => (
                  <Box key={item.name} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
                      <Typography variant="body2" color="text.secondary">
                        {item.name}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="bold">
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
    <Grid container spacing={2}>
      {/* Most Commented Movies */}
      <Grid item xs={12} md={12}>
        <Card sx={{ height: '100%', boxShadow: theme.shadows[2] }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 2,
              gap: 1
            }}>
              <CommentIcon color="secondary" sx={{ fontSize: 20 }} />
              <Typography variant="h6" color="secondary">
                En Çok Yorumlanan Filmler
              </Typography>
            </Box>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formatChartData(statistics?.mostCommentedMovies, 'commentCount')}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#555' : '#eee'} />
                  <XAxis
                    dataKey="name"
                    angle={-30}
                    textAnchor="end"
                    height={60}
                    tick={{ fill: colors.text, fontSize: 10 }}
                  />
                  <YAxis tick={{ fill: colors.text, fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: isDark ? theme.palette.background.paper : '#fff',
                      borderColor: isDark ? '#555' : '#ddd',
                      borderRadius: 8,
                      boxShadow: theme.shadows[2]
                    }}
                  />
                  <Bar dataKey="count" fill={colors.secondary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Most Favorited Movies */}
      <Grid item xs={12} md={12}>
        <Card sx={{ height: '100%', boxShadow: theme.shadows[2] }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 2,
              gap: 1
            }}>
              <FavoriteIcon color="success" sx={{ fontSize: 20 }} />
              <Typography variant="h6" color="success.main">
                En Çok Favorilenen Filmler
              </Typography>
            </Box>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={formatChartData(statistics?.mostFavoritedMovies, 'favoriteCount')}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#555' : '#eee'} />
                  <XAxis
                    dataKey="name"
                    angle={-30}
                    textAnchor="end"
                    height={60}
                    tick={{ fill: colors.text, fontSize: 10 }}
                  />
                  <YAxis tick={{ fill: colors.text, fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: isDark ? theme.palette.background.paper : '#fff',
                      borderColor: isDark ? '#555' : '#ddd',
                      borderRadius: 8,
                      boxShadow: theme.shadows[2]
                    }}
                  />
                  <Bar dataKey="count" fill={colors.success} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const ActivityTab = () => (
    <Grid container spacing={2}>
      {/* Recent Users */}
      <Grid item xs={12} md={12}>
        <Card sx={{ boxShadow: theme.shadows[2] }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 2,
              gap: 1
            }}>
              <PeopleIcon color="primary" sx={{ fontSize: 20 }} />
              <Typography variant="h6" color="primary">
                Son Kullanıcılar
              </Typography>
            </Box>
            <List sx={{ maxHeight: 320, overflow: 'auto', py: 0 }}>
              {statistics?.recentUsers?.slice(0, 6).map((user, index) => (
                <React.Fragment key={user.id}>
                  <ListItem sx={{
                    px: 1,
                    py: 1.5,
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      backgroundColor: isDark ? 'grey.800' : 'grey.50',
                      borderRadius: 1
                    }
                  }}>
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar sx={{
                        width: 32,
                        height: 32,
                        bgcolor:
                          user.role === 'ROLE_ADMIN' ? colors.error :
                            user.role === 'ROLE_MODERATOR' ? colors.warning :
                              colors.primary
                      }}>
                        {user.role === 'ROLE_ADMIN' ? <AdminIcon sx={{ fontSize: 18 }} /> :
                          user.role === 'ROLE_MODERATOR' ? <ModeratorIcon sx={{ fontSize: 18 }} /> :
                            <UserIcon sx={{ fontSize: 18 }} />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="body2" fontWeight="medium">
                            {user.username}
                          </Typography>
                          <Chip
                            label={user.role === 'ROLE_ADMIN' ? 'Admin' :
                              user.role === 'ROLE_MODERATOR' ? 'Mod' : 'User'}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
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
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {user.email}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
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
      <Grid item xs={12} md={12}>
        <Card sx={{ boxShadow: theme.shadows[2] }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 2,
              gap: 1
            }}>
              <CommentIcon color="secondary" sx={{ fontSize: 20 }} />
              <Typography variant="h6" color="secondary">
                Son Yorumlar
              </Typography>
            </Box>
            <List sx={{ maxHeight: 320, overflow: 'auto', py: 0 }}>
              {statistics?.recentComments?.slice(0, 5).map((comment, index) => (
                <React.Fragment key={comment.id}>
                  <ListItem sx={{
                    px: 1,
                    py: 1.5,
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      backgroundColor: isDark ? 'grey.800' : 'grey.50',
                      borderRadius: 1
                    }
                  }}>
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <Avatar sx={{
                        width: 32,
                        height: 32,
                        bgcolor: colors.secondary
                      }}>
                        <MovieIcon sx={{ fontSize: 18 }} />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <Typography variant="body2" fontWeight="medium">
                            {comment.username}
                          </Typography>
                          <Chip
                            label={`${movieDetails[comment.imdbId]?.title?.substring(0, 15) || 'Film'}...`}
                            size="small"
                            variant="outlined"
                            color="secondary"
                            sx={{ height: 20, fontSize: '0.65rem' }}
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
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {comment.content}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <TimeIcon sx={{ fontSize: 12, color: colors.text }} />
                            <Typography variant="caption" color="text.secondary">
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
    <Box sx={{ p: isMobile ? 1 : 2, maxWidth: 1600, mx: 'auto' }}>
      {/* Header */}
      <Card sx={{
        mb: 2,
        background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        color: 'white',
        boxShadow: theme.shadows[4],
        borderRadius: 2
      }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 48,
              height: 48,
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24
            }}>
              📊
            </Box>
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                İstatistik Paneli
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Platform performansı ve kullanım analizleri
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Card sx={{ mb: 2, boxShadow: theme.shadows[2] }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTab-root': {
              minHeight: 48,
              fontSize: '0.875rem',
              fontWeight: 500
            },
            '& .Mui-selected': {
              color: colors.primary,
              bgcolor: isDark ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'
            }
          }}
        >
          <Tab
            icon={<TrendingUpIcon />}
            iconPosition="start"
            label="Genel Bakış"
            sx={{ fontSize: '0.875rem' }}
          />
          <Tab
            icon={<MovieIcon />}
            iconPosition="start"
            label="Film İstatistikleri"
            sx={{ fontSize: '0.875rem' }}
          />
          <Tab
            icon={<TimeIcon />}
            iconPosition="start"
            label="Son Aktiviteler"
            sx={{ fontSize: '0.875rem' }}
          />
        </Tabs>
      </Card>

      {/* Tab Content */}
      <Box sx={{ mb: 2 }}>
        {activeTab === 0 && <OverviewTab />}
        {activeTab === 1 && <ChartsTab />}
        {activeTab === 2 && <ActivityTab />}
      </Box>

      {/* Summary Footer */}
      <Paper sx={{
        p: 2,
        textAlign: 'center',
        bgcolor: isDark ? 'grey.800' : 'grey.50',
        borderRadius: 2,
        boxShadow: theme.shadows[1]
      }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors.primary }} />
            <Typography variant="body2">
              <strong style={{ color: colors.primary }}>{statistics?.totalUsers}</strong> kullanıcı
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors.secondary }} />
            <Typography variant="body2">
              <strong style={{ color: colors.secondary }}>{statistics?.totalComments}</strong> yorum
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors.success }} />
            <Typography variant="body2">
              <strong style={{ color: colors.success }}>{statistics?.totalFavorites}</strong> favori
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: colors.info }} />
            <Typography variant="body2">
              <strong style={{ color: colors.info }}>{statistics?.totalContactMessages}</strong> mesaj
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default StatisticsPage;