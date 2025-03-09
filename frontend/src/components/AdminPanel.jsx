import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Chip,
  Tabs,
  Tab,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import api from '../services/api';

/**
 * AdminPanel component for managing users and viewing system stats
 */
const AdminPanel = () => {
  // State for users and stats
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);

  // State for user edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    credits: '',
    maxDailyLines: '',
    maxMonthlyTokens: '',
    role: '',
    isRestricted: false
  });

  // State for add credits dialog
  const [addCreditsDialogOpen, setAddCreditsDialogOpen] = useState(false);
  const [addCreditsData, setAddCreditsData] = useState({
    userId: '',
    email: '',
    amount: 1000
  });

  // State for notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Fetch users and stats on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Fetch users and stats
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const usersResponse = await api.get('/api/admin/users');
      setUsers(usersResponse.data.users);

      // Fetch stats
      const statsResponse = await api.get('/api/admin/stats');
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      showNotification('Failed to fetch admin data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open edit dialog for a user
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      credits: user.credits || 0,
      maxDailyLines: user.apiLimits?.maxDailyLines || 1000,
      maxMonthlyTokens: user.apiLimits?.maxMonthlyTokens || 100000,
      role: user.role || 'user',
      isRestricted: user.apiLimits?.isRestricted || false
    });
    setEditDialogOpen(true);
  };

  // Handle edit form input changes
  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Save user edits
  const handleSaveUser = async () => {
    try {
      const response = await api.put(`/api/admin/user/${selectedUser._id}`, {
        credits: parseInt(editFormData.credits, 10),
        maxDailyLines: parseInt(editFormData.maxDailyLines, 10),
        maxMonthlyTokens: parseInt(editFormData.maxMonthlyTokens, 10),
        role: editFormData.role,
        isRestricted: editFormData.isRestricted
      });

      // Update the user in the local state
      setUsers(users.map(user =>
        user._id === selectedUser._id ? { ...user, ...response.data.user } : user
      ));

      setEditDialogOpen(false);
      showNotification('User updated successfully', 'success');
    } catch (error) {
      console.error('Error updating user:', error);
      showNotification('Failed to update user', 'error');
    }
  };

  // Open add credits dialog
  const handleOpenAddCredits = () => {
    setAddCreditsData({
      userId: '',
      email: '',
      amount: 1000
    });
    setAddCreditsDialogOpen(true);
  };

  // Handle add credits form input changes
  const handleAddCreditsChange = (e) => {
    const { name, value } = e.target;
    setAddCreditsData({
      ...addCreditsData,
      [name]: value
    });
  };

  // Add credits to a user
  const handleAddCredits = async () => {
    try {
      const response = await api.post('/api/admin/grant-credits', addCreditsData);

      // Refresh data to show updated credits
      fetchData();

      setAddCreditsDialogOpen(false);
      showNotification(`Added ${response.data.granted} credits successfully`, 'success');
    } catch (error) {
      console.error('Error adding credits:', error);
      showNotification('Failed to add credits', 'error');
    }
  };

  // Show notification
  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  // Close notification
  const handleCloseNotification = () => {
    setNotification({
      ...notification,
      open: false
    });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  // Render loading state
  if (loading && !users.length && !stats) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Admin Panel
        </Typography>
        <Box>
          <Button
            component={Link}
            to="/app"
            variant="outlined"
            sx={{ mr: 2 }}
          >
            Back to App
          </Button>
          <Button
            startIcon={<RefreshIcon />}
            variant="contained"
            onClick={fetchData}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label="Dashboard" />
        <Tab label="Users" />
        <Tab label="Credits" />
      </Tabs>

      {/* Dashboard Tab */}
      {tabValue === 0 && (
        <Box>
          <Grid container spacing={3}>
            {/* Stats Cards */}
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h3">
                    {stats?.totalUsers || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Active Users (30 days)
                  </Typography>
                  <Typography variant="h3">
                    {stats?.activeUsers || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total API Calls
                  </Typography>
                  <Typography variant="h3">
                    {stats?.apiStats?.totalCalls?.toLocaleString() || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Tokens Used
                  </Typography>
                  <Typography variant="h3">
                    {stats?.apiStats?.totalTokens?.toLocaleString() || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Lines Processed
                  </Typography>
                  <Typography variant="h3">
                    {stats?.apiStats?.totalLines?.toLocaleString() || 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Top Users */}
          <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
            Top Users by API Usage
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>API Calls</TableCell>
                  <TableCell>Tokens Used</TableCell>
                  <TableCell>Lines Processed</TableCell>
                  <TableCell>Last Used</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats?.topUsers?.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.apiUsage?.replicate?.totalCalls || 0}</TableCell>
                    <TableCell>{user.apiUsage?.replicate?.totalTokens?.toLocaleString() || 0}</TableCell>
                    <TableCell>{user.apiUsage?.replicate?.totalLines?.toLocaleString() || 0}</TableCell>
                    <TableCell>{formatDate(user.apiUsage?.replicate?.lastUsed)}</TableCell>
                  </TableRow>
                ))}
                {(!stats?.topUsers || stats.topUsers.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No data available</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Users Tab */}
      {tabValue === 1 && (
        <Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Credits</TableCell>
                  <TableCell>API Calls</TableCell>
                  <TableCell>Last Used</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.role || 'user'}
                        color={user.role === 'admin' ? 'primary' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{user.credits || 0}</TableCell>
                    <TableCell>{user.apiUsage?.replicate?.totalCalls || 0}</TableCell>
                    <TableCell>{formatDate(user.apiUsage?.replicate?.lastUsed)}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditUser(user)} size="small">
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">No users found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Credits Tab */}
      {tabValue === 2 && (
        <Box>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddCredits}
            >
              Add Credits
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Current Credits</TableCell>
                  <TableCell>API Limits</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.credits || 0}</TableCell>
                    <TableCell>
                      {user.apiLimits?.isRestricted && (
                        <Chip label="Restricted" color="error" size="small" sx={{ mr: 1 }} />
                      )}
                      <Typography variant="body2">
                        Max Daily: {user.apiLimits?.maxDailyLines || 1000}
                      </Typography>
                      <Typography variant="body2">
                        Max Monthly: {user.apiLimits?.maxMonthlyTokens?.toLocaleString() || 100000}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditUser(user)} size="small">
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No users found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              {selectedUser?.name || 'N/A'} ({selectedUser?.email})
            </Typography>

            <TextField
              margin="dense"
              name="credits"
              label="Credits"
              type="number"
              fullWidth
              value={editFormData.credits}
              onChange={handleEditFormChange}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              name="role"
              label="Role"
              select
              fullWidth
              value={editFormData.role}
              onChange={handleEditFormChange}
              sx={{ mb: 2 }}
              SelectProps={{
                native: true,
              }}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </TextField>

            <TextField
              margin="dense"
              name="maxDailyLines"
              label="Max Daily Lines"
              type="number"
              fullWidth
              value={editFormData.maxDailyLines}
              onChange={handleEditFormChange}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              name="maxMonthlyTokens"
              label="Max Monthly Tokens"
              type="number"
              fullWidth
              value={editFormData.maxMonthlyTokens}
              onChange={handleEditFormChange}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Restrict API Access:
              </Typography>
              <input
                type="checkbox"
                name="isRestricted"
                checked={editFormData.isRestricted}
                onChange={handleEditFormChange}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveUser} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Add Credits Dialog */}
      <Dialog open={addCreditsDialogOpen} onClose={() => setAddCreditsDialogOpen(false)}>
        <DialogTitle>Add Credits</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              margin="dense"
              name="email"
              label="User Email"
              type="email"
              fullWidth
              value={addCreditsData.email}
              onChange={handleAddCreditsChange}
              sx={{ mb: 2 }}
            />

            <TextField
              margin="dense"
              name="amount"
              label="Amount"
              type="number"
              fullWidth
              value={addCreditsData.amount}
              onChange={handleAddCreditsChange}
              sx={{ mb: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddCreditsDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddCredits} variant="contained">Add Credits</Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPanel;
