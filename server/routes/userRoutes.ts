
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

// Check if email exists
router.post('/check-email', async (req, res) => {
  try {
    console.log('Check email route hit with:', req.body);
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    
    // Ensure we set the Content-Type header
    res.setHeader('Content-Type', 'application/json');
    
    return res.json({ 
      exists: !!user 
    });
  } catch (error: any) {
    console.error('Check email error:', error);
    
    // Ensure we set the Content-Type header
    res.setHeader('Content-Type', 'application/json');
    
    return res.status(500).json({ 
      message: error.message || 'Failed to check email',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Register a new user
router.post('/register', async (req, res) => {
  try {
    console.log('Register route hit with data:', req.body);
    const { 
      name, 
      email, 
      password, 
      companyName,
      gstNumber,
      contactPerson,
      mobileNumber
    } = req.body;

    if (!name || !email || !password || !companyName) {
      console.log('Registration missing required fields');
      
      // Ensure we set the Content-Type header
      res.setHeader('Content-Type', 'application/json');
      
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log('User already exists with email:', email);
      
      // Ensure we set the Content-Type header
      res.setHeader('Content-Type', 'application/json');
      
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user with improved error handling
    try {
      const user = await User.create({
        name,
        email,
        password,
        companyName,
        gstNumber,
        contactPerson,
        mobileNumber
      });

      console.log('User created successfully with ID:', user._id);

      // Generate JWT token
      const token = generateToken(user._id.toString(), user.email);
      
      // Ensure we set the Content-Type header
      res.setHeader('Content-Type', 'application/json');

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        companyName: user.companyName,
        gstNumber: user.gstNumber,
        contactPerson: user.contactPerson,
        mobileNumber: user.mobileNumber,
        token
      });
    } catch (dbError: any) {
      console.error('Database error during user creation:', dbError);
      
      // Ensure we set the Content-Type header
      res.setHeader('Content-Type', 'application/json');
      
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
    
    // Ensure we set the Content-Type header
    res.setHeader('Content-Type', 'application/json');
    
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
      
      // Ensure we set the Content-Type header
      res.setHeader('Content-Type', 'application/json');
      
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found with email:', email);
      
      // Ensure we set the Content-Type header
      res.setHeader('Content-Type', 'application/json');
      
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if password is correct
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      console.log('Password does not match for user:', email);
      
      // Ensure we set the Content-Type header
      res.setHeader('Content-Type', 'application/json');
      
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('User logged in successfully:', user._id);

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email);

    // Set explicit Content-Type header
    res.setHeader('Content-Type', 'application/json');
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      companyName: user.companyName,
      gstNumber: user.gstNumber,
      contactPerson: user.contactPerson,
      mobileNumber: user.mobileNumber,
      bankDetails: user.bankDetails || null,
      token
    });
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Ensure we set the Content-Type header
    res.setHeader('Content-Type', 'application/json');
    
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
      
      // Ensure we set the Content-Type header
      res.setHeader('Content-Type', 'application/json');
      
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Ensure we set the Content-Type header
    res.setHeader('Content-Type', 'application/json');
    
    res.json(user);
  } catch (error: any) {
    console.error('Profile error:', error);
    
    // Ensure we set the Content-Type header
    res.setHeader('Content-Type', 'application/json');
    
    res.status(500).json({ 
      message: error.message || 'Failed to get user profile',
      error: process.env.NODE_ENV === 'development' ? error : undefined  
    });
  }
});

// Update user bank details
router.put('/bank-details', authMiddleware, async (req, res) => {
  try {
    const { accountName, accountNumber, ifscCode, bankName } = req.body;
    
    if (!accountName || !accountNumber || !ifscCode || !bankName) {
      // Ensure we set the Content-Type header
      res.setHeader('Content-Type', 'application/json');
      
      return res.status(400).json({ message: 'Please provide all bank details' });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { 
        bankDetails: { 
          accountName, 
          accountNumber, 
          ifscCode, 
          bankName 
        } 
      },
      { new: true }
    ).select('-password');
    
    if (!updatedUser) {
      // Ensure we set the Content-Type header
      res.setHeader('Content-Type', 'application/json');
      
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Ensure we set the Content-Type header
    res.setHeader('Content-Type', 'application/json');
    
    res.json(updatedUser);
  } catch (error: any) {
    console.error('Update bank details error:', error);
    
    // Ensure we set the Content-Type header
    res.setHeader('Content-Type', 'application/json');
    
    res.status(500).json({ 
      message: error.message || 'Failed to update bank details',
      error: process.env.NODE_ENV === 'development' ? error : undefined  
    });
  }
});

export const userRouter = router;
