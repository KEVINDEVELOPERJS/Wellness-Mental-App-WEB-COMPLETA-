import prisma from '../../config/database';
import { AlertaRiesgo, AuditoriaAlerta, AlertaDTO } from '../entities/AlertaRiesgo';
import { EstadoAlerta } from '@prisma/client';
import { EmailService } from '../../services/EmailService';
import { WebPushService } from '../../services/WebPushService';
import { SocketService } from '../../services/SocketService';

export class AlertaRiesgoRepository {
  static async create(alertaDTO: AlertaDTO, ip?: string, userAgent?: string): Promise<AlertaRiesgo> {
    return prisma.alertaRiesgo.create({
      data: {
        estudianteId: alertaDTO.estudianteId,
        tipo: alertaDTO.tipo,
        nivelRiesgo: alertaDTO.nivelRiesgo,
        extracto: alertaDTO.extracto,
        resultadoId: alertaDTO.resultadoId,
        chatSessionId: alertaDTO.chatSessionId,
        estado: 'PENDIENTE',
        ipOrigen: ip,
        userAgent,
      },
    });
  }

  static async findById(id: number): Promise<AlertaRiesgo | null> {
    return prisma.alertaRiesgo.findUnique({
      where: { id },
      include: {
        estudiante: {
          select: {
            id: true,
            nombre: true,
            email: true,
            grado: true,
          },
        },
      },
    });
  }

