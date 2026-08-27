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
        usuarioId: alertaDTO.usuarioId,
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
        usuario: {
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
        usuario: {
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

  static async generarAlertaEvaluacion(resultadoId: number, usuarioId: number): Promise<AlertaRiesgo | null> {
    console.log('🚨 Starting alert generation for resultado:', resultadoId, 'usuario:', usuarioId);
    
    const resultado = await prisma.resultado.findUnique({
      where: { id: resultadoId },
      include: { cuestionario: true },
    });

    if (!resultado || resultado.nivelRiesgo !== 'ALTO') {
      console.log('⚠️ No alert generated - resultado null or not high risk. Resultado:', resultado?.nivelRiesgo);
      return null;
    }

    console.log('✅ High risk detected, creating alert for:', resultado.nivelRiesgo);

    // Get student information for email before creating alert
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { nombre: true, email: true }
    });

    console.log('👤 Student info:', usuario?.nombre, usuario?.email);

    const alerta = await this.create({
      usuarioId,
      tipo: 'evaluacion',
      nivelRiesgo: resultado.nivelRiesgo,
      extracto: `Evaluación ${resultado.cuestionario.titulo} con puntaje ${resultado.puntaje}`,
      resultadoId,
    });

    console.log('✅ Alert created with ID:', alerta.id);

    // Send real-time notification via Socket.io (non-blocking)
    try {
      const alertaConUsuario = await this.findById(alerta.id);
      if (alertaConUsuario) {
        SocketService.sendToPsychologists('nueva_alerta', alertaConUsuario);
        
        // Send push notification to registered psychologists (async)
        this.sendPushNotificationsToPsychologists(alertaConUsuario);
      }
    } catch (error) {
      console.error('Failed to send socket notification:', error);
    }

    // Send automatic email notification to ALL registered psychologists (async, non-blocking)
    // This runs in background and doesn't block the API response
    setImmediate(async () => {
      try {
        if (usuario) {
          const psicologos = await prisma.usuario.findMany({
            where: { rol: 'PSICOLOGO', estado: 'ACTIVO' },
            select: { email: true, nombre: true }
          });

          console.log('👨‍⚕️ Found psychologists:', psicologos.length);
          psicologos.forEach(p => console.log('   -', p.nombre, p.email));

          if (psicologos.length === 0) {
            console.warn('⚠️ No active psychologists found in database');
          }

          for (const psicologo of psicologos) {
            console.log('📧 Sending email to:', psicologo.email);
            await EmailService.sendAlertEmail(psicologo.email, {
              studentName: usuario.nombre,
              riskLevel: resultado.nivelRiesgo,
              type: 'evaluacion',
              timestamp: new Date().toISOString(),
              excerpt: `Evaluación ${resultado.cuestionario.titulo} con puntaje ${resultado.puntaje}`,
            });
            console.log('✅ Email sent to:', psicologo.email);
          }
        } else {
          console.warn('⚠️ No student information found for email');
        }
      } catch (error) {
        console.error('❌ Failed to send automatic email notification:', error);
      }
    });

    // Send real-time notification via Socket.io
    try {
      const alertaConUsuario = await this.findById(alerta.id);
      if (alertaConUsuario) {
        SocketService.sendToPsychologists('nueva_alerta', alertaConUsuario);
        
        // Send push notification to registered psychologists
        this.sendPushNotificationsToPsychologists(alertaConUsuario);
      }
    } catch (error) {
      console.error('Failed to send socket notification:', error);
    }

    return alerta;
  }

  private static async sendPushNotificationsToPsychologists(alerta: AlertaRiesgo): Promise<void> {
    // Make this non-blocking as well
    setImmediate(async () => {
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
        //     body: `Nueva alerta para usuario: ${alerta.usuario.nombre}`,
        //     data: { alertaId: alerta.id, type: 'high_risk_alert' }
        //   });
        // }
      } catch (error) {
        console.error('Failed to send push notifications:', error);
      }
    });
  }

  static async generarAlertaChat(chatSessionId: number, usuarioId: number, extracto: string, nivelRiesgo: string = 'ALTO'): Promise<AlertaRiesgo> {
    const alerta = await this.create({
      usuarioId,
      tipo: 'chat',
      nivelRiesgo: nivelRiesgo as any,
      extracto,
      chatSessionId,
    });

    // Send real-time notification via Socket.io (non-blocking)
    try {
      const alertaConUsuario = await this.findById(alerta.id);
      if (alertaConUsuario) {
        SocketService.sendToPsychologists('nueva_alerta', alertaConUsuario);
        
        // Send push notifications for high-risk alerts (async)
        if (nivelRiesgo === 'ALTO') {
          this.sendPushNotificationsToPsychologists(alertaConUsuario);
        }
      }
    } catch (error) {
      console.error('Failed to send socket notification:', error);
    }

    // Send automatic email notification to ALL registered psychologists for high-risk alerts (async)
    if (nivelRiesgo === 'ALTO') {
      setImmediate(async () => {
        try {
          // Get student information for email
          const usuario = await prisma.usuario.findUnique({
            where: { id: usuarioId },
            select: { nombre: true, email: true }
          });
          
          if (usuario) {
            // Get ALL registered psychologists
            const psicologos = await prisma.usuario.findMany({
              where: { rol: 'PSICOLOGO', estado: 'ACTIVO' },
              select: { email: true, nombre: true }
            });

            for (const psicologo of psicologos) {
              await EmailService.sendAlertEmail(psicologo.email, {
                studentName: usuario.nombre,
                riskLevel: alerta.nivelRiesgo,
                type: alerta.tipo,
                timestamp: alerta.timestamp.toISOString(),
                excerpt: alerta.extracto,
              });
            }
          }
        } catch (error) {
          console.error('Failed to send automatic email notification:', error);
        }
      });
    }

    // Send real-time notification via Socket.io
    try {
      const alertaConUsuario = await this.findById(alerta.id);
      if (alertaConUsuario) {
        SocketService.sendToPsychologists('nueva_alerta', alertaConUsuario);
        
        // Send push notifications for high-risk alerts
        if (nivelRiesgo === 'ALTO') {
          this.sendPushNotificationsToPsychologists(alertaConUsuario);
        }
      }
    } catch (error) {
      console.error('Failed to send socket notification:', error);
    }

    return alerta;
  }

  static async getAlertasByUsuario(usuarioId: number): Promise<AlertaRiesgo[]> {
    return prisma.alertaRiesgo.findMany({
      where: { usuarioId },
      orderBy: { timestamp: 'desc' },
    });
  }

  static async getAlertasByPsicologo(psicologoId: number): Promise<AlertaRiesgo[]> {
    // In a real implementation, this would filter by assigned students
    // For now, return all pending alerts
    return this.getPendingAlerts();
  }
}
