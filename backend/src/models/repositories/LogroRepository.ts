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

  static async otorgarPuntos(usuarioId: number, tipoActividad: string, cantidad: number, combo: number = 0, duracion: number = 0): Promise<void> {
    // Store game session in the new SesionJuego table
    const gameTypeMap: Record<string, string> = {
      'JUEGO_CALMA_MATCH': 'calma-match',
      'JUEGO_PUZZLE_ZEN': 'puzzle-zen',
      'JUEGO_ARTE_EMOCIONAL': 'arte-emocional',
      'JUEGO_RITMO_CALMA': 'ritmo-calma',
      'JUEGO_JARDIN_MENTAL': 'jardin-mental',
    };

    const tipoJuego = gameTypeMap[tipoActividad] || tipoActividad.toLowerCase();

    // Try to create game session, but don't fail if table doesn't exist yet
    try {
      await prisma.sesionJuego.create({
        data: {
          usuarioId,
          tipoJuego,
          puntos: cantidad,
          combo: combo,
          duracion: duracion,
        }
      });
    } catch (error: any) {
      // If table doesn't exist, log the error but continue with achievement logic
      if (error.code === 'P2021') {
        console.log('SesionJuego table does not exist yet, skipping session storage');
      } else {
        console.error('Error creating game session:', error);
      }
    }

    // Create a custom achievement entry for game points
    // First, let's check if there's a special game achievement logro, create one if not
    let gameLogro = await prisma.logro.findFirst({
      where: { nombre: 'Puntos de Juegos' }
    });

    if (!gameLogro) {
      gameLogro = await prisma.logro.create({
        data: {
          nombre: 'Puntos de Juegos',
          descripcion: 'Puntos acumulados en mini-juegos',
          icono: '🎮',
          puntos: 0, // This will be dynamic
          criterio: JSON.stringify({ tipo: 'puntos_juegos' }),
        }
      });
    }

    // Calculate total game points for this user
    let userTotalPoints = cantidad; // Default to current session points if table doesn't exist
    
    try {
      const totalGamePoints = await prisma.sesionJuego.aggregate({
        where: { usuarioId },
        _sum: { puntos: true }
      });

      userTotalPoints = totalGamePoints._sum.puntos || cantidad;
    } catch (error: any) {
      // If table doesn't exist, use current session points
      if (error.code === 'P2021') {
        console.log('SesionJuego table does not exist yet, using current session points');
        userTotalPoints = cantidad;
      } else {
        console.error('Error calculating total game points:', error);
        userTotalPoints = cantidad;
      }
    }

    // Check if user already has this game logro
    const existingGameLogro = await prisma.usuarioLogro.findFirst({
      where: {
        usuarioId,
        logroId: gameLogro.id
      }
    });

    if (existingGameLogro) {
      // Update the points value by deleting and recreating with new points
      await prisma.usuarioLogro.delete({
        where: { id: existingGameLogro.id }
      });
    }

    // Create new entry with accumulated points
    await prisma.usuarioLogro.create({
      data: {
        usuarioId,
        logroId: gameLogro.id,
      }
    });

    // Update the special game logro points to reflect total game points
    await prisma.logro.update({
      where: { id: gameLogro.id },
      data: { puntos: userTotalPoints }
    });

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
