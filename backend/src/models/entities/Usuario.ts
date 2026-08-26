import { Rol, EstadoUsuario } from '@prisma/client';

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  passwordHash: string;
  edad: number;
  grado: string;
  rol: Rol;
  fechaRegistro: Date;
  estado: EstadoUsuario;
  consentimientoPadres: boolean;
  codigoInvitacionPadre?: string;
  avatar?: string;
  telefono?: string;
}

export interface UsuarioDTO {
  nombre: string;
  email: string;
  password: string;
  edad: number;
  grado: string;
  telefono?: string;
  rol?: 'ESTUDIANTE' | 'PSICOLOGO';
  codigoVerificacion?: string;
}

export interface AuthResult {
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
