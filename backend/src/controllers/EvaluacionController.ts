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
      const resultado = await CuestionarioRepository.getResultadoById(parseInt(id));

      if (!resultado) {
        throw new AppError(404, 'Resultado not found');
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
