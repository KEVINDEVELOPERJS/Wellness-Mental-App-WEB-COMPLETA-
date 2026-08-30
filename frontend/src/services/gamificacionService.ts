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

  async addPuntos(puntos: number, tipoJuego: string = 'JUEGO_CALMA_MATCH', combo: number = 0, duracion: number = 0): Promise<any> {
    const response = await apiClient.post('/gamificacion/puntos', { tipoActividad: tipoJuego, cantidad: puntos, combo, duracion });
    return response.data;
  },

  async getMisionesDiarias(): Promise<any> {
    try {
      const response = await apiClient.get('/gamificacion/misiones-diarias');
      return response.data;
    } catch (error) {
      console.log('Misiones diarias endpoint not available, returning empty array');
      return [];
    }
  },

  async getRankingCalmaMatch(): Promise<any> {
    try {
      const response = await apiClient.get('/gamificacion/ranking/calma-match');
      return response.data;
    } catch (error) {
      console.log('Ranking Calma Match endpoint not available, returning empty array');
      return [];
    }
  },

  async getEstadoGamificacion(): Promise<any> {
    try {
      const response = await apiClient.get('/gamificacion/estado');
      return response.data;
    } catch (error) {
      console.log('Estado gamificacion endpoint not available, returning default state');
      return {
        rachaActividad: 0,
        minutosRestantesHoy: 30,
        posicionRanking: 0,
        misionesCompletadasHoy: 0,
        misionesTotalesHoy: 3
      };
    }
  },

  async registrarSesionJuego(tipoJuego: string, puntos: number, combo: number, duracion: number): Promise<any> {
    try {
      const response = await apiClient.post('/gamificacion/sesion-juego', { 
        tipoJuego, 
        puntos, 
        combo, 
        duracion 
      });
      return response.data;
    } catch (error) {
      console.log('Sesion juego endpoint not available, returning mock response');
      return {
        puntosGanados: Math.floor(puntos / 10),
        nivelSubido: false,
        logrosDesbloqueados: []
      };
    }
  },
};
