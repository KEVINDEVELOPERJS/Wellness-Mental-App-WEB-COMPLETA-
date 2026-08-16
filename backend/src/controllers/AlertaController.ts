import { Request, Response } from 'express';
import { AlertaRiesgoRepository } from '../models/repositories/AlertaRiesgoRepository';
import { WebPushService } from '../services/WebPushService';
import { EmailService } from '../services/EmailService';
import { SocketService } from '../services/SocketService';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';
import prisma from '../config/database';

const alertaSchema = z.object({
  estudianteId: z.number(),
  tipo: z.string(),
  nivelRiesgo: z.enum(['BAJO', 'MEDIO', 'ALTO']),
  extracto: z.string(),
  resultadoId: z.number().optional(),
  chatSessionId: z.number().optional(),
});

const actualizarEstadoSchema = z.object({
  estado: z.enum(['PENDIENTE', 'ATENDIDA', 'EN_SEGUIMIENTO', 'DERIVADA']),
  notas: z.string().optional(),
});

export class AlertaController {
  static async generarAlertaEvaluacion(req: Request, res: Response) {
    try {
      const { resultadoId } = req.body;
      const userId = (req as any).user?.userId;

      const alerta = await AlertaRiesgoRepository.generarAlertaEvaluacion(resultadoId, userId);

      if (!alerta) {
        return res.json({ message: 'No alert generated (risk level not high)' });
      }

      // Notify psychologists
      SocketService.sendToPsychologists('nueva_alerta', alerta);

      res.status(201).json(alerta);
    } catch (error) {
      throw error;
    }
  }

  static async generarAlertaChat(req: Request, res: Response) {
    try {
      const { chatSessionId, extracto } = req.body;
      const userId = (req as any).user?.userId;

      const alerta = await AlertaRiesgoRepository.generarAlertaChat(
        chatSessionId,
        userId,
        extracto
      );

      // Notify psychologists
      SocketService.sendToPsychologists('nueva_alerta', alerta);

      res.status(201).json(alerta);
    } catch (error) {
      throw error;
    }
  }

  static async crearAlertaManual(req: Request, res: Response) {
    try {
      const alertaData = alertaSchema.parse(req.body);
      const ip = req.ip;
      const userAgent = req.get('user-agent') || 'unknown';

      const alerta = await AlertaRiesgoRepository.create(alertaData, ip, userAgent);

      // Notify psychologists
      SocketService.sendToPsychologists('nueva_alerta', alerta);

      res.status(201).json(alerta);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  }

  static async getAlertas(req: Request, res: Response) {
    try {
      const { estado, nivelRiesgo, page = '1', limit = '20' } = req.query;

      const alertas = await AlertaRiesgoRepository.findAll({
        estado: estado as any,
        nivelRiesgo: nivelRiesgo as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });

      res.json(alertas);
    } catch (error) {
      throw error;
    }
  }

  static async getAlerta(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const alerta = await AlertaRiesgoRepository.findById(parseInt(id));

      if (!alerta) {
        throw new AppError(404, 'Alerta not found');
      }

      res.json(alerta);
    } catch (error) {
      throw error;
    }
  }

  static async getAlertasPendientes(req: Request, res: Response) {
    try {
      const alertas = await AlertaRiesgoRepository.getPendingAlerts();

      res.json(alertas);
    } catch (error) {
      throw error;
    }
  }

  static async actualizarEstado(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { estado, notas } = actualizarEstadoSchema.parse(req.body);
      const ip = req.ip;
      const userAgent = req.get('user-agent') || 'unknown';

      const alerta = await AlertaRiesgoRepository.updateEstado(
        parseInt(id),
        estado,
        notas,
        ip,
        userAgent
      );

      res.json(alerta);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  }

  static async getAuditoria(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const auditoria = await AlertaRiesgoRepository.getAuditoria(parseInt(id));

      res.json(auditoria);
    } catch (error) {
      throw error;
    }
  }

  static async enviarNotificacionPush(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { subscription } = req.body;

      const alerta = await AlertaRiesgoRepository.findById(parseInt(id));
      if (!alerta) {
        throw new AppError(404, 'Alerta not found');
      }

      await WebPushService.sendAlertNotification(subscription, {
        title: `Alerta: ${alerta.nivelRiesgo}`,
        body: `Nueva alerta para estudiante: ${alerta.estudiante.nombre}`,
        data: { alertaId: alerta.id },
      });

      res.json({ message: 'Notification sent' });
    } catch (error) {
      throw error;
    }
  }

  static async enviarEmailPrioritario(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { psicologoEmail } = req.body;

      const alerta = await AlertaRiesgoRepository.findById(parseInt(id));
      if (!alerta) {
        throw new AppError(404, 'Alerta not found');
      }

      await EmailService.sendAlertEmail(psicologoEmail, {
        studentName: alerta.estudiante.nombre,
        riskLevel: alerta.nivelRiesgo,
        type: alerta.tipo,
        timestamp: alerta.timestamp.toISOString(),
        excerpt: alerta.extracto,
      });

      res.json({ message: 'Email sent' });
    } catch (error) {
      throw error;
    }
  }

  static async getAlertasByEstudiante(req: Request, res: Response) {
    try {
      const { estudianteId } = req.params;
      const alertas = await AlertaRiesgoRepository.getAlertasByEstudiante(parseInt(estudianteId));

      res.json(alertas);
    } catch (error) {
      throw error;
    }
  }

  static async getAlertasByPsicologo(req: Request, res: Response) {
    try {
      const psicologoId = (req as any).user?.userId;
      const alertas = await AlertaRiesgoRepository.getAlertasByPsicologo(psicologoId);

      res.json(alertas);
    } catch (error) {
      throw error;
    }
  }

  static async registrarAuditoria(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { accion, detalles } = req.body;
      const ip = req.ip;
      const userAgent = req.get('user-agent') || 'unknown';

      const alerta = await AlertaRiesgoRepository.findById(parseInt(id));
      if (!alerta) {
        throw new AppError(404, 'Alerta not found');
      }

      // Audit log is automatically created in updateEstado, but we can add manual entries
      await prisma.auditoriaAlerta.create({
        data: {
          alertaId: parseInt(id),
          accion,
          ip,
          userAgent,
          detalles,
        },
      });

      res.json({ message: 'Audit log registered' });
    } catch (error) {
      throw error;
    }
  }
}
