import apiClient from './apiClient';
import { ChatSession, MensajeChat, ChatMessageDTO, ChatResponse } from '../types/chat';

export const chatService = {
  async iniciarSesion(): Promise<ChatSession> {
    try {
      console.log('Starting chat session...');
      const response = await apiClient.post<ChatSession>('/chat/sesion');
      console.log('Chat session started:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in iniciarSesion:', error);
      throw error;
    }
  },

  async enviarMensaje(mensaje: ChatMessageDTO): Promise<ChatResponse> {
    try {
      console.log('Sending message to chat:', mensaje);
      const response = await apiClient.post<ChatResponse>('/chat/mensaje', mensaje);
      console.log('Chat response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in enviarMensaje:', error);
      throw error;
    }
  },

  async analizarSentimiento(mensaje: string): Promise<{ sentimiento: number }> {
    try {
      const response = await apiClient.post<{ sentimiento: number }>('/chat/analizar', { mensaje });
      return response.data;
    } catch (error) {
      console.error('Error in analizarSentimiento:', error);
      throw error;
    }
  },

  async detectarRiesgo(mensaje: string): Promise<{ esRiesgoso: boolean }> {
    try {
      const response = await apiClient.post<{ esRiesgoso: boolean }>('/chat/riesgo', { mensaje });
      return response.data;
    } catch (error) {
      console.error('Error in detectarRiesgo:', error);
      throw error;
    }
  },

  async generarRespuesta(mensaje: string, contexto: any[]): Promise<{ respuesta: string }> {
    try {
      const response = await apiClient.post<{ respuesta: string }>('/chat/respuesta', {
        mensaje,
        contexto,
      });
      return response.data;
    } catch (error) {
      console.error('Error in generarRespuesta:', error);
      throw error;
    }
  },

  async getHistorial(): Promise<ChatSession[]> {
    try {
      const response = await apiClient.get<ChatSession[]>('/chat/historial');
      return response.data;
    } catch (error) {
      console.error('Error in getHistorial:', error);
      throw error;
    }
  },

  async getMensajes(sessionId: number): Promise<MensajeChat[]> {
    try {
      console.log('Getting messages for session:', sessionId);
      const response = await apiClient.get<MensajeChat[]>(`/chat/mensajes/${sessionId}`);
      console.log('Messages received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getMensajes:', error);
      throw error;
    }
  },

  async cerrarSesion(sessionId: number): Promise<void> {
    try {
      await apiClient.delete(`/chat/sesion/${sessionId}`);
    } catch (error) {
      console.error('Error in cerrarSesion:', error);
      throw error;
    }
  },
};
