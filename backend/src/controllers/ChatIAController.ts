import { Request, Response } from 'express';
import { ChatRepository } from '../models/repositories/ChatRepository';
import { IAService } from '../services/IAService';
import { AlertaRiesgoRepository } from '../models/repositories/AlertaRiesgoRepository';
import { SocketService } from '../services/SocketService';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const mensajeSchema = z.object({
  contenido: z.string().min(1).max(1000),
  chatSessionId: z.number().optional(),
});

export class ChatIAController {
  static async iniciarSesion(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      // Check if there's an active session
      const activeSession = await ChatRepository.getActiveSessionByUsuario(userId);
      
      if (activeSession) {
        return res.json(activeSession);
      }

      const session = await ChatRepository.createSession(userId);
      res.status(201).json(session);
    } catch (error) {
      throw error;
    }
  }

  static async enviarMensaje(req: Request, res: Response) {
    try {
      const { contenido, chatSessionId } = mensajeSchema.parse(req.body);
      const userId = (req as any).user?.userId;

      // Get or create session
      let session;
      if (chatSessionId) {
        session = await ChatRepository.getSessionById(chatSessionId);
      } else {
        session = await ChatRepository.getActiveSessionByUsuario(userId);
      }

      if (!session) {
        session = await ChatRepository.createSession(userId);
      }

      // Save user message
      await ChatRepository.addMensaje(
        { contenido, chatSessionId: session.id },
        'usuario'
      );

      // Analyze sentiment
      const sentimiento = await IAService.analyzeSentiment(contenido);

      // Detect risk level
      const nivelRiesgo = IAService.detectRisk(contenido);
      const nivelRiesgoPorSentimiento = IAService.getRiskLevel(sentimiento);
      
      // Use the higher risk level
      const nivelRiesgoFinal = nivelRiesgo === 'ALTO' || nivelRiesgoPorSentimiento === 'ALTO' ? 'ALTO' :
                            nivelRiesgo === 'MODERADO' || nivelRiesgoPorSentimiento === 'MODERADO' ? 'MODERADO' : 'BAJO';

      // Generate alert if high or moderate risk
      if (nivelRiesgoFinal === 'ALTO' || nivelRiesgoFinal === 'MODERADO') {
        const alerta = await AlertaRiesgoRepository.generarAlertaChat(
          session.id,
          userId,
          contenido.substring(0, 50),
          nivelRiesgoFinal === 'ALTO' ? 'ALTO' : 'MODERADO'
        );

        if (alerta) {
          // Socket notification is now handled in the repository
          // but we keep this for backward compatibility
          SocketService.sendToPsychologists('nueva_alerta', alerta);
        }
      }

      // Get conversation history
      const mensajes = await ChatRepository.getMensajesBySession(session.id, 10);
      const chatHistory = mensajes.map(m => ({
        role: m.remitente === 'usuario' ? 'user' : 'assistant',
        content: m.contenido,
      }));

      // Generate AI response
      const respuestaIA = await IAService.generateResponse(contenido, chatHistory);

      // Save AI message
      const mensajeGuardado = await ChatRepository.addMensaje(
        { contenido: respuestaIA, chatSessionId: session.id },
        'ia'
      );

      // Update message with sentiment
      const mensajeConSentimiento = await IAService.analyzeSentiment(respuestaIA);

      res.json({
        mensaje: {
          id: mensajeGuardado.id,
          contenido: respuestaIA,
          remitente: 'ia',
          sentimiento: mensajeConSentimiento,
          fechaMensaje: mensajeGuardado.fechaMensaje,
        },
        sentimientoUsuario: sentimiento,
        nivelRiesgo: nivelRiesgoFinal,
        requiereAlerta: nivelRiesgoFinal === 'ALTO' || nivelRiesgoFinal === 'MODERADO',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  }

  static async analizarSentimiento(req: Request, res: Response) {
    try {
      const { mensaje } = req.body;
      const sentimiento = await IAService.analyzeSentiment(mensaje);

      res.json({ sentimiento });
    } catch (error) {
      throw error;
    }
  }

  static async detectarRiesgo(req: Request, res: Response) {
    try {
      const { mensaje } = req.body;
      const esRiesgoso = IAService.detectRisk(mensaje);

      res.json({ esRiesgoso });
    } catch (error) {
      throw error;
    }
  }

  static async generarRespuesta(req: Request, res: Response) {
    try {
      const { mensaje, contexto } = req.body;
      const respuesta = await IAService.generateResponse(mensaje, contexto || []);

      res.json({ respuesta });
    } catch (error) {
      throw error;
    }
  }

  static async getHistorial(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const historial = await ChatRepository.getChatHistory(userId);

      res.json(historial);
    } catch (error) {
      throw error;
    }
  }

  static async getMensajes(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      const mensajes = await ChatRepository.getMensajesBySession(parseInt(sessionId));

      res.json(mensajes);
    } catch (error) {
      throw error;
    }
  }

  static async cerrarSesion(req: Request, res: Response) {
    try {
      const { sessionId } = req.params;
      await ChatRepository.closeSession(parseInt(sessionId));

      res.json({ message: 'Session closed' });
    } catch (error) {
      throw error;
    }
  }

  static async testGeminiConfig(req: Request, res: Response) {
    try {
      const geminiKey = process.env.GEMINI_API_KEY;
      
      const configStatus = {
        configured: !!geminiKey,
        keyLength: geminiKey ? geminiKey.length : 0,
        keyPrefix: geminiKey ? geminiKey.substring(0, 10) + '...' : 'N/A',
        nodeEnv: process.env.NODE_ENV,
        allEnvVars: Object.keys(process.env).filter(k => k.includes('API') || k.includes('GEMINI') || k.includes('KEY')),
      };

      console.log('=== GEMINI CONFIG TEST ===');
      console.log('Config Status:', configStatus);
      console.log('========================');

      res.json(configStatus);
    } catch (error) {
      console.error('Error testing Gemini config:', error);
      res.status(500).json({ 
        error: 'Error testing configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
