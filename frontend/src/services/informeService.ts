import apiClient from './apiClient';

export const informeService = {
  async generarInforme(resultadoId: number, padreId?: number): Promise<any> {
    const response = await apiClient.post('/informes/generar', { resultadoId, padreId });
    return response.data;
  },

  async getInforme(token: string): Promise<any> {
    const response = await apiClient.get(`/informe/${token}`);
    return response.data;
  },

  async getInformePDF(token: string): Promise<Blob> {
    const response = await apiClient.get(`/informe/${token}/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  async validar2FA(codigo: string): Promise<{ valido: boolean }> {
    const response = await apiClient.post<{ valido: boolean }>('/informes/2fa/validar', { codigo });
    return response.data;
  },

  async generar2FA(): Promise<any> {
    const response = await apiClient.post('/informes/2fa/generar');
    return response.data;
  },

  async registrarAcceso(token: string): Promise<void> {
    await apiClient.post(`/informe/${token}/acceso`);
  },

  async getInformesByPadre(): Promise<any[]> {
    const response = await apiClient.get<any[]>('/informes/padre');
    return response.data;
  },
};
