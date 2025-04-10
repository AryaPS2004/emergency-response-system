import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'responder';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const validateToken = async (token: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/validate', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Token validation failed');
      }

      const data = await response.json();
      return data.user;
    } catch (err) {
      console.error('Token validation error:', err);
      return null;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      console.log('Checking stored auth data:', { storedToken, storedUser }); // Debug log
      
      if (storedToken && storedUser) {
        try {
          // Validate token with backend
          const validatedUser = await validateToken(storedToken);
          
          if (validatedUser) {
            console.log('Token validated, setting user:', validatedUser); // Debug log
            setToken(storedToken);
            setUser(validatedUser);
          } else {
            console.log('Token validation failed, clearing stored data'); // Debug log
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (err) {
          console.error('Error validating token:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Attempting login with:', { username }); // Log login attempt
      
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      console.log('Login response status:', response.status); // Log response status

      const data = await response.json();
      console.log('Login response data:', data); // Log response data

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Set user and token in state
      setUser(data.user);
      setToken(data.token);
      
      // Store auth data in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      console.log('Login successful, user:', data.user); // Log successful login
    } catch (err) {
      console.error('Login error:', err); // Log error details
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Attempting registration with:', { username, email }); // Log registration attempt
      
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          email, 
          password,
          role: 'user' // Only allow user registration
        }),
      });

      console.log('Registration response status:', response.status); // Log response status

      const data = await response.json();
      console.log('Registration response data:', data); // Log response data

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // After successful registration, automatically log in
      await login(username, password);
    } catch (err) {
      console.error('Registration error:', err); // Log error details
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('Logging out user:', user); // Log logout
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        isAuthenticated: !!token,
        isLoading,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 