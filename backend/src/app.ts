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
import alertaHubRoutes from './routes/alertaHub.routes';
import perfilRoutes from './routes/perfil.routes';
import testRoutes from './routes/test.routes';

// Import services
import { SocketService } from './services/SocketService';
import { WebPushService } from './services/WebPushService';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Render deployment
app.set('trust proxy', true);

// CORS configuration using TypeScript for type safety
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow specific origins for production
    const allowedOrigins = [
      'https://wellness-mental-app-web-completa.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000'
    ];
    
    // For debugging, allow all origins
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400, // 24 hours
} satisfies cors.CorsOptions;

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Audit logging
app.use(auditLog);

// Rate limiting (apply to all routes) - DISABLED FOR DEBUGGING
// app.use(apiRateLimit);

// Health check endpoint
app.get('/health', (_req, res) => {
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
app.use('/api/ejercicios', ejercicioRoutes);
app.use('/api/comunidad', comunidadRoutes);
app.use('/api/gamificacion', gamificacionRoutes);
app.use('/api/informes', informeRoutes);
app.use('/api/alertas', alertaRoutes);
app.use('/api/alertas', alertaHubRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/test', testRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Create HTTP server
const server = createServer(app);

// Initialize Socket.io with proper CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://wellness-mental-app-web-completa.vercel.app']
      : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST']
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
  console.log(`🔗 CORS: ${process.env.NODE_ENV === 'production' ? 'RESTRICTED (Production)' : 'PERMISSIVE (Development)'}`);
  console.log(`🔧 Helmet security: DISABLED`);
  console.log(`🔧 Rate limiting: DISABLED`);
  console.log(`🔧 Updated: ${new Date().toISOString()}`);
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