import { Router } from 'express';
import { ComunidadController } from '../controllers/ComunidadController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { apiRateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

// Public routes
router.get('/posts', ComunidadController.getPosts);
router.get('/posts/:id', ComunidadController.getPost);
router.get('/categorias', ComunidadController.getCategorias);

// Protected routes
router.post('/posts', authenticate, apiRateLimit, ComunidadController.createPost);
router.patch('/posts/:id', authenticate, ComunidadController.updatePost);
router.delete('/posts/:id', authenticate, ComunidadController.deletePost);
router.post('/posts/:id/like', authenticate, ComunidadController.addLike);
router.delete('/posts/:id/like', authenticate, ComunidadController.removeLike);
router.post('/posts/:id/reportar', authenticate, ComunidadController.reportPost);
router.post('/comentarios', authenticate, ComunidadController.createComentario);
router.delete('/comentarios/:id', authenticate, ComunidadController.deleteComentario);
router.get('/sugerir-companeros', authenticate, ComunidadController.sugerirCompaneros);

// Moderator/Psychologist routes
router.patch('/posts/:id/moderar', authenticate, authorize(['PSICOLOGO', 'ADMIN']), ComunidadController.moderatePost);

export default router;
