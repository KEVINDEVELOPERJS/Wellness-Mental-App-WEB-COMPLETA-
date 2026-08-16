import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../../services/authService';
import apiClient from '../../services/apiClient';

// Mock apiClient
vi.mock('../../services/apiClient');

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const mockResponse = {
        usuario: {
          id: 1,
          nombre: 'Test User',
          email: 'test@example.com',
          edad: 16,
          grado: '3° Secundaria',
          rol: 'ESTUDIANTE',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await authService.register({
        nombre: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        edad: 16,
        grado: '3° Secundaria',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/registro', expect.any(Object));
      expect(result).toEqual(mockResponse);
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const mockResponse = {
        usuario: {
          id: 1,
          nombre: 'Test User',
          email: 'test@example.com',
          edad: 16,
          grado: '3° Secundaria',
          rol: 'ESTUDIANTE',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await authService.login('test@example.com', 'password123');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('logout', () => {
    it('should logout a user', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: {} });

      await authService.logout('refresh-token');

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout', {
        refreshToken: 'refresh-token',
      });
    });
  });

  describe('validateEmail', () => {
    it('should validate email uniqueness', async () => {
      const mockResponse = { unico: true };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await authService.validateEmail('test@example.com');

      expect(apiClient.get).toHaveBeenCalledWith('/auth/validar-email/test@example.com');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('validateAge', () => {
    it('should validate age', async () => {
      const mockResponse = { valida: true, requiereConsentimiento: false };
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await authService.validateAge(16);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/validar-edad', { edad: 16 });
      expect(result).toEqual(mockResponse);
    });
  });
});
