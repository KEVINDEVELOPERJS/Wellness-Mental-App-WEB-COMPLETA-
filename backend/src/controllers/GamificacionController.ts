import { Request, Response } from 'express';
import { LogroRepository } from '../models/repositories/LogroRepository';
import { UsuarioRepository } from '../models/repositories/UsuarioRepository';
import { AppError } from '../middleware/errorHandler';

export class GamificacionController {
  static async getLogros(req: Request, res: Response) {
    try {
      const logros = await LogroRepository.findAll();
      res.json(logros);
    } catch (error) {
      throw error;
    }
  }

  static async getUserLogros(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const logros = await LogroRepository.getUserLogros(userId);

      res.json(logros);
    } catch (error) {
      throw error;
    }
  }

  static async getNivel(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const nivel = await LogroRepository.calculateNivel(userId);

      res.json(nivel);
    } catch (error) {
      throw error;
    }
  }

  static async otorgarPuntos(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { tipoActividad, cantidad } = req.body;

      await LogroRepository.otorgarPuntos(userId, tipoActividad, cantidad);

      // Check for newly unlocked achievements
      const userStats = await UsuarioRepository.getStatistics(userId);
      const nuevosLogros = await LogroRepository.checkAndUnlockLogros(userId, userStats);

      res.json({
        message: 'Points awarded',
        nuevosLogros,
      });
    } catch (error) {
      throw error;
    }
  }

  static async verificarLogros(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const userStats = await UsuarioRepository.getStatistics(userId);
      const nuevosLogros = await LogroRepository.checkAndUnlockLogros(userId, userStats);

      res.json({
        nuevosLogros,
        totalDesbloqueados: (await LogroRepository.getUserLogros(userId)).length,
      });
    } catch (error) {
      throw error;
    }
  }

  static async getEstadisticas(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const estadisticas = await UsuarioRepository.getStatistics(userId);

      res.json(estadisticas);
    } catch (error) {
      throw error;
    }
  }

  static async getLeaderboard(req: Request, res: Response) {
    try {
      // Get top users by points (simplified implementation)
      const topUsers = await LogroRepository.getUserLogros(1); // This would need proper implementation
      
      // For now, return a simple leaderboard
      res.json({
        leaderboard: [],
        message: 'Leaderboard feature coming soon',
      });
    } catch (error) {
      throw error;
    }
  }
}
