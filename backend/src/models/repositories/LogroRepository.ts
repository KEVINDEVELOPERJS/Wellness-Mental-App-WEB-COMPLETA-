import prisma from '../../config/database';
import { Logro, UsuarioLogro, NivelUsuario } from '../entities/Logro';
import { NIVELES } from '../entities/Logro';

export class LogroRepository {
  static async findAll(): Promise<Logro[]> {
    return prisma.logro.findMany({
      orderBy: { puntos: 'desc' },
    });
  }

  static async findById(id: number): Promise<Logro | null> {
    return prisma.logro.findUnique({
      where: { id },
    });
  }

  static async getUserLogros(usuarioId: number): Promise<UsuarioLogro[]> {
    return prisma.usuarioLogro.findMany({
      where: { usuarioId },
      include: { logro: true },
      orderBy: { fechaDesbloqueado: 'desc' },
    });
  }

  static async unlockLogro(usuarioId: number, logroId: number): Promise<UsuarioLogro> {
    return prisma.usuarioLogro.create({
      data: {
        usuarioId,
        logroId,
      },
    });
  }

  static async checkAndUnlockLogros(usuarioId: number, userStats: any): Promise<Logro[]> {
    const allLogros = await this.findAll();
    const userLogros = await this.getUserLogros(usuarioId);
    const unlockedIds = new Set(userLogros.map(ul => ul.logroId));

    const newlyUnlocked: Logro[] = [];

    for (const logro of allLogros) {
      if (unlockedIds.has(logro.id)) continue;

      const criterio = JSON.parse(logro.criterio);
      let shouldUnlock = false;

      switch (criterio.tipo) {
        case 'primer_chat':
          shouldUnlock = userStats.chatsRealizados > 0;
          break;
        case 'racha_dias':
          shouldUnlock = userStats.rachaDias >= criterio.dias;
          break;
        case 'ejercicios_completados':
          shouldUnlock = userStats.ejerciciosCompletados >= criterio.cantidad;
          break;
        case 'primera_evaluacion':
          shouldUnlock = userStats.evaluacionesCompletadas > 0;
          break;
        case 'primer_post':
          shouldUnlock = userStats.postsComunidad > 0;
          break;
        case 'nivel':
          shouldUnlock = userStats.nivel === criterio.nivel;
          break;
      }

      if (shouldUnlock) {
        await this.unlockLogro(usuarioId, logro.id);
        newlyUnlocked.push(logro);
      }
    }

    return newlyUnlocked;
  }

  static async calculateNivel(usuarioId: number): Promise<NivelUsuario> {
    const userLogros = await this.getUserLogros(usuarioId);
    const puntos = userLogros.reduce((sum, ul) => sum + ul.logro.puntos, 0);

    let nivelInfo = NIVELES[0];
    for (const nivel of NIVELES) {
      if (puntos >= nivel.minPuntos) {
        nivelInfo = nivel;
      } else {
        break;
      }
    }

    const progreso = nivelInfo.maxPuntos === Infinity 
      ? 100 
      : ((puntos - nivelInfo.minPuntos) / (nivelInfo.maxPuntos - nivelInfo.minPuntos)) * 100;

    return {
      nivel: nivelInfo.nombre,
      puntosActuales: puntos,
      puntosSiguienteNivel: nivelInfo.maxPuntos === Infinity ? puntos : nivelInfo.maxPuntos,
      progreso: Math.min(100, Math.max(0, progreso)),
    };
  }

  static async otorgarPuntos(usuarioId: number, tipoActividad: string, cantidad: number): Promise<void> {
    // Points are calculated based on achievements, not directly stored
    // This method triggers achievement checking
    const userStats = {
      ejerciciosCompletados: await prisma.progresoEjercicio.count({ where: { usuarioId, completado: true } }),
      chatsRealizados: await prisma.chatSession.count({ where: { usuarioId } }),
      evaluacionesCompletadas: await prisma.resultado.count({ where: { usuarioId } }),
      postsComunidad: await prisma.postComunidad.count({ where: { usuarioId } }),
      rachaDias: 0, // Will be calculated
    };

    // Calculate streak
    const progresos = await prisma.progresoEjercicio.findMany({
      where: { usuarioId, completado: true },
      orderBy: { fechaCompletado: 'desc' },
      take: 30,
    });

    let racha = 0;
    let currentDate = new Date();
    for (const prog of progresos) {
      const diffDays = Math.floor((currentDate.getTime() - prog.fechaCompletado.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        racha++;
        currentDate = prog.fechaCompletado;
      } else {
        break;
      }
    }
    userStats.rachaDias = racha;

    await this.checkAndUnlockLogros(usuarioId, userStats);
  }
}
