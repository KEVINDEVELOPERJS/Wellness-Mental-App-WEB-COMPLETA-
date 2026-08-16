import apiClient from './apiClient';
import { UsuarioDTO, AuthResponse } from '../types/usuario';

export const authService = {
  async register(data: UsuarioDTO): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/registro', data);
    return response.data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return response.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await apiClient.post('/auth/logout', { refreshToken });
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const response = await apiClient.post<{ accessToken: string }>('/auth/refresh-token', { refreshToken });
    return response.data;
  },

  async validateEmail(email: string): Promise<{ unico: boolean }> {
    const response = await apiClient.get<{ unico: boolean }>(`/auth/validar-email/${email}`);
    return response.data;
  },

  async validateAge(edad: number): Promise<{ valida: boolean; requiereConsentimiento: boolean }> {
    const response = await apiClient.post('/auth/validar-edad', { edad });
    return response.data;
  },

  async me(): Promise<UsuarioDTO> {
    const response = await apiClient.get<UsuarioDTO>('/auth/me');
    return response.data;
  },
};
