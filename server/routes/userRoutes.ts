
import express from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';
const TOKEN_EXPIRY = '30d';

// Helper function to generate JWT token
const generateToken = (userId: string, email: string) => {
  return jwt.sign(
    { id: userId, email },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
};

// Register a new user
router.post('/register', async (req, res) => {
  try {
    console.log('Register route hit with data:', req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.log('Registration missing required fields');
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user with improved error handling
    try {
      const user = await User.create({
        name,
        email,
        password
      });

      console.log('User created successfully with ID:', user._id);

      // Generate JWT token
      const token = generateToken(user._id.toString(), user.email);

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token
      });
    } catch (dbError: any) {
      console.error('Database error during user creation:', dbError);
      
      // Check for validation errors
      if (dbError.name === 'ValidationError') {
        const validationErrors = Object.values(dbError.errors).map((err: any) => err.message);
        return res.status(400).json({ message: 'Validation error', errors: validationErrors });
      }
      
      // Check for duplicate key errors
      if (dbError.code === 11000) {
        return res.status(400).json({ message: 'This email is already in use' });
      }
      
      throw dbError;
    }
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      message: error.message || 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    console.log('Login route hit with data:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Login missing required fields');
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if password is correct
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      console.log('Password does not match for user:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('User logged in successfully:', user._id);

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: error.message || 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    console.log('Profile route hit for user ID:', req.user?.id);
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      console.log('User not found with ID:', req.user.id);
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error: any) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to get user profile',
      error: process.env.NODE_ENV === 'development' ? error : undefined  
    });
  }
});

export const userRouter = router;
