import prisma from '../../config/database';
import { Logro, UsuarioLogro, NivelUsuario } from '../entities/Logro';
import { resolverNivel } from '../entities/Logro';

export class LogroRepository {
  static async findAll(): Promise<Logro[]> {
    const logros = await prisma.logro.findMany({
      orderBy: { puntos: 'desc' },
    });

    // Los seeds anteriores duplicaron logros (no existe constraint único en
    // `nombre`). Deduplicamos para que cada logro aparezca una sola vez en la UI.
    const seen = new Set<string>();
    return logros.filter((logro) => {
      const key = logro.nombre.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
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

    // Puntos totales reales del usuario (fuente de verdad: tabla PuntosUsuario,
    // con respaldo en la suma de sesiones de juego). Si no se pueden obtener,
    // se asume 0 para no bloquear el resto del flujo.
    let puntosTotales = 0;
    try {
      puntosTotales = await this.getPuntosUsuario(usuarioId);
    } catch (error: unknown) {
      console.error('Error obteniendo puntos del usuario para logros:', error);
    }

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
        case 'nivel': {
          // El nivel se resuelve con los puntos reales acumulados del usuario,
          // no con la cadena de otro helper (antes nunca coincidía con MAESTRO).
          const nivelInfo = resolverNivel(puntosTotales);
          const normalizar = (texto: string) =>
            texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
          shouldUnlock = normalizar(nivelInfo.nombre) === normalizar(String(criterio.nivel || ''));
          break;
        }
        case 'puntos':
        case 'puntos_juegos':
          // Logros cuyo desbloqueo depende de un umbral de puntos.
          shouldUnlock = puntosTotales >= (typeof criterio.puntos === 'number' ? criterio.puntos : logro.puntos);
          break;
        default:
          break;
      }

      // Reconocimiento por puntos: si el usuario ya acumula al menos los puntos
      // del logro, se desbloquea igualmente (la UI muestra cada logro como
      // desbloqueado o no según si el usuario tiene más o menos puntos).
      if (!shouldUnlock && puntosTotales >= logro.puntos) {
        shouldUnlock = true;
      }

      if (shouldUnlock) {
        await this.unlockLogro(usuarioId, logro.id);
        newlyUnlocked.push(logro);
      }
    }

    return newlyUnlocked;
  }

  /**
   * Devuelve los puntos de XP acumulados de un usuario.
   *
   * Fuente de verdad: tabla `PuntosUsuario`. Si el usuario aún no tiene fila,
   * se calcula un valor de respaldo sumando sus sesiones de juego y se
   * materializa la fila para que los siguientes cálculos sean consistentes.
   */
  static async getPuntosUsuario(usuarioId: number): Promise<number> {
    try {
      const registro = await prisma.puntosUsuario.findUnique({
        where: { usuarioId },
      });

      if (registro) {
        return registro.puntosTotales;
      }

      // Fallback: derivar de las sesiones de juego existentes.
      const agregado = await prisma.sesionJuego.aggregate({
        where: { usuarioId },
        _sum: { puntos: true },
      });
      const puntosDerivados = agregado._sum.puntos ?? 0;

      await prisma.puntosUsuario.create({
        data: {
          usuarioId,
          puntosTotales: puntosDerivados,
          puntosJuegos: puntosDerivados,
        },
      });

      return puntosDerivados;
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      if (code === 'P2021') {
        // Tabla aún no migrada: degradar a la suma de sesiones de juego.
        console.log('PuntosUsuario table does not exist yet, deriving from SesionJuego');
        const agregado = await prisma.sesionJuego.aggregate({
          where: { usuarioId },
          _sum: { puntos: true },
        });
        return agregado._sum.puntos ?? 0;
      }
      throw error;
    }
  }

  static async calculateNivel(usuarioId: number): Promise<NivelUsuario> {
    const puntos = await this.getPuntosUsuario(usuarioId);
    const nivelInfo = resolverNivel(puntos);

    const esNivelMaximo = nivelInfo.maxPuntos === Infinity;
    const rangoNivel = nivelInfo.maxPuntos - nivelInfo.minPuntos;
    const progreso = esNivelMaximo || rangoNivel <= 0
      ? 100
      : ((puntos - nivelInfo.minPuntos) / rangoNivel) * 100;

    return {
      nivel: nivelInfo.nombre,
      puntosActuales: puntos,
      puntosSiguienteNivel: esNivelMaximo ? puntos : nivelInfo.maxPuntos,
      progreso: Math.min(100, Math.max(0, progreso)),
    };
  }

