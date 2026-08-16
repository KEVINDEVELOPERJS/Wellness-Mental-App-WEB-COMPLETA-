import apiClient from './apiClient';
import { ChatSession, MensajeChat, ChatMessageDTO, ChatResponse } from '../types/chat';

export const chatService = {
  async iniciarSesion(): Promise<ChatSession> {
    const response = await apiClient.post<ChatSession>('/chat/sesion');
    return response.data;
  },

  async enviarMensaje(mensaje: ChatMessageDTO): Promise<ChatResponse> {
    const response = await apiClient.post<ChatResponse>('/chat/mensaje', mensaje);
    return response.data;
  },

  async analizarSentimiento(mensaje: string): Promise<{ sentimiento: number }> {
    const response = await apiClient.post<{ sentimiento: number }>('/chat/analizar', { mensaje });
    return response.data;
  },

  async detectarRiesgo(mensaje: string): Promise<{ esRiesgoso: boolean }> {
    const response = await apiClient.post<{ esRiesgoso: boolean }>('/chat/riesgo', { mensaje });
    return response.data;
  },

  async generarRespuesta(mensaje: string, contexto: any[]): Promise<{ respuesta: string }> {
    const response = await apiClient.post<{ respuesta: string }>('/chat/respuesta', {
      mensaje,
      contexto,
    });
    return response.data;
  },

  async getHistorial(): Promise<ChatSession[]> {
    const response = await apiClient.get<ChatSession[]>('/chat/historial');
    return response.data;
  },

  async getMensajes(sessionId: number): Promise<MensajeChat[]> {
    const response = await apiClient.get<MensajeChat[]>(`/chat/mensajes/${sessionId}`);
    return response.data;
  },

  async cerrarSesion(sessionId: number): Promise<void> {
    await apiClient.delete(`/chat/sesion/${sessionId}`);
  },
};
