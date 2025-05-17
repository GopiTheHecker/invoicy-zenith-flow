
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

interface BankDetails {
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

interface UserResponse {
  _id: string;
  name: string;
  email: string;
  token: string;
  bankDetails?: BankDetails;
}

export const authService = {
  async login(data: LoginData): Promise<UserResponse> {
    try {
      console.log('Attempting login with:', { email: data.email });
      
      // Check connection first with a timeout
      const response = await api.post('/users/login', data, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        transformResponse: [(data) => {
          // Handle HTML responses (which indicate an error in the API)
          if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
            throw new Error('Invalid response format from server');
          }
          try {
            return JSON.parse(data);
          } catch (e) {
            console.error('Error parsing response:', e);
            throw new Error('Invalid response from server');
          }
        }]
      });
      
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
      
      if (error.message === 'Invalid response from server' || 
          error.message === 'Invalid response format from server') {
        throw new Error('Server returned invalid data. Using guest mode instead.');
      }
      
      throw error;
    }
  },
  
  async register(data: RegisterData): Promise<UserResponse> {
    try {
      console.log('Attempting registration with:', { name: data.name, email: data.email });
      
      const response = await api.post('/users/register', data, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        transformResponse: [(data) => {
          // Handle HTML responses (which indicate an error in the API)
          if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
            throw new Error('Invalid response format from server');
          }
          try {
            return JSON.parse(data);
          } catch (e) {
            console.error('Error parsing response:', e);
            throw new Error('Invalid response from server');
          }
        }]
      });
      
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
      
      if (error.message === 'Invalid response from server' || 
          error.message === 'Invalid response format from server') {
        throw new Error('Server returned invalid data. Using guest mode instead.');
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
  },
  
  async updateBankDetails(bankDetails: BankDetails): Promise<UserResponse> {
    try {
      const response = await api.put('/users/bank-details', bankDetails);
      return response.data;
    } catch (error) {
      console.error('Update bank details API error:', error);
      throw error;
    }
  }
};
