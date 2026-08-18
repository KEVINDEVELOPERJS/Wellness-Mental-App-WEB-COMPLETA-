import { Router } from 'express';
import { ChatIAController } from '../controllers/ChatIAController';
import { authenticate } from '../middleware/authMiddleware';
import { apiRateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

// Protected routes
router.post('/sesion', authenticate, ChatIAController.iniciarSesion);
router.post('/mensaje', authenticate, apiRateLimit, ChatIAController.enviarMensaje);
router.post('/analizar', authenticate, ChatIAController.analizarSentimiento);
router.post('/riesgo', authenticate, ChatIAController.detectarRiesgo);
router.post('/respuesta', authenticate, ChatIAController.generarRespuesta);
router.get('/historial', authenticate, ChatIAController.getHistorial);
router.get('/mensajes/:sessionId', authenticate, ChatIAController.getMensajes);
router.delete('/sesion/:sessionId', authenticate, ChatIAController.cerrarSesion);
router.get('/test-gemini-config', authenticate, ChatIAController.testGeminiConfig);

export default router;
