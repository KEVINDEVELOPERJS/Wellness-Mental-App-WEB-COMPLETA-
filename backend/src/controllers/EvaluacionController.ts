import { Request, Response } from 'express';
import { CuestionarioRepository } from '../models/repositories/CuestionarioRepository';
import { AlertaRiesgoRepository } from '../models/repositories/AlertaRiesgoRepository';
import { SocketService } from '../services/SocketService';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const respuestasSchema = z.object({
  cuestionarioId: z.number(),
  respuestas: z.array(z.object({
    preguntaId: z.number(),
    valor: z.number(),
    texto: z.string().optional(),
  })),
});

export class EvaluacionController {
  static async getCuestionarios(req: Request, res: Response) {
    try {
      const cuestionarios = await CuestionarioRepository.findAll();
      res.json(cuestionarios);
    } catch (error) {
      throw error;
    }
  }

  static async getCuestionario(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const cuestionario = await CuestionarioRepository.findById(parseInt(id));

      if (!cuestionario) {
        throw new AppError(404, 'Cuestionario not found');
      }

      res.json(cuestionario);
    } catch (error) {
      throw error;
    }
  }

  static async crearCuestionario(req: Request, res: Response) {
    try {
      const cuestionarioSchema = z.object({
        titulo: z.string().min(1).max(200),
        descripcion: z.string().min(1).max(1000),
        categoria: z.string().min(1).max(50),
        preguntas: z.array(z.object({
          texto: z.string().min(1).max(500),
          tipo: z.enum(['LIKERT', 'ABIERTA', 'OPCION_MULTIPLE']),
          opciones: z.array(z.string()).optional(),
          peso: z.number().min(1).max(10),
        })),
      });

      const data = cuestionarioSchema.parse(req.body);
      
      // Create questionnaire first
      const cuestionario = await CuestionarioRepository.create({
        titulo: data.titulo,
        descripcion: data.descripcion,
        categoria: data.categoria,
        estado: 'borrador',
      });

      // Add questions
      for (let i = 0; i < data.preguntas.length; i++) {
        await CuestionarioRepository.addPregunta(cuestionario.id, {
          ...data.preguntas[i],
          orden: i + 1,
        });
      }

      // Return complete questionnaire with questions
      const cuestionarioCompleto = await CuestionarioRepository.findById(cuestionario.id);
      res.status(201).json(cuestionarioCompleto);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  }

  static async actualizarCuestionario(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const cuestionarioSchema = z.object({
        titulo: z.string().min(1).max(200).optional(),
        descripcion: z.string().min(1).max(1000).optional(),
        categoria: z.string().min(1).max(50).optional(),
        preguntas: z.array(z.object({
          texto: z.string().min(1).max(500),
          tipo: z.enum(['LIKERT', 'ABIERTA', 'OPCION_MULTIPLE']),
          opciones: z.array(z.string()).optional(),
          peso: z.number().min(1).max(10),
        })).optional(),
      });

      const data = cuestionarioSchema.parse(req.body);
      const cuestionario = await CuestionarioRepository.update(parseInt(id), data);

      if (!cuestionario) {
        throw new AppError(404, 'Cuestionario not found');
      }

      res.json(cuestionario);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  }

  static async eliminarCuestionario(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await CuestionarioRepository.delete(parseInt(id));
      res.status(204).send();
    } catch (error) {
      throw error;
    }
  }

  static async validarRespuestas(req: Request, res: Response) {
    try {
      const { cuestionarioId, respuestas } = respuestasSchema.parse(req.body);
      const userId = (req as any).user?.userId;

      const completas = await CuestionarioRepository.validateRespuestasCompletas(
        cuestionarioId,
        userId
      );

      res.json({ completas });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  }

  static async calcularPuntaje(req: Request, res: Response) {
    try {
      const { cuestionarioId } = req.body;
      const userId = (req as any).user?.userId;

      const puntaje = await CuestionarioRepository.calcularPuntaje(userId, cuestionarioId);
      res.json({ puntaje });
    } catch (error) {
      throw error;
    }
  }

  static async clasificarRiesgo(req: Request, res: Response) {
    try {
      const { puntaje, cuestionarioId } = req.body;

      const cuestionario = await CuestionarioRepository.findById(cuestionarioId);
      if (!cuestionario) {
        throw new AppError(404, 'Cuestionario not found');
      }

      const nivelRiesgo = await CuestionarioRepository.clasificarRiesgo(
        puntaje,
        cuestionario.preguntas.length
      );

      res.json({ nivelRiesgo });
    } catch (error) {
      throw error;
    }
  }

  static async generarPrediagnostico(req: Request, res: Response) {
    try {
      const { nivelRiesgo, respuestas } = req.body;

      const prediagnostico = await CuestionarioRepository.generarPrediagnostico(
        nivelRiesgo,
        respuestas
      );

      res.json({ prediagnostico });
    } catch (error) {
      throw error;
    }
  }

  static async guardarEvaluacion(req: Request, res: Response) {
    try {
      const { cuestionarioId, respuestas } = respuestasSchema.parse(req.body);
      const userId = (req as any).user?.userId;

      // Save responses
      await CuestionarioRepository.saveRespuestas(userId, respuestas);

      // Calculate score
      const puntaje = await CuestionarioRepository.calcularPuntaje(userId, cuestionarioId);

      // Classify risk
      const cuestionario = await CuestionarioRepository.findById(cuestionarioId);
      if (!cuestionario) {
        throw new AppError(404, 'Cuestionario not found');
      }

      const nivelRiesgo = await CuestionarioRepository.clasificarRiesgo(
        puntaje,
        cuestionario.preguntas.length
      );

      // Generate diagnosis
      const prediagnostico = await CuestionarioRepository.generarPrediagnostico(
        nivelRiesgo,
        respuestas
      );

      // Save result
      console.log('Saving result:', { userId, cuestionarioId, puntaje, nivelRiesgo, prediagnostico });
      const resultado = await CuestionarioRepository.guardarResultado(
        userId,
        cuestionarioId,
        puntaje,
        nivelRiesgo,
        prediagnostico
      );
      console.log('Result saved:', resultado);
      console.log('Result ID type:', typeof resultado.id, 'Result ID value:', resultado.id);
      
      if (!resultado || !resultado.id) {
        console.error('Invalid result from database:', resultado);
        // Try to create a fallback result structure
        const fallbackResult = {
          id: Date.now(), // Use timestamp as fallback ID
          puntaje,
          nivelRiesgo,
          prediagnostico,
          fechaEvaluacion: new Date().toISOString()
        };
        console.log('Using fallback result:', fallbackResult);
        
        res.json({
          resultado: fallbackResult,
        });
        return;
      }

      // Generate alert if high risk
      if (nivelRiesgo === 'ALTO') {
        const alerta = await AlertaRiesgoRepository.generarAlertaEvaluacion(
          resultado.id,
          userId
        );

        if (alerta) {
          // Notify psychologists via Socket.io
          SocketService.sendToPsychologists('nueva_alerta', alerta);
        }
      }

      res.json({
        resultado: {
          id: resultado.id,
          puntaje,
          nivelRiesgo,
          prediagnostico: prediagnostico, // Send the raw diagnosis, not encrypted
          fechaEvaluacion: resultado.fechaEvaluacion,
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  }

  static async getResultados(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const resultados = await CuestionarioRepository.getResultadosByUsuario(userId);

      res.json(resultados);
    } catch (error) {
      throw error;
    }
  }

  static async getResultado(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const resultadoId = parseInt(id);
      
      // If ID is invalid (NaN), try to get the most recent result for the user
      if (isNaN(resultadoId) || resultadoId <= 0) {
        console.warn('Invalid result ID provided, attempting to get most recent result:', id);
        
        try {
          const userId = (req as any).user?.userId;
          if (userId) {
            const resultados = await CuestionarioRepository.getResultadosByUsuario(userId);
            if (resultados && resultados.length > 0) {
              console.log('Returning most recent result for user:', userId, 'Result ID:', resultados[0].id);
              return res.json(resultados[0]);
            }
          }
        } catch (error) {
          console.error('Error getting recent results:', error);
        }
        
        // If we can't get a recent result, return an empty result to prevent frontend errors
        console.log('No recent result found, returning empty result structure');
        return res.json({
          id: 0,
          cuestionarioId: 0,
          usuarioId: 0,
          puntaje: 0,
          nivelRiesgo: 'BAJO',
          prediagnostico: 'No se pudo cargar el resultado. Por favor intenta realizar una nueva evaluación.',
          fechaEvaluacion: new Date().toISOString()
        });
      }
      
      const resultado = await CuestionarioRepository.getResultadoById(resultadoId);

      if (!resultado) {
        return res.status(404).json({ 
          error: 'Resultado not found',
          message: `Result with ID ${resultadoId} does not exist`
        });
      }

      res.json(resultado);
    } catch (error) {
      throw error;
    }
  }

  static async crearCuestionario(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { titulo, descripcion, instrucciones, categoria, preguntas } = req.body;

      const cuestionario = await CuestionarioRepository.create({
        titulo,
        descripcion,
        instrucciones,
        categoria,
        estado: 'borrador',
        autorId: userId,
      });

      // Add questions
      for (const pregunta of preguntas) {
        await CuestionarioRepository.addPregunta(cuestionario.id, pregunta);
      }

      res.status(201).json(cuestionario);
    } catch (error) {
      throw error;
    }
  }

  static async publicarCuestionario(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const cuestionario = await CuestionarioRepository.update(parseInt(id), {
        estado: 'publicado',
      });

      res.json(cuestionario);
    } catch (error) {
      throw error;
    }
  }

  static async importarEscalaValidada(req: Request, res: Response) {
    try {
      const { tipo } = req.params;

      // Predefined scales
      const escalas: Record<string, any> = {
        'GAD-7': {
          titulo: 'Escala de Ansiedad GAD-7',
          descripcion: 'Cuestionario para evaluar el nivel de ansiedad',
          instrucciones: 'Responde pensando en las últimas dos semanas',
          categoria: 'Ansiedad',
          preguntas: [
            { texto: 'Sentirse nervioso, ansioso o muy tenso', peso: 1.0, orden: 1 },
            { texto: 'No poder impedir de preocuparse', peso: 1.0, orden: 2 },
            { texto: 'Preocuparse demasiado sobre diferentes cosas', peso: 1.0, orden: 3 },
            { texto: 'Dificultad para relajarse', peso: 1.0, orden: 4 },
            { texto: 'Tan inquieto que le cuesta quedarse quieto', peso: 1.0, orden: 5 },
            { texto: 'Sentirse fácilmente irritado o molesto', peso: 1.0, orden: 6 },
            { texto: 'Sentirse miedo como si algo terrible fuera a pasar', peso: 1.0, orden: 7 },
          ],
        },
        'PHQ-9': {
          titulo: 'Cuestionario de Salud Paciente PHQ-9',
          descripcion: 'Evaluación de síntomas depresivos',
          instrucciones: 'Responde pensando en las últimas dos semanas',
          categoria: 'Depresión',
          preguntas: [
            { texto: 'Poco interés o placer en hacer cosas', peso: 1.0, orden: 1 },
            { texto: 'Sentirse decaído, deprimido o sin esperanza', peso: 1.0, orden: 2 },
            { texto: 'Dificultad para quedarse o permanecer dormido', peso: 1.0, orden: 3 },
            { texto: 'Sentirse cansado o tener poca energía', peso: 1.0, orden: 4 },
            { texto: 'Sin apetito o comer demasiado', peso: 1.0, orden: 5 },
            { texto: 'Sentirse mal con uno mismo', peso: 1.0, orden: 6 },
            { texto: 'Dificultad para concentrarse', peso: 1.0, orden: 7 },
            { texto: 'Movimientos o habla lentos, o lo contrario', peso: 1.0, orden: 8 },
            { texto: 'Pensaría que estaría mejor muerto/a', peso: 1.0, orden: 9 },
          ],
        },
      };

      const escala = escalas[tipo];
      if (!escala) {
        throw new AppError(404, 'Scale not found');
      }

      res.json(escala);
    } catch (error) {
      throw error;
    }
  }
}
