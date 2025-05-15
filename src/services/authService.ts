
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
    const response = await api.post('/users/login', data);
    return response.data;
  },
  
  async register(data: RegisterData): Promise<UserResponse> {
    const response = await api.post('/users/register', data);
    return response.data;
  },
  
  async getProfile(): Promise<UserResponse> {
    const response = await api.get('/users/profile');
    return response.data;
  }
};
