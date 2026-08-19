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

// DISABLED CORS MIDDLEWARE - USING MANUAL HEADERS ONLY
// app.use(cors({
//   origin: '*',
//   credentials: false,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
// });

// Manual CORS headers for ALL responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  
  next();
});

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
    origin: '*', // Allow all origins temporarily for debugging
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
  console.log(`🔗 CORS origin: * (PERMISSIVE MODE)`);
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
