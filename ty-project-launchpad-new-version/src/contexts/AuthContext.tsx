import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { authApi, UserResponse } from '@/lib/api';
import api from '@/lib/api';

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password:string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    console.log('[Auth] loadUser called');
    const token = localStorage.getItem('token');
    console.log('[Auth] Token in localStorage:', token ? 'exists' : 'not found');
    
    if (!token) {
      console.log('[Auth] No token found, setting user to null');
      setIsLoading(false);
      setUser(null);
      return;
    }

    try {
      console.log('[Auth] Setting up auth header with token');
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      console.log('[Auth] Fetching user data...');
      const userData = await authApi.getMe();
      console.log('[Auth] User data loaded successfully:', userData);
      
      setUser(userData);
      console.log('[Auth] User state updated');
    } catch (error) {
      console.error('[Auth] Failed to load user:', error);
      console.log('[Auth] Cleaning up invalid token...');
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
    } finally {
      console.log('[Auth] Setting isLoading to false');
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    console.log('[Auth] Login attempt started for email:', email);
    try {
      setIsLoading(true);
      console.log('[Auth] Loading state set to true');
      
      // Clear any existing token before login attempt
      console.log('[Auth] Clearing any existing token');
      localStorage.removeItem('token');
      
      console.log('[Auth] Making login API call...');
      const { access_token } = await authApi.login({ email, password });
      console.log('[Auth] Login successful, access token received');
      
      // Store the token
      console.log('[Auth] Storing token in localStorage');
      localStorage.setItem('token', access_token);
      
      // Set the default authorization header
      console.log('[Auth] Setting up auth header with new token');
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Force update the user data
      console.log('[Auth] Fetching user data...');
      const userData = await authApi.getMe();
      console.log('[Auth] User data after login:', userData);
      
      // Set the user and mark as authenticated
      console.log('[Auth] Updating user state');
      setUser(userData);
      
      console.log('[Auth] Login process completed successfully');
      return true;
    } catch (error) {
      console.error('[Auth] Login error:', error);
      // Clean up on error
      console.log('[Auth] Cleaning up after login error');
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      throw error;
    } finally {
      console.log('[Auth] Setting loading state to false');
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    console.log('[Auth] Logging out user');
    console.log('[Auth] Removing token from localStorage');
    localStorage.removeItem('token');
    console.log('[Auth] Removing auth header');
    delete api.defaults.headers.common['Authorization'];
    console.log('[Auth] Setting user to null');
    setUser(null);
    console.log('[Auth] Logout completed');
  }, []);

  // Listen for storage events to handle logout from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && !e.newValue) {
        console.log('Token removed from storage, logging out');
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  }), [user, isLoading, login, logout]);

  console.log('[Auth] Context updated:', { 
    hasUser: !!user, 
    isLoading,
    token: localStorage.getItem('token') ? 'exists' : 'not found'
  });

  return (
    <AuthContext.Provider value={contextValue}>
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
