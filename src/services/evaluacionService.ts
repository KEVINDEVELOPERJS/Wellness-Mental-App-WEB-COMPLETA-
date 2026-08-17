import apiClient from './apiClient';
import { Cuestionario, Respuesta, Resultado } from '../types/cuestionario';

export const evaluacionService = {
  async getCuestionarios(): Promise<Cuestionario[]> {
    const response = await apiClient.get<Cuestionario[]>('/evaluacion/cuestionarios');
    return response.data;
  },

  async getCuestionario(id: number): Promise<Cuestionario> {
    const response = await apiClient.get<Cuestionario>(`/evaluacion/cuestionarios/${id}`);
    return response.data;
  },

  async validarRespuestas(cuestionarioId: number, respuestas: Respuesta[]): Promise<{ completas: boolean }> {
    const response = await apiClient.post<{ completas: boolean }>('/evaluacion/validar', {
      cuestionarioId,
      respuestas,
    });
    return response.data;
  },

  async calcularPuntaje(cuestionarioId: number): Promise<{ puntaje: number }> {
    const response = await apiClient.post<{ puntaje: number }>('/evaluacion/calcular', { cuestionarioId });
    return response.data;
  },

  async clasificarRiesgo(puntaje: number, cuestionarioId: number): Promise<{ nivelRiesgo: string }> {
    const response = await apiClient.post<{ nivelRiesgo: string }>('/evaluacion/clasificar', {
      puntaje,
      cuestionarioId,
    });
    return response.data;
  },

  async generarPrediagnostico(nivelRiesgo: string, respuestas: Respuesta[]): Promise<{ prediagnostico: string }> {
    const response = await apiClient.post<{ prediagnostico: string }>('/evaluacion/prediagnostico', {
      nivelRiesgo,
      respuestas,
    });
    return response.data;
  },

  async guardarEvaluacion(cuestionarioId: number, respuestas: Respuesta[]): Promise<Resultado> {
    const response = await apiClient.post<Resultado>('/evaluacion/guardar', {
      cuestionarioId,
      respuestas,
    });
    return response.data;
  },

  async getResultados(): Promise<Resultado[]> {
    const response = await apiClient.get<Resultado[]>('/evaluacion/resultados');
    return response.data;
  },

  async getResultado(id: number): Promise<Resultado> {
    const response = await apiClient.get<Resultado>(`/evaluacion/resultados/${id}`);
    return response.data;
  },

  async importarEscalaValidada(tipo: string): Promise<any> {
    const response = await apiClient.get(`/evaluacion/cuestionarios/escalas/${tipo}`);
    return response.data;
  },
};
