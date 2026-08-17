import apiClient from './apiClient';
import { Cuestionario, Respuesta, Resultado } from '../types/cuestionario';

export const evaluacionService = {
  async getCuestionarios(): Promise<Cuestionario[]> {
    try {
      const response = await apiClient.get<Cuestionario[]>('/evaluacion/cuestionarios');
      return response.data;
    } catch (error) {
      console.error('Error in getCuestionarios:', error);
      throw error;
    }
  },

  async getCuestionario(id: number): Promise<Cuestionario> {
    try {
      const response = await apiClient.get<Cuestionario>(`/evaluacion/cuestionarios/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error in getCuestionario:', error);
      throw error;
    }
  },

  async validarRespuestas(cuestionarioId: number, respuestas: Respuesta[]): Promise<{ completas: boolean }> {
    try {
      const response = await apiClient.post<{ completas: boolean }>('/evaluacion/validar', {
        cuestionarioId,
        respuestas,
      });
      return response.data;
    } catch (error) {
      console.error('Error in validarRespuestas:', error);
      throw error;
    }
  },

  async calcularPuntaje(cuestionarioId: number): Promise<{ puntaje: number }> {
    try {
      const response = await apiClient.post<{ puntaje: number }>('/evaluacion/calcular', { cuestionarioId });
      return response.data;
    } catch (error) {
      console.error('Error in calcularPuntaje:', error);
      throw error;
    }
  },

  async clasificarRiesgo(puntaje: number, cuestionarioId: number): Promise<{ nivelRiesgo: string }> {
    try {
      const response = await apiClient.post<{ nivelRiesgo: string }>('/evaluacion/clasificar', {
        puntaje,
        cuestionarioId,
      });
      return response.data;
    } catch (error) {
      console.error('Error in clasificarRiesgo:', error);
      throw error;
    }
  },

  async generarPrediagnostico(nivelRiesgo: string, respuestas: Respuesta[]): Promise<{ prediagnostico: string }> {
    try {
      const response = await apiClient.post<{ prediagnostico: string }>('/evaluacion/prediagnostico', {
        nivelRiesgo,
        respuestas,
      });
      return response.data;
    } catch (error) {
      console.error('Error in generarPrediagnostico:', error);
      throw error;
    }
  },

  async guardarEvaluacion(cuestionarioId: number, respuestas: Respuesta[]): Promise<Resultado> {
    try {
      console.log('Calling guardarEvaluacion with:', { cuestionarioId, respuestas });
      const response = await apiClient.post<{ resultado: Resultado }>('/evaluacion/guardar', {
        cuestionarioId,
        respuestas,
      });
      console.log('Response from guardarEvaluacion:', response.data);
      return response.data.resultado;
    } catch (error) {
      console.error('Error in guardarEvaluacion:', error);
      throw error;
    }
  },

  async getResultados(): Promise<Resultado[]> {
    try {
      const response = await apiClient.get<Resultado[]>('/evaluacion/resultados');
      return response.data;
    } catch (error) {
      console.error('Error in getResultados:', error);
      throw error;
    }
  },

  async getResultado(id: number): Promise<Resultado> {
    try {
      console.log('Calling getResultado with id:', id);
      const response = await apiClient.get<Resultado>(`/evaluacion/resultados/${id}`);
      console.log('Response from getResultado:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getResultado:', error);
      throw error;
    }
  },

  async importarEscalaValidada(tipo: string): Promise<any> {
    try {
      const response = await apiClient.get(`/evaluacion/cuestionarios/escalas/${tipo}`);
      return response.data;
    } catch (error) {
      console.error('Error in importarEscalaValidada:', error);
      throw error;
    }
  },
};
