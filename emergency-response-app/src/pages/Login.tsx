import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  FormControl,
  InputLabel,
  Input,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login, error, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.username, formData.password);
      // Get the user's role and navigate accordingly
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Login successful, navigating based on role:', user.role); // Debug log
      
      switch (user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'responder':
          navigate('/responder');
          break;
        case 'user':
          navigate('/user');
          break;
        default:
          console.error('Unknown role:', user.role);
          navigate('/login');
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Emergency Response System
          </Typography>
          <Typography variant="h6" gutterBottom align="center" color="text.secondary">
            Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel htmlFor="username">Username</InputLabel>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel htmlFor="password">Password</InputLabel>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </form>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Don't have an account?{' '}
              <Link href="/register" underline="hover">
                Register here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 