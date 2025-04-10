import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import Login from './pages/Login';
import Register from './pages/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ResponderDashboard from './pages/ResponderDashboard';
import { EmergencyProvider } from './context/EmergencyContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// Protected Route component
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles: string[];
}> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  console.log('ProtectedRoute:', { user, isAuthenticated, isLoading, allowedRoles }); // Debug log

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    console.log('Not authenticated, redirecting to login'); // Debug log
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    console.log('Role not allowed, redirecting to login'); // Debug log
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  console.log('AppRoutes:', { user }); // Debug log

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route
        path="/user"
        element={
          <ProtectedRoute allowedRoles={['user']}>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/responder"
        element={
          <ProtectedRoute allowedRoles={['responder']}>
            <ResponderDashboard />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/"
        element={
          user ? (
            <Navigate
              to={
                user.role === 'admin'
                  ? '/admin'
                  : user.role === 'responder'
                  ? '/responder'
                  : '/user'
              }
            />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <EmergencyProvider>
          <Router>
            <AppRoutes />
          </Router>
        </EmergencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
