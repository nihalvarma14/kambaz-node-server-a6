import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import connectDB from './db.js';
import usersRoutes from './routes/users.js';
import coursesRoutes from './routes/courses.js';
import modulesRoutes from './routes/modules.js';
import assignmentsRoutes from './routes/assignments.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// CORS Configuration - Allow multiple Vercel URLs
const allowedOrigins = [
  'http://localhost:3000',
  'https://kambaz-next-js-fqd8-git-a6-nihalvarma14s-projects.vercel.app',
  'https://kambaz-next-js-fqd8-mmcw6tyd4-nihalvarma14s-projects.vercel.app',
  'https://kambaz-next-js-fqd8.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches vercel.app domain
    if (allowedOrigins.some(allowed => origin.includes(allowed)) || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      console.log('❌ Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

// Handle preflight
app.options('*', cors());

app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true, // Required for cross-domain
    httpOnly: true,
    sameSite: 'none', // Required for cross-domain
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// Routes
app.use('/api/users', usersRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/modules', modulesRoutes);
app.use('/api/assignments', assignmentsRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'Kambaz API Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 Allowed origins:`, allowedOrigins);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});