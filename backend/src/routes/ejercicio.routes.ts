import { Router } from 'express';
import { EjercicioController } from '../controllers/EjercicioController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { apiRateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

// Public routes
router.get('/', EjercicioController.getEjercicios);
router.get('/:id', EjercicioController.getEjercicio);
router.get('/tipo/:tipo', EjercicioController.getEjerciciosPorTipo);

// Protected routes
router.post('/:id/iniciar', authenticate, EjercicioController.iniciarEjercicio);
router.post('/progreso', authenticate, apiRateLimit, EjercicioController.registrarProgreso);
router.get('/progreso', authenticate, EjercicioController.getProgreso);
router.get('/racha', authenticate, EjercicioController.getRacha);
router.get('/tiempo-hoy', authenticate, EjercicioController.getTiempoHoy);

// Psychologist only routes
router.post('/', authenticate, authorize(['PSICOLOGO', 'ADMIN']), EjercicioController.crearEjercicio);

export default router;
