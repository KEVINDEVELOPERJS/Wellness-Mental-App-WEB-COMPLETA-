import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../../store/authStore';

describe('authStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.getState().logout();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(result.current.refreshToken).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });

  it('should set auth data', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockUser = {
      id: 1,
      nombre: 'Test User',
      email: 'test@example.com',
      edad: 16,
      grado: '3° Secundaria',
      rol: 'ESTUDIANTE',
    };

    act(() => {
      result.current.setAuth(mockUser, 'access-token', 'refresh-token');
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.accessToken).toBe('access-token');
    expect(result.current.refreshToken).toBe('refresh-token');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should logout and clear auth data', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockUser = {
      id: 1,
      nombre: 'Test User',
      email: 'test@example.com',
      edad: 16,
      grado: '3° Secundaria',
      rol: 'ESTUDIANTE',
    };

    act(() => {
      result.current.setAuth(mockUser, 'access-token', 'refresh-token');
    });

    expect(result.current.isAuthenticated).toBe(true);

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.accessToken).toBeNull();
    expect(result.current.refreshToken).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should update user data', () => {
    const { result } = renderHook(() => useAuthStore());
    
    const mockUser = {
      id: 1,
      nombre: 'Test User',
      email: 'test@example.com',
      edad: 16,
      grado: '3° Secundaria',
      rol: 'ESTUDIANTE',
    };

    act(() => {
      result.current.setAuth(mockUser, 'access-token', 'refresh-token');
    });

    const updatedUser = { ...mockUser, nombre: 'Updated User' };

    act(() => {
      result.current.setUser(updatedUser);
    });

    expect(result.current.user).toEqual(updatedUser);
  });

  it('should update tokens', () => {
    const { result } = renderHook(() => useAuthStore());
    
    act(() => {
      result.current.setTokens('new-access-token', 'new-refresh-token');
    });

    expect(result.current.accessToken).toBe('new-access-token');
    expect(result.current.refreshToken).toBe('new-refresh-token');
  });

  it('should set loading state', () => {
    const { result } = renderHook(() => useAuthStore());
    
    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
  });
});
