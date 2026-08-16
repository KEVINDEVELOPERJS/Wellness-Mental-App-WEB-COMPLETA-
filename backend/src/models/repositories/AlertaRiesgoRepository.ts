import prisma from '../../config/database';
import { AlertaRiesgo, AuditoriaAlerta, AlertaDTO } from '../entities/AlertaRiesgo';
import { EstadoAlerta } from '@prisma/client';

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

    return this.create({
      estudianteId,
      tipo: 'evaluacion',
      nivelRiesgo: resultado.nivelRiesgo,
      extracto: `Evaluación ${resultado.cuestionario.titulo} con puntaje ${resultado.puntaje}`,
      resultadoId,
    });
  }

  static async generarAlertaChat(chatSessionId: number, estudianteId: number, extracto: string): Promise<AlertaRiesgo> {
    return this.create({
      estudianteId,
      tipo: 'chat',
      nivelRiesgo: 'ALTO',
      extracto,
      chatSessionId,
    });
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
