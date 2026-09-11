export interface Logro {
  id: number;
  nombre: string;
  descripcion: string;
  puntos: number;
  criterio: string;
  icono?: string;
}

export interface UsuarioLogro {
  id: number;
  usuarioId: number;
  logroId: number;
  fechaDesbloqueado: Date;
}

export interface NivelUsuario {
  nivel: string;
  puntosActuales: number;
  puntosSiguienteNivel: number;
  progreso: number;
}

/** Definición de un nivel del sistema de progresión. */
export interface NivelDefinicion {
  nombre: string;
  minPuntos: number;
  maxPuntos: number;
}

/**
 * Niveles del sistema. Los umbrales son progresivos y alcanzables mediante la
 * práctica regular de juegos y ejercicios (cada partida otorga puntos de XP).
 */
export const NIVELES: readonly NivelDefinicion[] = [
  { nombre: 'Explorador Mental', minPuntos: 0, maxPuntos: 150 },
  { nombre: 'Aprendiz de Calma', minPuntos: 150, maxPuntos: 400 },
  { nombre: 'Guardián Sereno', minPuntos: 400, maxPuntos: 800 },
  { nombre: 'Maestro del Equilibrio', minPuntos: 800, maxPuntos: 1500 },
  { nombre: 'Sabio Interior', minPuntos: 1500, maxPuntos: 2500 },
  { nombre: 'Líder Mental', minPuntos: 2500, maxPuntos: Infinity },
] as const;

/**
 * Resuelve el nivel que corresponde a una cantidad de puntos.
 * Acepta puntos negativos (los trata como 0) y siempre devuelve un nivel válido.
 */
export function resolverNivel(puntos: number): NivelDefinicion {
  const puntosSeguros = Number.isFinite(puntos) ? Math.max(0, puntos) : 0;
  let nivelActual: NivelDefinicion = NIVELES[0]!;
  for (const nivel of NIVELES) {
    if (puntosSeguros >= nivel.minPuntos) {
      nivelActual = nivel;
    } else {
      break;
    }
  }
  return nivelActual;
}
