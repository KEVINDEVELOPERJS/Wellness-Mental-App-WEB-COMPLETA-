import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/authMiddleware';
import { authRateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

// Public routes
router.post('/registro', authRateLimit, AuthController.registrar);
router.post('/login', authRateLimit, AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.get('/validar-email/:email', AuthController.validarEmail);
router.post('/validar-edad', AuthController.validarEdad);

// Protected routes
router.post('/logout', authenticate, AuthController.logout);
router.get('/logout', authenticate, AuthController.logout); // Support both methods
router.get('/me', authenticate, AuthController.me);

export default router;
