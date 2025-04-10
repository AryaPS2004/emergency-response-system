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

const Register = () => {
  const navigate = useNavigate();
  const { register, error, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      await register(formData.username, formData.email, formData.password);
      navigate('/login');
    } catch (err) {
      console.error('Registration failed:', err);
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
            Register as User
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

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel htmlFor="email">Email</InputLabel>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
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

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel htmlFor="confirmPassword">Confirm Password</InputLabel>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
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
              {isLoading ? <CircularProgress size={24} /> : 'Register'}
            </Button>
          </form>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link href="/login" underline="hover">
                Login here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register; 