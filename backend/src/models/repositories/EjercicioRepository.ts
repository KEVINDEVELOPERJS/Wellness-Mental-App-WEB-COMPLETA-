import prisma from '../../config/database';
import { Ejercicio, ProgresoEjercicio, ProgresoDTO } from '../entities/Ejercicio';

export class EjercicioRepository {
  static async findAll(): Promise<Ejercicio[]> {
    return prisma.ejercicio.findMany({
      orderBy: { tipo: 'asc' },
    });
  }

  static async findById(id: number): Promise<Ejercicio | null> {
    return prisma.ejercicio.findUnique({
      where: { id },
    });
  }

  static async findByTipo(tipo: string): Promise<Ejercicio[]> {
    return prisma.ejercicio.findMany({
      where: { tipo: tipo as any },
    });
  }

  static async create(data: Omit<Ejercicio, 'id'>): Promise<Ejercicio> {
    return prisma.ejercicio.create({
      data,
    });
  }

  static async registrarProgreso(usuarioId: number, progreso: ProgresoDTO): Promise<ProgresoEjercicio> {
    return prisma.progresoEjercicio.create({
      data: {
        usuarioId,
        ejercicioId: progreso.ejercicioId,
        duracionReal: progreso.duracionReal,
        completado: progreso.completado,
        satisfaccion: progreso.satisfaccion,
      },
    });
  }

  static async getProgresoByUsuario(usuarioId: number): Promise<ProgresoEjercicio[]> {
    return prisma.progresoEjercicio.findMany({
      where: { usuarioId },
      include: { ejercicio: true },
      orderBy: { fechaCompletado: 'desc' },
    });
  }

  static async calcularRachaDias(usuarioId: number): Promise<number> {
    const progresos = await prisma.progresoEjercicio.findMany({
      where: {
        usuarioId,
        completado: true,
      },
      orderBy: { fechaCompletado: 'desc' },
      take: 60, // Check last 60 days
    });

    if (progresos.length === 0) return 0;

    let racha = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const progreso of progresos) {
      const progresoDate = new Date(progreso.fechaCompletado);
      progresoDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((currentDate.getTime() - progresoDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        racha++;
        currentDate = progresoDate;
      } else if (diffDays > 1) {
        break;
      }
    }

    return racha;
  }

  static async getTodayExerciseTime(usuarioId: number): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const progresos = await prisma.progresoEjercicio.findMany({
      where: {
        usuarioId,
        completado: true,
        fechaCompletado: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    return progresos.reduce((sum, p) => sum + p.duracionReal, 0);
  }

  static async validateTimeLimit(usuarioId: number, additionalMinutes: number): Promise<boolean> {
    const todayTime = await this.getTodayExerciseTime(usuarioId);
    return (todayTime + additionalMinutes) <= 30; // 30 minutes daily limit
  }
}
