import { Router } from 'express';
import { AlertaController } from '../controllers/AlertaController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { alertRateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

// Protected routes
router.post('/evaluacion', authenticate, AlertaController.generarAlertaEvaluacion);
router.post('/chat', authenticate, AlertaController.generarAlertaChat);
router.post('/manual', authenticate, authorize(['PSICOLOGO', 'ADMIN']), alertRateLimit, AlertaController.crearAlertaManual);
router.get('/', authenticate, authorize(['PSICOLOGO', 'ADMIN']), AlertaController.getAlertas);
router.get('/pendientes', authenticate, authorize(['PSICOLOGO', 'ADMIN']), AlertaController.getAlertasPendientes);
router.get('/:id', authenticate, authorize(['PSICOLOGO', 'ADMIN']), AlertaController.getAlerta);
router.patch('/:id', authenticate, authorize(['PSICOLOGO', 'ADMIN']), AlertaController.actualizarEstado);
router.get('/:id/auditoria', authenticate, authorize(['PSICOLOGO', 'ADMIN']), AlertaController.getAuditoria);
router.post('/:id/notificacion', authenticate, authorize(['PSICOLOGO', 'ADMIN']), AlertaController.enviarNotificacionPush);
router.post('/:id/email', authenticate, authorize(['PSICOLOGO', 'ADMIN']), AlertaController.enviarEmailPrioritario);
router.get('/usuario/:usuarioId', authenticate, AlertaController.getAlertasByUsuario);
router.get('/psicologo', authenticate, authorize(['PSICOLOGO', 'ADMIN']), AlertaController.getAlertasByPsicologo);
router.post('/:id/auditoria', authenticate, authorize(['PSICOLOGO', 'ADMIN']), AlertaController.registrarAuditoria);

export default router;
