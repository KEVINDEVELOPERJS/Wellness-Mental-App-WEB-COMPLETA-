import { Router } from 'express';
import { GamificacionController } from '../controllers/GamificacionController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/logros', GamificacionController.getLogros);

// Protected routes
router.get('/logros/usuario', authenticate, GamificacionController.getUserLogros);
router.get('/nivel', authenticate, GamificacionController.getNivel);
router.post('/puntos', authenticate, GamificacionController.otorgarPuntos);
router.post('/verificar-logros', authenticate, GamificacionController.verificarLogros);
router.get('/estadisticas', authenticate, GamificacionController.getEstadisticas);
router.get('/leaderboard', authenticate, GamificacionController.getLeaderboard);

export default router;
