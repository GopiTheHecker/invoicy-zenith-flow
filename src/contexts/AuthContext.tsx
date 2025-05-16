
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from "sonner";
import { authService } from '@/services/authService';

type User = {
  id: string;
  email: string;
  name: string;
};

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          // Handle potential JSON parse error
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Special handling for guest login
      if (email === 'guest@example.com' && password === 'guest123') {
        // Create guest user data without backend call
        const guestUserData: User = {
          id: 'guest-user-id',
          email: 'guest@example.com',
          name: 'Guest User'
        };
        
        // Set to localStorage
        localStorage.setItem('user', JSON.stringify(guestUserData));
        localStorage.setItem('token', 'guest-token');
        
        // Update state
        setUser(guestUserData);
        
        toast.success("Logged in as Guest");
        return true;
      }
      
      // Regular login flow
      const response = await authService.login({ email, password });
      
      if (!response || !response._id) {
        throw new Error("Invalid response from server");
      }
      
      // Save to state and localStorage
      const userData: User = {
        id: response._id,
        email: response.email,
        name: response.name
      };
      
      // First update localStorage to ensure data is persisted
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', response.token);
      
      // Then update state
      setUser(userData);
      
      toast.success("Logged in successfully!");
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = 
        error.response?.data?.message || 
        (error.message === 'Network Error' ? 
          'Cannot connect to server. Please try again later.' : 
          "Login failed. Please check your credentials and try again.");
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await authService.register({ name, email, password });
      
      if (!response || !response._id) {
        throw new Error("Invalid response from server");
      }
      
      // Save to state and localStorage
      const userData: User = {
        id: response._id,
        email: response.email,
        name: response.name
      };
      
      // First update localStorage to ensure data is persisted
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', response.token);
      
      // Then update state
      setUser(userData);
      
      toast.success("Account created successfully!");
      return true;
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage = 
        error.response?.data?.message || 
        (error.message === 'Network Error' ? 
          'Cannot connect to server. Please try again later.' : 
          "Registration failed. Please try again.");
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    toast.info("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
