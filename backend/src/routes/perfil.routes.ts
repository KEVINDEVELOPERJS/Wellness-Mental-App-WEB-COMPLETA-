import { Router } from 'express';
import { PerfilController } from '../controllers/PerfilController';
import { authenticate } from '../middleware/authMiddleware';
import { apiRateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

// Protected routes
router.get('/perfil/estadisticas', authenticate, PerfilController.getEstadisticas);
router.get('/perfil', authenticate, PerfilController.getPerfil);
router.patch('/perfil', authenticate, apiRateLimit, PerfilController.actualizarPerfil);
router.post('/perfil/password', authenticate, apiRateLimit, PerfilController.cambiarPassword);
router.get('/perfil/notificaciones', authenticate, PerfilController.getNotificaciones);
router.patch('/perfil/notificaciones', authenticate, PerfilController.actualizarNotificaciones);
router.post('/perfil/2fa/activar', authenticate, PerfilController.activar2FA);
router.post('/perfil/2fa/validar', authenticate, PerfilController.validar2FA);
router.get('/perfil/sesiones', authenticate, PerfilController.getSesiones);
router.post('/perfil/sesiones/cerrar', authenticate, PerfilController.cerrarSesion);
router.post('/perfil/sesiones/cerrar-todas', authenticate, PerfilController.cerrarTodasSesiones);
router.post('/perfil/invitacion-padre', authenticate, PerfilController.generarInvitacionPadre);
router.delete('/perfil/acceso-padre', authenticate, PerfilController.revocarAccesoPadre);
router.get('/perfil/descargar-datos', authenticate, PerfilController.descargarDatos);
router.delete('/perfil/cuenta', authenticate, apiRateLimit, PerfilController.eliminarCuenta);
router.get('/perfil/historial-evaluaciones', authenticate, PerfilController.getHistorialEvaluaciones);

export default router;
