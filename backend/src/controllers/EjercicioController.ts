import { Request, Response } from 'express';
import { EjercicioRepository } from '../models/repositories/EjercicioRepository';
import { LogroRepository } from '../models/repositories/LogroRepository';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const progresoSchema = z.object({
  ejercicioId: z.number(),
  duracionReal: z.number(),
  completado: z.boolean(),
  satisfaccion: z.number().min(1).max(5),
});

export class EjercicioController {
  static async getEjercicios(req: Request, res: Response) {
    try {
      const ejercicios = await EjercicioRepository.findAll();
      res.json(ejercicios);
    } catch (error) {
      throw error;
    }
  }

  static async getEjercicio(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const ejercicio = await EjercicioRepository.findById(parseInt(id));

      if (!ejercicio) {
        throw new AppError(404, 'Ejercicio not found');
      }

      res.json(ejercicio);
    } catch (error) {
      throw error;
    }
  }

  static async getEjerciciosPorTipo(req: Request, res: Response) {
    try {
      const { tipo } = req.params;
      const ejercicios = await EjercicioRepository.findByTipo(tipo);

      res.json(ejercicios);
    } catch (error) {
      throw error;
    }
  }

  static async iniciarEjercicio(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { duracion } = req.body;
      const userId = (req as any).user?.userId;

      const ejercicio = await EjercicioRepository.findById(parseInt(id));
      if (!ejercicio) {
        throw new AppError(404, 'Ejercicio not found');
      }

      // Validate time limit
      const validTime = await EjercicioRepository.validateTimeLimit(userId, duracion);
      if (!validTime) {
        throw new AppError(400, 'Daily time limit exceeded (30 minutes)');
      }

      res.json({
        ejercicio,
        duracionPermitida: duracion,
        tiempoRestanteHoy: 30 - (await EjercicioRepository.getTodayExerciseTime(userId)),
      });
    } catch (error) {
      throw error;
    }
  }

  static async registrarProgreso(req: Request, res: Response) {
    try {
      const progresoData = progresoSchema.parse(req.body);
      const userId = (req as any).user?.userId;

      // Validate time limit
      const validTime = await EjercicioRepository.validateTimeLimit(
        userId,
        progresoData.duracionReal
      );
      if (!validTime) {
        throw new AppError(400, 'Daily time limit exceeded');
      }

      const progreso = await EjercicioRepository.registrarProgreso(userId, progresoData);

      // Award points and check achievements
      if (progresoData.completado) {
        await LogroRepository.otorgarPuntos(userId, 'ejercicio', 50);
      }

      res.status(201).json(progreso);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  }

  static async getProgreso(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const progreso = await EjercicioRepository.getProgresoByUsuario(userId);

      res.json(progreso);
    } catch (error) {
      throw error;
    }
  }

  static async getRacha(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const racha = await EjercicioRepository.calcularRachaDias(userId);

      res.json({ rachaDias: racha });
    } catch (error) {
      throw error;
    }
  }

  static async getTiempoHoy(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const tiempo = await EjercicioRepository.getTodayExerciseTime(userId);

      res.json({ tiempoMinutos: tiempo, tiempoRestante: Math.max(0, 30 - tiempo) });
    } catch (error) {
      throw error;
    }
  }

  static async crearEjercicio(req: Request, res: Response) {
    try {
      const { titulo, descripcion, tipo, duracionMinima, duracionMaxima, instrucciones, audioUrl, imagenUrl } = req.body;

      const ejercicio = await EjercicioRepository.create({
        titulo,
        descripcion,
        tipo,
        duracionMinima,
        duracionMaxima,
        instrucciones,
        audioUrl,
        imagenUrl,
      });

      res.status(201).json(ejercicio);
    } catch (error) {
      throw error;
    }
  }
}
