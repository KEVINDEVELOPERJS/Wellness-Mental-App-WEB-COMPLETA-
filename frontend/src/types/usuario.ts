export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  edad: number;
  grado: string;
  rol: 'USUARIO' | 'PSICOLOGO' | 'PADRE' | 'ADMIN';
  avatar?: string;
  telefono?: string;
  fechaRegistro: string;
  consentimientoPadres: boolean;
}

export interface UsuarioDTO {
  nombre: string;
  email: string;
  password: string;
  edad: number;
  grado: string;
  telefono?: string;
  rol?: 'USUARIO' | 'PSICOLOGO';
  codigoVerificacion?: string;
}

export interface AuthResponse {
  usuario: Usuario;
  accessToken: string;
  refreshToken: string;
}

export interface EstadisticasUsuario {
  ejerciciosCompletados: number;
  chatsRealizados: number;
  evaluacionesCompletadas: number;
  postsComunidad: number;
  puntos: number;
  nivel: string;
  rachaDias: number;
}
