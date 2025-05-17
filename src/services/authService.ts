
import api from './api';
import { toast } from 'sonner';

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
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      console.log('Checking if email exists:', email);
      
      // Try to detect if we're offline first
      if (navigator.onLine === false) {
        console.log('Offline mode detected, skipping email check');
        return false;
      }
      
      const response = await api.post('/users/check-email', { email }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Check if the response has the expected format
      if (response.data && typeof response.data.exists === 'boolean') {
        return response.data.exists;
      }
      
      // If the response doesn't have the expected format, assume email doesn't exist
      console.warn('Unexpected response format from check-email endpoint:', response.data);
      return false;
    } catch (error) {
      console.error('Check email API error:', error);
      // If there's an error contacting the server, assume the email doesn't exist
      // to allow guest mode registration
      return false;
    }
  },
  
  async login(data: LoginData): Promise<UserResponse> {
    try {
      console.log('Attempting login with:', { email: data.email });
      
      // Try to detect if we're in offline/guest mode first
      if (navigator.onLine === false) {
        console.log('Offline mode detected');
        throw new Error('Offline mode detected');
      }
      
      const response = await api.post('/users/login', data, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Login response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Login API error:', error);
      
      // Improved error handling with more specific messages
      if (!error.response) {
        // This is likely a network error or invalid response format
        toast.error('Cannot connect to server. Using guest mode instead.');
        throw new Error('Network Error');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Invalid email or password');
      }
      
      if (error.message === 'Invalid response from server' || 
          error.message === 'Invalid response format from server' ||
          error.message === 'Invalid JSON response from server') {
        toast.error('Server returned invalid data. Using guest mode instead.');
        throw new Error('Server returned invalid data. Using guest mode instead.');
      }
      
      throw error;
    }
  },
  
  async register(data: RegisterData): Promise<UserResponse> {
    try {
      console.log('Attempting registration with:', { name: data.name, email: data.email });
      
      // Try to detect if we're in offline/guest mode first
      if (navigator.onLine === false) {
        console.log('Offline mode detected');
        throw new Error('Offline mode detected');
      }
      
      // First check if email already exists
      try {
        const emailExists = await this.checkEmailExists(data.email);
        if (emailExists) {
          toast.error('Email is already registered');
          throw new Error('Email is already registered');
        }
      } catch (error) {
        // If we can't check email existence, proceed with registration anyway
        console.warn('Could not check if email exists:', error);
      }
      
      const response = await api.post('/users/register', data, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Register response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Register API error:', error);
      
      // Improved error handling with more specific messages
      if (!error.response) {
        // This is likely a network error or invalid response format
        toast.error('Cannot connect to server. Using guest mode instead.');
        throw new Error('Network Error');
      }
      
      if (error.response?.status === 400 && error.response.data.message === 'User already exists') {
        toast.error('Email is already registered');
        throw new Error('Email is already registered');
      }
      
      if (error.message === 'Invalid response from server' || 
          error.message === 'Invalid response format from server' ||
          error.message === 'Invalid JSON response from server') {
        toast.error('Server returned invalid data. Using guest mode instead.');
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
