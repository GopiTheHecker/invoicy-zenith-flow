
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { userRouter } from './routes/userRoutes';
import { invoiceRouter } from './routes/invoiceRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vichusci:GOPIVAII@cluster0.epz6g.mongodb.net/invoice-app';

// Ensure proper CORS headers for all environments
app.use(cors({
  origin: '*', // Allow all origins for development and preview
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Increase JSON limit for base64 encoded images
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    
    return originalSend.call(this, body);
  };
  
  next();
});

// Handle preflight OPTIONS requests properly
app.options('*', cors());

// CRITICAL: Set Content-Type header for all API routes
// This must come BEFORE route handlers
app.use('/api', (req, res, next) => {
  res.header('Content-Type', 'application/json');
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

// Routes - ensure they have /api prefix
app.use('/api/users', userRouter);
app.use('/api/invoices', invoiceRouter);

// Fix for HTML page being returned from invalid routes
// Add catchall for API routes to return JSON instead of HTML
app.all('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// IMPORTANT: Static file serving must come AFTER all API routes
// Serve static files from the React app if in production
if (process.env.NODE_ENV === 'production') {
  const clientBuildPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(clientBuildPath));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Connect to MongoDB with improved error handling
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
    console.log('Database name:', mongoose.connection.name);
    
    // Start server only after successful database connection
    startServer();
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    console.log('Starting server anyway to allow frontend development with localStorage');
    
    // Start server even without DB connection
    startServer();
  });

function startServer() {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API base URL: http://localhost:${PORT}/api`);
  });
}

// Global error handler - Always return JSON responses
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // For API routes, ensure response is always JSON
  if (req.url.startsWith('/api/')) {
    res.status(500).json({ 
      message: 'Something went wrong on the server',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } else {
    // For non-API routes, continue with default error handling
    next(err);
  }
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
