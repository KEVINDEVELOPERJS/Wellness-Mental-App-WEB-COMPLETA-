import apiClient from './apiClient';
import { AlertaRiesgo, AuditoriaAlerta } from '../types/alerta';

export const alertaService = {
  async generarAlertaEvaluacion(resultadoId: number): Promise<AlertaRiesgo> {
    const response = await apiClient.post<AlertaRiesgo>('/alertas/evaluacion', { resultadoId });
    return response.data;
  },

  async generarAlertaChat(chatSessionId: number, extracto: string): Promise<AlertaRiesgo> {
    const response = await apiClient.post<AlertaRiesgo>('/alertas/chat', {
      chatSessionId,
      extracto,
    });
    return response.data;
  },

  async crearAlertaManual(alertaData: any): Promise<AlertaRiesgo> {
    const response = await apiClient.post<AlertaRiesgo>('/alertas/manual', alertaData);
    return response.data;
  },

  async getAlertas(filters?: {
    estado?: string;
    nivelRiesgo?: string;
    page?: number;
    limit?: number;
  }): Promise<AlertaRiesgo[]> {
    const params = new URLSearchParams();
    if (filters?.estado) params.append('estado', filters.estado);
    if (filters?.nivelRiesgo) params.append('nivelRiesgo', filters.nivelRiesgo);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<AlertaRiesgo[]>(`/alertas?${params.toString()}`);
    return response.data;
  },

  async getAlerta(id: number): Promise<AlertaRiesgo> {
    const response = await apiClient.get<AlertaRiesgo>(`/alertas/${id}`);
    return response.data;
  },

  async getAlertasPendientes(): Promise<AlertaRiesgo[]> {
    const response = await apiClient.get<AlertaRiesgo[]>('/alertas/pendientes');
    return response.data;
  },

  async actualizarEstado(
    id: number,
    estado: string,
    notas?: string
  ): Promise<AlertaRiesgo> {
    const response = await apiClient.patch<AlertaRiesgo>(`/alertas/${id}`, {
      estado,
      notas,
    });
    return response.data;
  },

  async getAuditoria(id: number): Promise<AuditoriaAlerta[]> {
    const response = await apiClient.get<AuditoriaAlerta[]>(`/alertas/${id}/auditoria`);
    return response.data;
  },

  async enviarNotificacionPush(id: number, subscription: any): Promise<void> {
    await apiClient.post(`/alertas/${id}/notificacion`, { subscription });
  },

  async enviarEmailPrioritario(id: number, psicologoEmail: string): Promise<void> {
    await apiClient.post(`/alertas/${id}/email`, { psicologoEmail });
  },

  async getAlertasByEstudiante(estudianteId: number): Promise<AlertaRiesgo[]> {
    const response = await apiClient.get<AlertaRiesgo[]>(`/alertas/estudiante/${estudianteId}`);
    return response.data;
  },

  async getAlertasByPsicologo(): Promise<AlertaRiesgo[]> {
    const response = await apiClient.get<AlertaRiesgo[]>('/alertas/psicologo');
    return response.data;
  },

  async registrarAuditoria(id: number, accion: string, detalles?: string): Promise<void> {
    await apiClient.post(`/alertas/${id}/auditoria`, { accion, detalles });
  },
};
