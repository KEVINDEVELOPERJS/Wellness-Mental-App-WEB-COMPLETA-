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

export const NIVELES = [
  { nombre: 'Explorador Mental', minPuntos: 0, maxPuntos: 500 },
  { nombre: 'Guardián', minPuntos: 500, maxPuntos: 1500 },
  { nombre: 'Maestro', minPuntos: 1500, maxPuntos: 3000 },
  { nombre: 'Líder', minPuntos: 3000, maxPuntos: Infinity },
];