  static async findAll(filters?: {
    estado?: EstadoAlerta;
    nivelRiesgo?: string;
    page?: number;
    limit?: number;
  }): Promise<AlertaRiesgo[]> {
    const { estado, nivelRiesgo, page = 1, limit = 20 } = filters || {};
    const skip = (page - 1) * limit;

    return prisma.alertaRiesgo.findMany({
      where: {
        estado: estado || undefined,
        nivelRiesgo: nivelRiesgo as any || undefined,
      },
      include: {
        estudiante: {
          select: {
            id: true,
            nombre: true,
            email: true,
            grado: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit,
    });
  }

  static async getPendingAlerts(): Promise<AlertaRiesgo[]> {
    return this.findAll({ estado: 'PENDIENTE' });
  }

  static async updateEstado(
    id: number,
    estado: EstadoAlerta,
    notas?: string,
    ip?: string,
    userAgent?: string
  ): Promise<AlertaRiesgo> {
    const alerta = await this.findById(id);
    if (!alerta) throw new Error('Alert not found');

    // Create audit log
    await prisma.auditoriaAlerta.create({
      data: {
        alertaId: id,
        accion: `Estado cambiado a ${estado}`,
        ip,
        userAgent,
        detalles: notas,
      },
    });

    return prisma.alertaRiesgo.update({
      where: { id },
      data: {
        estado,
        notas,
      },
    });
  }

  static async getAuditoria(alertaId: number): Promise<AuditoriaAlerta[]> {
    return prisma.auditoriaAlerta.findMany({
      where: { alertaId },
      orderBy: { timestamp: 'desc' },
    });
  }

  static async generarAlertaEvaluacion(resultadoId: number, estudianteId: number): Promise<AlertaRiesgo | null> {
    const resultado = await prisma.resultado.findUnique({
      where: { id: resultadoId },
      include: { cuestionario: true },
    });

    if (!resultado || resultado.nivelRiesgo !== 'ALTO') return null;

    // Get student information for email before creating alert
    const estudiante = await prisma.usuario.findUnique({
      where: { id: estudianteId },
      select: { nombre: true, email: true }
    });

    const alerta = await this.create({
      estudianteId,
      tipo: 'evaluacion',
      nivelRiesgo: resultado.nivelRiesgo,
      extracto: `Evaluación ${resultado.cuestionario.titulo} con puntaje ${resultado.puntaje}`,
      resultadoId,
    });

    // Send automatic email notification for high-risk alerts
    try {
      if (estudiante) {
        const psicologoEmail = process.env.PSICOLOGO_EMAIL || 'psicologo@wellness.com';
        
        await EmailService.sendAlertEmail(psicologoEmail, {
          studentName: estudiante.nombre,
          riskLevel: resultado.nivelRiesgo,
          type: 'evaluacion',
          timestamp: new Date().toISOString(),
          excerpt: `Evaluación ${resultado.cuestionario.titulo} con puntaje ${resultado.puntaje}`,
        });
      }
    } catch (error) {
      console.error('Failed to send automatic email notification:', error);
    }

    // Send real-time notification via Socket.io
    try {
      const alertaConEstudiante = await this.findById(alerta.id);
      if (alertaConEstudiante) {
        SocketService.sendToPsychologists('nueva_alerta', alertaConEstudiante);
        
        // Send push notification to registered psychologists
        this.sendPushNotificationsToPsychologists(alertaConEstudiante);
      }
    } catch (error) {
      console.error('Failed to send socket notification:', error);
    }

    return alerta;
  }

  private static async sendPushNotificationsToPsychologists(alerta: AlertaRiesgo): Promise<void> {
    try {
      // In a real implementation, this would get psychologist push subscriptions from database
      // For now, we'll use a placeholder to demonstrate the functionality
      console.log('Push notifications would be sent to psychologists for alert:', alerta.id);
      
      // Example implementation (would require database schema changes):
      // const psicologos = await prisma.usuario.findMany({
      //   where: { rol: 'PSICOLOGO' },
      //   select: { pushSubscription: true }
      // });
      // const subscriptions = psicologos
      //   .map(p => p.pushSubscription)
      //   .filter((sub): sub is any => sub !== null);
      // if (subscriptions.length > 0) {
      //   await WebPushService.sendBulkNotifications(subscriptions, {
      //     title: `🚨 ALERTA DE ALTO RIESGO`,
      //     body: `Nueva alerta para estudiante: ${alerta.estudiante.nombre}`,
      //     data: { alertaId: alerta.id, type: 'high_risk_alert' }
      //   });
      // }
    } catch (error) {
      console.error('Failed to send push notifications:', error);
    }
  }

  static async generarAlertaChat(chatSessionId: number, estudianteId: number, extracto: string, nivelRiesgo: string = 'ALTO'): Promise<AlertaRiesgo> {
    const alerta = await this.create({
      estudianteId,
      tipo: 'chat',
      nivelRiesgo: nivelRiesgo as any,
      extracto,
      chatSessionId,
    });

    // Send automatic email notification for high-risk alerts
    if (nivelRiesgo === 'ALTO') {
      try {
        // Get student information for email
        const estudiante = await prisma.usuario.findUnique({
          where: { id: estudianteId },
          select: { nombre: true, email: true }
        });
        
        if (estudiante) {
          // Get psychologist email (in real implementation, would get assigned psychologist)
          const psicologoEmail = process.env.PSICOLOGO_EMAIL || 'psicologo@wellness.com';
          
          await EmailService.sendAlertEmail(psicologoEmail, {
            studentName: estudiante.nombre,
            riskLevel: alerta.nivelRiesgo,
            type: alerta.tipo,
            timestamp: alerta.timestamp.toISOString(),
            excerpt: alerta.extracto,
          });
        }
      } catch (error) {
        console.error('Failed to send automatic email notification:', error);
      }
    }

    // Send real-time notification via Socket.io
    try {
      const alertaConEstudiante = await this.findById(alerta.id);
      if (alertaConEstudiante) {
        SocketService.sendToPsychologists('nueva_alerta', alertaConEstudiante);
        
        // Send push notifications for high-risk alerts
        if (nivelRiesgo === 'ALTO') {
          this.sendPushNotificationsToPsychologists(alertaConEstudiante);
        }
      }
    } catch (error) {
      console.error('Failed to send socket notification:', error);
    }

    return alerta;
  }

  static async getAlertasByEstudiante(estudianteId: number): Promise<AlertaRiesgo[]> {
    return prisma.alertaRiesgo.findMany({
      where: { estudianteId },
      orderBy: { timestamp: 'desc' },
    });
  }

  static async getAlertasByPsicologo(psicologoId: number): Promise<AlertaRiesgo[]> {
    // In a real implementation, this would filter by assigned students
    // For now, return all pending alerts
    return this.getPendingAlerts();
  }
}
