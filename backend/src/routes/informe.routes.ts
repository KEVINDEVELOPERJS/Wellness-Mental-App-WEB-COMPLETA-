import { Router } from 'express';
import { InformeController } from '../controllers/InformeController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { strictRateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

// Public routes (with secure token)
router.get('/:token', InformeController.getInforme);
router.get('/:token/pdf', InformeController.getInformePDF);
router.post('/:token/acceso', InformeController.registrarAcceso);

// Protected routes
router.post('/generar', authenticate, authorize(['PSICOLOGO', 'ADMIN']), strictRateLimit, InformeController.generarInforme);
router.post('/2fa/validar', authenticate, InformeController.validar2FA);
router.post('/2fa/generar', authenticate, InformeController.generar2FA);
router.get('/padre', authenticate, InformeController.getInformesByPadre);

export default router;
