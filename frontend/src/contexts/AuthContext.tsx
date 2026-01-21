import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  type?: 'user' | 'admin';
  kycStatus?: string;
  status?: string;
  accountTier?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, isAdmin?: boolean) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  }) => Promise<void>;
  logout: () => void;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth on mount
    const restoreAuth = async () => {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('accessToken');
      
      if (storedUser && storedToken) {
        try {
          // Restore user immediately for faster UI
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Verify token is still valid by fetching user profile
          try {
            let userData;
            if (parsedUser.type === 'admin') {
              // Admin users should use admin endpoint
              userData = await api.admin.getMe();
            } else {
              // Regular users use user endpoint
              userData = await api.users.getMe();
            }
            const updatedUser = {
              ...userData,
              type: parsedUser.type || 'user',
              role: parsedUser.role || 'client',
            };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          } catch (error) {
            // Token is invalid, clear storage
            console.error('Token validation failed:', error);
            setUser(null);
            localStorage.removeItem('user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        } catch (error) {
          // Invalid stored user data
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setLoading(false);
    };
    
    restoreAuth();
  }, []);

  const login = async (email: string, password: string, isAdmin = false) => {
    try {
      const response = isAdmin
        ? await api.auth.adminLogin(email, password)
        : await api.auth.login(email, password);

      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Store user data
      const userData = {
        ...response.user,
        type: isAdmin ? 'admin' : 'user',
        role: response.user.role || (isAdmin ? 'admin' : 'client'),
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || 'Login failed');
      }
      throw error;
    }
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: string;
    address?: string;
    city?: string;
    country?: string;
    postalCode?: string;
  }) => {
    try {
      const response = await api.auth.register(data);

      // Store tokens
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);

      // Store user data
      const userData = {
        ...response.user,
        type: 'user',
        role: 'client',
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message || 'Registration failed');
      }
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await api.users.getMe();
      const updatedUser = {
        ...userData,
        type: user?.type || 'user',
        role: user?.role || 'client',
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      // If refresh fails, logout user
      logout();
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        loading,
        refreshUser,
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
