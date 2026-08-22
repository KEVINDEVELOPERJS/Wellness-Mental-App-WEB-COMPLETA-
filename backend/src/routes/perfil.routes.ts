import { Router } from 'express';
import { PerfilController } from '../controllers/PerfilController';
import { authenticate } from '../middleware/authMiddleware';
import { apiRateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

// Protected routes
router.get('/estadisticas', authenticate, PerfilController.getEstadisticas);
router.get('/', authenticate, PerfilController.getPerfil);
router.patch('/', authenticate, apiRateLimit, PerfilController.actualizarPerfil);
router.post('/password', authenticate, apiRateLimit, PerfilController.cambiarPassword);
router.get('/notificaciones', authenticate, PerfilController.getNotificaciones);
router.patch('/notificaciones', authenticate, PerfilController.actualizarNotificaciones);
router.post('/2fa/activar', authenticate, PerfilController.activar2FA);
router.post('/2fa/validar', authenticate, PerfilController.validar2FA);
router.get('/sesiones', authenticate, PerfilController.getSesiones);
router.post('/sesiones/cerrar', authenticate, PerfilController.cerrarSesion);
router.post('/sesiones/cerrar-todas', authenticate, PerfilController.cerrarTodasSesiones);
router.post('/invitacion-padre', authenticate, PerfilController.generarInvitacionPadre);
router.delete('/acceso-padre', authenticate, PerfilController.revocarAccesoPadre);
router.get('/descargar-datos', authenticate, PerfilController.descargarDatos);
router.delete('/cuenta', authenticate, apiRateLimit, PerfilController.eliminarCuenta);
router.get('/historial-evaluaciones', authenticate, PerfilController.getHistorialEvaluaciones);

export default router;
