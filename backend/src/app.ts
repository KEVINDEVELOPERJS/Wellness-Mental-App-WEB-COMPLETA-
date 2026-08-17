import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

// Import middleware
import { auditLog } from './middleware/auditMiddleware';
import { errorHandler, notFound } from './middleware/errorHandler';
import { apiRateLimit } from './middleware/rateLimitMiddleware';

// Import routes
import authRoutes from './routes/auth.routes';
import evaluacionRoutes from './routes/evaluacion.routes';
import chatRoutes from './routes/chat.routes';
import ejercicioRoutes from './routes/ejercicio.routes';
import comunidadRoutes from './routes/comunidad.routes';
import gamificacionRoutes from './routes/gamificacion.routes';
import informeRoutes from './routes/informe.routes';
import alertaRoutes from './routes/alerta.routes';
import perfilRoutes from './routes/perfil.routes';

// Import services
import { SocketService } from './services/SocketService';
import { WebPushService } from './services/WebPushService';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Render deployment
app.set('trust proxy', true);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration - specifically configured for Vercel frontend
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigins = [
  'https://wellness-mental-app-web-completa.vercel.app',
  'http://localhost:5173',
  corsOrigin
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    console.log('CORS request from:', origin);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // For debugging, temporarily allow all origins
      console.log('Origin not in allowed list, but allowing for debugging:', origin);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Audit logging
app.use(auditLog);

// Rate limiting (apply to all routes)
app.use(apiRateLimit);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/evaluacion', evaluacionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', ejercicioRoutes);
app.use('/api/comunidad', comunidadRoutes);
app.use('/api/gamificacion', gamificacionRoutes);
app.use('/api', informeRoutes);
app.use('/api', alertaRoutes);
app.use('/api', perfilRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Initialize Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Normalize origin by removing trailing slash
      const normalizedOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
      const normalizedCorsOrigin = corsOrigin.endsWith('/') ? corsOrigin.slice(0, -1) : corsOrigin;
      
      if (normalizedOrigin === normalizedCorsOrigin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
});

// Initialize Socket service
SocketService.initialize(io);

// Initialize Web Push service
try {
  WebPushService.initialize();
  console.log('Web Push service initialized');
} catch (error) {
  console.warn('Web Push service initialization failed:', error);
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default app;
