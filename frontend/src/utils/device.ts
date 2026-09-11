import { useEffect, useState } from 'react';

/**
 * Detecta si el dispositivo es un teléfono/móvil.
 *
 * Combina varias señales para ser robusto en navegadores móviles reales:
 *  - User-Agent (Android, iPhone, iPad, iPod, Windows Phone, etc.)
 *  - `navigator.maxTouchPoints` (pantallas táctiles)
 *  - Ancho de viewport pequeño
 *  - `matchMedia('(pointer: coarse)')` (puntero táctil)
 *
 * Devuelve `true` para teléfonos/tablets y `false` para computadoras.
 */
export function useEsMovil(): boolean {
  const [esMovil, setEsMovil] = useState<boolean>(() => detectarMovil());

  useEffect(() => {
    const actualizar = () => setEsMovil(detectarMovil());
    window.addEventListener('resize', actualizar);
    window.addEventListener('orientationchange', actualizar);
    return () => {
      window.removeEventListener('resize', actualizar);
      window.removeEventListener('orientationchange', actualizar);
    };
  }, []);

  return esMovil;
}

/** Lógica de detección de dispositivo móvil. */
export function detectarMovil(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;

  // Override manual para pruebas: ?movil=1 fuerza móvil, ?movil=0 fuerza escritorio.
  try {
    const params = new URLSearchParams(window.location.search);
    const override = params.get('movil');
    if (override === '1') return true;
    if (override === '0') return false;
  } catch {
    // Ignora errores de parseo.
  }

  const ua = navigator.userAgent || '';
  const uaMovil = /Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|Opera Mini|IEMobile|Mobile/i.test(ua);

  // iPad moderno se identifica como Mac con pantalla táctil.
  const esIPad = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;

  const punteroTactil =
    typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;

  const toques = (navigator.maxTouchPoints ?? 0) > 0;
  const anchoPequeno = window.innerWidth <= 820;

  return uaMovil || esIPad || (punteroTactil && toques && anchoPequeno);
}
