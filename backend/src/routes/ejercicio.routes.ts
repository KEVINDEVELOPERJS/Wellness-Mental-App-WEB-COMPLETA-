import { Router } from 'express';
import { EjercicioController } from '../controllers/EjercicioController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { apiRateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

// Public routes
router.get('/ejercicios', EjercicioController.getEjercicios);
router.get('/ejercicios/:id', EjercicioController.getEjercicio);
router.get('/ejercicios/tipo/:tipo', EjercicioController.getEjerciciosPorTipo);

// Protected routes
router.post('/ejercicios/:id/iniciar', authenticate, EjercicioController.iniciarEjercicio);
router.post('/ejercicios/progreso', authenticate, apiRateLimit, EjercicioController.registrarProgreso);
router.get('/ejercicios/progreso', authenticate, EjercicioController.getProgreso);
router.get('/ejercicios/racha', authenticate, EjercicioController.getRacha);
router.get('/ejercicios/tiempo-hoy', authenticate, EjercicioController.getTiempoHoy);

// Psychologist only routes
router.post('/ejercicios', authenticate, authorize(['PSICOLOGO', 'ADMIN']), EjercicioController.crearEjercicio);

export default router;
