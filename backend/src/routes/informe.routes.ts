import { Router } from 'express';
import { InformeController } from '../controllers/InformeController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { strictRateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

// Public routes (with secure token)
router.get('/informe/:token', InformeController.getInforme);
router.get('/informe/:token/pdf', InformeController.getInformePDF);
router.post('/informe/:token/acceso', InformeController.registrarAcceso);

// Protected routes
router.post('/informes/generar', authenticate, authorize(['PSICOLOGO', 'ADMIN']), strictRateLimit, InformeController.generarInforme);
router.post('/informes/2fa/validar', authenticate, InformeController.validar2FA);
router.post('/informes/2fa/generar', authenticate, InformeController.generar2FA);
router.get('/informes/padre', authenticate, InformeController.getInformesByPadre);

export default router;
