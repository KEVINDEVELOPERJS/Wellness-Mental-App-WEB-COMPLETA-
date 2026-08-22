import apiClient from './apiClient';
import { Cuestionario, Respuesta, Resultado } from '../types/cuestionario';

// VERSION 2026-08-22-23-00 - PERFORMANCE FIX - Async email sending
console.log('EVALUACION SERVICE UPDATED - VERSION 2026-08-22-23-00 - ASYNC EMAIL FIX');
console.log('WELLNESS MENTAL APP - VERSION 2026-08-22-23-00 - ASYNC EMAIL FIX - CACHE BREAK FORCED');
console.log('DEPLOYMENT TIMESTAMP:', new Date().toISOString());
console.log('BUILD ID: async-email-fix');

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
    const startTime = Date.now();
    try {
      console.log('Calling guardarEvaluacion with:', { cuestionarioId, respuestas });
      console.log('🕐 Starting evaluation submission at:', new Date().toISOString());
      
      const response = await apiClient.post<{ resultado: Resultado }>('/evaluacion/guardar', {
        cuestionarioId,
        respuestas,
      });
      
      const duration = Date.now() - startTime;
      console.log('✅ Evaluation submission completed in:', duration, 'ms');
      console.log('Response from guardarEvaluacion:', response.data);
      console.log('Response structure:', {
        hasResultado: !!response.data.resultado,
        resultadoKeys: response.data.resultado ? Object.keys(response.data.resultado) : [],
        resultadoId: response.data.resultado?.id,
        resultadoIdType: typeof response.data.resultado?.id
      });
      
      if (!response.data.resultado) {
        console.error('Invalid response structure - missing resultado:', response.data);
        throw new Error('Invalid response: missing result object');
      }
      
      if (!response.data.resultado.id || typeof response.data.resultado.id !== 'number') {
        console.error('Invalid response structure - invalid id:', {
          id: response.data.resultado.id,
          idType: typeof response.data.resultado.id,
          fullResultado: response.data.resultado
        });
        throw new Error(`Invalid response: result.id is invalid (value: ${response.data.resultado.id}, type: ${typeof response.data.resultado.id})`);
      }
      
      return response.data.resultado;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('❌ Evaluation submission failed after:', duration, 'ms');
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
      console.log('Calling getResultado with id:', id, 'Type:', typeof id);
      if (typeof id !== 'number' || isNaN(id) || id <= 0) {
        throw new Error(`Invalid result ID: ${id} (type: ${typeof id})`);
      }
      
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
