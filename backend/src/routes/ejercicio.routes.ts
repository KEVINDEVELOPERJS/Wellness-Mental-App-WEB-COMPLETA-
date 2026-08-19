import { Router } from 'express';
import { EjercicioController } from '../controllers/EjercicioController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { apiRateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

// Public routes - Rutas específicas primero
router.get('/', EjercicioController.getEjercicios);
router.get('/tipo/:tipo', EjercicioController.getEjerciciosPorTipo);

// Protected routes - Rutas específicas primero
router.get('/racha', authenticate, EjercicioController.getRacha);
router.get('/tiempo-hoy', authenticate, EjercicioController.getTiempoHoy);
router.get('/progreso', authenticate, EjercicioController.getProgreso);
router.post('/progreso', authenticate, apiRateLimit, EjercicioController.registrarProgreso);

// Rutas dinámicas al final
router.get('/:id', EjercicioController.getEjercicio);
router.post('/:id/iniciar', authenticate, EjercicioController.iniciarEjercicio);

// Psychologist only routes
router.post('/', authenticate, authorize(['PSICOLOGO', 'ADMIN']), EjercicioController.crearEjercicio);

export default router;
