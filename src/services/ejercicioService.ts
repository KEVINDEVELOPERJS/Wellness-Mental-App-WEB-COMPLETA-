import apiClient from './apiClient';
import { Ejercicio, ProgresoEjercicio, ProgresoDTO } from '../types/ejercicio';

export const ejercicioService = {
  async getEjercicios(): Promise<Ejercicio[]> {
    const response = await apiClient.get<Ejercicio[]>('/ejercicios');
    return response.data;
  },

  async getEjercicio(id: number): Promise<Ejercicio> {
    const response = await apiClient.get<Ejercicio>(`/ejercicios/${id}`);
    return response.data;
  },

  async getEjerciciosPorTipo(tipo: string): Promise<Ejercicio[]> {
    const response = await apiClient.get<Ejercicio[]>(`/ejercicios/tipo/${tipo}`);
    return response.data;
  },

  async iniciarEjercicio(id: number, duracion: number): Promise<any> {
    const response = await apiClient.post(`/ejercicios/${id}/iniciar`, { duracion });
    return response.data;
  },

  async registrarProgreso(progreso: ProgresoDTO): Promise<ProgresoEjercicio> {
    const response = await apiClient.post<ProgresoEjercicio>('/ejercicios/progreso', progreso);
    return response.data;
  },

  async getProgreso(): Promise<ProgresoEjercicio[]> {
    const response = await apiClient.get<ProgresoEjercicio[]>('/ejercicios/progreso');
    return response.data;
  },

  async getRacha(): Promise<{ rachaDias: number }> {
    const response = await apiClient.get<{ rachaDias: number }>('/ejercicios/racha');
    return response.data;
  },

  async getTiempoHoy(): Promise<{ tiempoMinutos: number; tiempoRestante: number }> {
    const response = await apiClient.get<{ tiempoMinutos: number; tiempoRestante: number }>('/ejercicios/tiempo-hoy');
    return response.data;
  },
};
