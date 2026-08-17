import apiClient from './apiClient';

export interface Cuestionario {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  preguntas: Pregunta[];
  activo: boolean;
  fechaCreacion: string;
}

export interface Pregunta {
  id: number;
  texto: string;
  tipo: 'LIKERT' | 'ABIERTA' | 'OPCION_MULTIPLE';
  opciones?: string[];
  peso: number;
}

export interface CrearCuestionarioData {
  titulo: string;
  descripcion: string;
  categoria: string;
  preguntas: Pregunta[];
}

export const cuestionarioService = {
  async getCuestionarios(): Promise<Cuestionario[]> {
    const response = await apiClient.get<Cuestionario[]>('/cuestionarios');
    return response.data;
  },

  async getCuestionario(id: number): Promise<Cuestionario> {
    const response = await apiClient.get<Cuestionario>(`/cuestionarios/${id}`);
    return response.data;
  },

  async createCuestionario(data: CrearCuestionarioData): Promise<Cuestionario> {
    const response = await apiClient.post<Cuestionario>('/cuestionarios', data);
    return response.data;
  },

  async updateCuestionario(id: number, data: Partial<CrearCuestionarioData>): Promise<Cuestionario> {
    const response = await apiClient.put<Cuestionario>(`/cuestionarios/${id}`, data);
    return response.data;
  },

  async deleteCuestionario(id: number): Promise<void> {
    await apiClient.delete(`/cuestionarios/${id}`);
  },

  async activateCuestionario(id: number): Promise<Cuestionario> {
    const response = await apiClient.patch<Cuestionario>(`/cuestionarios/${id}/activar`);
    return response.data;
  },

  async deactivateCuestionario(id: number): Promise<Cuestionario> {
    const response = await apiClient.patch<Cuestionario>(`/cuestionarios/${id}/desactivar`);
    return response.data;
  },
};