
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
      const response = await api.post('/users/login', data);
      return response.data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },
  
  async register(data: RegisterData): Promise<UserResponse> {
    try {
      const response = await api.post('/users/register', data);
      return response.data;
    } catch (error) {
      console.error('Register API error:', error);
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
