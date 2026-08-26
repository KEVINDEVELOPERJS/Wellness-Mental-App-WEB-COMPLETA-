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

// Additional game endpoints
router.get('/estado', authenticate, GamificacionController.getEstado);
router.get('/misiones-diarias', authenticate, GamificacionController.getMisionesDiarias);
router.get('/ranking/calma-match', authenticate, GamificacionController.getRankingCalmaMatch);
router.post('/sesion-juego', authenticate, GamificacionController.registrarSesionJuego);

export default router;
