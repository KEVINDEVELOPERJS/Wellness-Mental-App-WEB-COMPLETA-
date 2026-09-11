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
  logro: Logro;
  fechaDesbloqueado: string;
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
 * Niveles del sistema. Debe mantenerse sincronizado con `NIVELES` del backend
 * (`backend/src/models/entities/Logro.ts`).
 */
export const NIVELES: readonly NivelDefinicion[] = [
  { nombre: 'Explorador Mental', minPuntos: 0, maxPuntos: 150 },
  { nombre: 'Aprendiz de Calma', minPuntos: 150, maxPuntos: 400 },
  { nombre: 'Guardián Sereno', minPuntos: 400, maxPuntos: 800 },
  { nombre: 'Maestro del Equilibrio', minPuntos: 800, maxPuntos: 1500 },
  { nombre: 'Sabio Interior', minPuntos: 1500, maxPuntos: 2500 },
  { nombre: 'Líder Mental', minPuntos: 2500, maxPuntos: Infinity },
] as const;

/** Respuesta del endpoint `POST /gamificacion/puntos`. */
export interface PuntosOtorgadosResponse {
  message: string;
  puntosGanados: number;
  nivelSubido: boolean;
  nivel: NivelUsuario;
  nuevosLogros: Logro[];
}
