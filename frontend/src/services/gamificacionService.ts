import apiClient from './apiClient';
import { Logro, UsuarioLogro, NivelUsuario } from '../types/logro';

export const gamificacionService = {
  async getLogros(): Promise<Logro[]> {
    const response = await apiClient.get<Logro[]>('/gamificacion/logros');
    return response.data;
  },

  async getUserLogros(): Promise<UsuarioLogro[]> {
    const response = await apiClient.get<UsuarioLogro[]>('/gamificacion/logros/usuario');
    return response.data;
  },

  async getNivel(): Promise<NivelUsuario> {
    const response = await apiClient.get<NivelUsuario>('/gamificacion/nivel');
    return response.data;
  },

  async otorgarPuntos(tipoActividad: string, cantidad: number): Promise<any> {
    const response = await apiClient.post('/gamificacion/puntos', { tipoActividad, cantidad });
    return response.data;
  },

  async verificarLogros(): Promise<any> {
    const response = await apiClient.post('/gamificacion/verificar-logros');
    return response.data;
  },

  async getEstadisticas(): Promise<any> {
    const response = await apiClient.get('/gamificacion/estadisticas');
    return response.data;
  },

  async getLeaderboard(): Promise<any> {
    const response = await apiClient.get('/gamificacion/leaderboard');
    return response.data;
  },
};
