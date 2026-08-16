import { Router } from 'express';
import { AlertaController } from '../controllers/AlertaController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { alertRateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

// Protected routes
router.post('/alertas/evaluacion', authenticate, AlertaController.generarAlertaEvaluacion);
router.post('/alertas/chat', authenticate, AlertaController.generarAlertaChat);
router.post('/alertas/manual', authenticate, authorize(['PSICOLOGO', 'ADMIN']), alertRateLimit, AlertaController.crearAlertaManual);
router.get('/alertas', authenticate, authorize(['PSICOLOGO', 'ADMIN']), AlertaController.getAlertas);
router.get('/alertas/pendientes', authenticate, authorize(['PSICOLOGO', 'ADMIN']), AlertaController.getAlertasPendientes);
router.get('/alertas/:id', authenticate, authorize(['PSICOLOGO', 'ADMIN']), AlertaController.getAlerta);
router.patch('/alertas/:id', authenticate, authorize(['PSICOLOGO', 'ADMIN']), AlertaController.actualizarEstado);
router.get('/alertas/:id/auditoria', authenticate, authorize(['PSICOLOGO', 'ADMIN']), AlertaController.getAuditoria);
router.post('/alertas/:id/notificacion', authenticate, authorize(['PSICOLOGO', 'ADMIN']), AlertaController.enviarNotificacionPush);
router.post('/alertas/:id/email', authenticate, authorize(['PSICOLOGO', 'ADMIN']), AlertaController.enviarEmailPrioritario);
router.get('/alertas/estudiante/:estudianteId', authenticate, AlertaController.getAlertasByEstudiante);
router.get('/alertas/psicologo', authenticate, authorize(['PSICOLOGO', 'ADMIN']), AlertaController.getAlertasByPsicologo);
router.post('/alertas/:id/auditoria', authenticate, authorize(['PSICOLOGO', 'ADMIN']), AlertaController.registrarAuditoria);

export default router;
