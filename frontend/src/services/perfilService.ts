import apiClient from './apiClient';
import type { Usuario } from '../types/usuario';

/**
 * Servicio de perfil: sincroniza los datos del usuario (incluida la foto) con
 * el backend para que persistan en cualquier dispositivo donde inicie sesión.
 */
export const perfilService = {
  /** Obtiene el perfil completo del usuario autenticado. */
  async getPerfil(): Promise<Usuario> {
    const response = await apiClient.get<Usuario>('/perfil');
    return response.data;
  },

  /** Actualiza el perfil (nombre, teléfono, avatar). */
  async actualizarPerfil(data: { nombre?: string; telefono?: string; avatar?: string }): Promise<Usuario> {
    const response = await apiClient.patch<Usuario>('/perfil', data);
    return response.data;
  },

  /** Guarda la foto de perfil (avatar) en el backend. */
  async guardarAvatar(avatar: string): Promise<Usuario> {
    const response = await apiClient.patch<Usuario>('/perfil', { avatar });
    return response.data;
  },

  /** Elimina la foto de perfil. */
  async eliminarAvatar(): Promise<Usuario> {
    const response = await apiClient.patch<Usuario>('/perfil', { avatar: '' });
    return response.data;
  },

  /** Cambia la contraseña de la cuenta. */
  async cambiarPassword(passwordActual: string, passwordNueva: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/perfil/password', {
      passwordActual,
      passwordNueva,
    });
    return response.data;
  },

  /** Genera el secreto/QR para activar 2FA. */
  async activar2FA(): Promise<{ secret: string; qrCode: string; message: string }> {
    const response = await apiClient.post<{ secret: string; qrCode: string; message: string }>('/perfil/2fa/activar');
    return response.data;
  },

  /** Valida el código 2FA y confirma la activación. */
  async validar2FA(codigo: string, secret: string): Promise<{ valido: boolean }> {
    const response = await apiClient.post<{ valido: boolean }>('/perfil/2fa/validar', { codigo, secret });
    return response.data;
  },

  /** Genera un código de invitación para padres/tutores. */
  async generarInvitacionPadre(): Promise<{ codigo: string; validoPor: string }> {
    const response = await apiClient.post<{ codigo: string; validoPor: string }>('/perfil/invitacion-padre');
    return response.data;
  },

  /** Revoca el acceso parental. */
  async revocarAccesoPadre(): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>('/perfil/acceso-padre');
    return response.data;
  },

  /** Descarga los datos del usuario. */
  async descargarDatos(): Promise<Blob> {
    const response = await apiClient.get('/perfil/descargar-datos', { responseType: 'blob' });
    return response.data as Blob;
  },

  /** Guarda preferencias de notificaciones / tema en el backend. */
  async actualizarNotificaciones(data: {
    notificacionesChat?: boolean;
    notificacionesEjercicios?: boolean;
    notificacionesComunidad?: boolean;
    notificacionesAlertas?: boolean;
    temaOscuro?: boolean;
  }): Promise<unknown> {
    const response = await apiClient.patch('/perfil/notificaciones', data);
    return response.data;
  },
};
