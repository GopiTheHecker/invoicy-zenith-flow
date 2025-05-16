
import api from './api';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface UserResponse {
  _id: string;
  name: string;
  email: string;
  token: string;
}

export const authService = {
  async login(data: LoginData): Promise<UserResponse> {
    try {
      console.log('Attempting login with:', { email: data.email });
      const response = await api.post('/users/login', data);
      console.log('Login response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Login API error:', error);
      
      // Improved error handling with more specific messages
      if (!error.response) {
        throw new Error('Network Error');
      }
      
      if (error.response.status === 401) {
        throw new Error('Invalid email or password');
      }
      
      throw error;
    }
  },
  
  async register(data: RegisterData): Promise<UserResponse> {
    try {
      console.log('Attempting registration with:', { name: data.name, email: data.email });
      const response = await api.post('/users/register', data);
      console.log('Register response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Register API error:', error);
      
      // Improved error handling with more specific messages
      if (!error.response) {
        throw new Error('Network Error');
      }
      
      if (error.response.status === 400 && error.response.data.message === 'User already exists') {
        throw new Error('Email is already registered');
      }
      
      throw error;
    }
  },
  
  async getProfile(): Promise<UserResponse> {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Get profile API error:', error);
      throw error;
    }
  }
};
