import { Router } from 'express';
import { EvaluacionController } from '../controllers/EvaluacionController';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { apiRateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

// Public routes (for getting questionnaires)
router.get('/cuestionarios', EvaluacionController.getCuestionarios);
router.get('/cuestionarios/:id', EvaluacionController.getCuestionario);
router.get('/cuestionarios/escalas/:tipo', EvaluacionController.importarEscalaValidada);

// Protected routes
router.post('/validar', authenticate, EvaluacionController.validarRespuestas);
router.post('/calcular', authenticate, EvaluacionController.calcularPuntaje);
router.post('/clasificar', authenticate, EvaluacionController.clasificarRiesgo);
router.post('/prediagnostico', authenticate, EvaluacionController.generarPrediagnostico);
router.post('/guardar', authenticate, /* apiRateLimit, */ EvaluacionController.guardarEvaluacion); // TEMPORARILY DISABLED RATE LIMIT
router.get('/resultados', authenticate, EvaluacionController.getResultados);
router.get('/resultados/:id', authenticate, EvaluacionController.getResultado);

// Psychologist only routes
router.post('/cuestionarios', authenticate, authorize(['PSICOLOGO', 'ADMIN']), EvaluacionController.crearCuestionario);
router.patch('/cuestionarios/:id/publicar', authenticate, authorize(['PSICOLOGO', 'ADMIN']), EvaluacionController.publicarCuestionario);

export default router;
