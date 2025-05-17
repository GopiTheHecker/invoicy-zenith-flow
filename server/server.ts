
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { userRouter } from './routes/userRoutes';
import { invoiceRouter } from './routes/invoiceRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vichusci:GOPIVAII@cluster0.epz6g.mongodb.net/invoice-app';

// Middleware - Expanded CORS settings to ensure frontend connection works
app.use(cors({
  origin: '*', // Allow all origins for development and preview environments
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase JSON limit for base64 encoded images
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add Content-Type response header to ensure proper JSON responses
app.use((req, res, next) => {
  res.header('Content-Type', 'application/json');
  next();
});

// Add logging middleware for debugging requests
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Request started`);
  
  // Skip logging for large request bodies (like images)
  if (req.body && JSON.stringify(req.body).length < 1000) {
    console.log('Request Headers:', req.headers);
    console.log('Request Body:', req.body);
  } else {
    console.log('Request Headers:', req.headers);
    console.log('Request Body: [Large body, not logged]');
  }
  
  // Capture and log response
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Response status: ${res.statusCode} - Duration: ${duration}ms`);
    
    // Log response body only if it's not too large
    if (body && typeof body === 'string' && body.length < 1000) {
      console.log('Response body:', body);
    } else {
      console.log('Response body: [Large response, not logged]');
    }
    
    // Make sure Content-Type is set to application/json, overriding any other settings
    res.header('Content-Type', 'application/json');
    
    return originalSend.call(this, body);
  };
  
  next();
});

// Wrap all route handlers in try-catch to prevent HTML error responses
const wrapAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Simple health check endpoint
app.get('/health', wrapAsync(async (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
}));

// Add API status check endpoint
app.get('/api/status', wrapAsync(async (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'API is running',
    timestamp: new Date().toISOString(),
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
}));

// Routes
app.use('/api/users', userRouter);
app.use('/api/invoices', invoiceRouter);

// Connect to MongoDB with improved error handling
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    console.log('Database name:', mongoose.connection.name);
    
    // Start server only after successful database connection
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    console.log('Starting server anyway to allow frontend development with localStorage');
    
    // Start server even without DB connection to allow frontend development
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (without DB connection)`);
    });
  });

// Global error handler - Always return JSON responses
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Ensure response is always JSON
  res.status(500).json({ 
    message: 'Something went wrong on the server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