  static async otorgarPuntos(usuarioId: number, tipoActividad: string, cantidad: number, combo: number = 0, duracion: number = 0): Promise<void> {
    // Puntos saneados: nunca negativos, siempre enteros.
    const puntosGanados = Number.isFinite(cantidad) ? Math.max(0, Math.floor(cantidad)) : 0;

    // Store game session in the new SesionJuego table
    const gameTypeMap: Record<string, string> = {
      'JUEGO_CALMA_MATCH': 'calma-match',
      'JUEGO_PUZZLE_ZEN': 'puzzle-zen',
      'JUEGO_ARTE_EMOCIONAL': 'arte-emocional',
      'JUEGO_RITMO_CALMA': 'ritmo-calma',
      'JUEGO_JARDIN_MENTAL': 'jardin-mental',
      'JUEGO_RESPIRA_ZEN': 'respira-zen',
      'JUEGO_POP_ESTRES': 'pop-estres',
      'JUEGO_FLUJO_ZEN': 'flujo-zen',
      'JUEGO_MEMO_SERENO': 'memo-sereno',
      'JUEGO_ORDENA_ZEN': 'ordena-zen',
      'JUEGO_MENTE_GUERRERA': 'mente-guerrera',
    };

    const tipoJuego = gameTypeMap[tipoActividad] || tipoActividad.toLowerCase();

    // Try to create game session, but don't fail if table doesn't exist yet
    try {
      await prisma.sesionJuego.create({
        data: {
          usuarioId,
          tipoJuego,
          puntos: puntosGanados,
          combo: combo,
          duracion: duracion,
        }
      });
    } catch (error: unknown) {
      // If table doesn't exist, log the error but continue with achievement logic
      if ((error as { code?: string }).code === 'P2021') {
        console.log('SesionJuego table does not exist yet, skipping session storage');
      } else {
        console.error('Error creating game session:', error);
      }
    }

    // --- Acumulación de XP por usuario (fuente de verdad de los niveles) ---
    // Se usa upsert atómico para evitar condiciones de carrera y asegurar que
    // TODOS los juegos (incluidos los nuevos) incrementen el nivel del usuario.
    try {
      await prisma.puntosUsuario.upsert({
        where: { usuarioId },
        create: {
          usuarioId,
          puntosTotales: puntosGanados,
          puntosJuegos: puntosGanados,
        },
        update: {
          puntosTotales: { increment: puntosGanados },
          puntosJuegos: { increment: puntosGanados },
        },
      });
    } catch (error: unknown) {
      if ((error as { code?: string }).code === 'P2021') {
        console.log('PuntosUsuario table does not exist yet, skipping XP accumulation');
      } else {
        console.error('Error accumulating user points:', error);
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
    let userTotalPoints = puntosGanados; // Default to current session points if table doesn't exist
    
    try {
      const totalGamePoints = await prisma.sesionJuego.aggregate({
        where: { usuarioId },
        _sum: { puntos: true }
      });

      userTotalPoints = totalGamePoints._sum.puntos ?? puntosGanados;
    } catch (error: unknown) {
      // If table doesn't exist, use current session points
      if ((error as { code?: string }).code === 'P2021') {
        console.log('SesionJuego table does not exist yet, using current session points');
        userTotalPoints = puntosGanados;
      } else {
        console.error('Error calculating total game points:', error);
        userTotalPoints = puntosGanados;
      }
    }

    // Check if user already has this game logro
    const existingGameLogro = await prisma.usuarioLogro.findFirst({
      where: {
        usuarioId,
        logroId: gameLogro.id
      }
    });

    if (!existingGameLogro) {
      // Create the join row once; el valor de `puntos` del logro ya no se
      // sobrescribe por usuario (antes corrompía el nivel de otros usuarios).
      await prisma.usuarioLogro.create({
        data: {
          usuarioId,
          logroId: gameLogro.id,
        }
      });
    }

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
