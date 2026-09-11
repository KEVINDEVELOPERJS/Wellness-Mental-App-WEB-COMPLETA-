import { useCallback, useRef, useState } from 'react';

interface VirtualJoystickProps {
  /** Tamaño del área del joystick en píxeles. */
  size?: number;
  /** Se llama en cada movimiento con el vector normalizado (-1..1). */
  onChange: (vector: { x: number; y: number }) => void;
  /** Se llama al soltar el joystick (vector a cero). */
  onRelease?: () => void;
  /** Etiqueta opcional mostrada en el centro. */
  label?: string;
  /** Color de acento del joystick. */
  color?: string;
  className?: string;
}

/**
 * Joystick virtual analógico para móvil. Funciona como WASD:
 *  - Arriba/abajo → avanzar/retroceder
 *  - Izquierda/derecha → desplazamiento lateral
 *
 * Usa Pointer Events para funcionar con dedo o ratón y captura el puntero
 * para no perder el control al salir del área.
 */
export default function VirtualJoystick({
  size = 140,
  onChange,
  onRelease,
  label,
  color = '#06b6d4',
  className = '',
}: VirtualJoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const activePointerRef = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const [activo, setActivo] = useState(false);

  const radio = size / 2;
  const radioKnob = size * 0.28;
  const limite = radio - radioKnob;

  const calcularVector = useCallback(
    (clientX: number, clientY: number) => {
      const base = baseRef.current;
      if (!base) return;
      const rect = base.getBoundingClientRect();
      const centroX = rect.left + rect.width / 2;
      const centroY = rect.top + rect.height / 2;
      let dx = clientX - centroX;
      let dy = clientY - centroY;
      const dist = Math.hypot(dx, dy);
      if (dist > limite) {
        dx = (dx / dist) * limite;
        dy = (dy / dist) * limite;
      }
      setKnob({ x: dx, y: dy });
      // Vector normalizado por el límite (magnitud 0..1).
      onChange({ x: dx / limite, y: dy / limite });
    },
    [limite, onChange],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    activePointerRef.current = e.pointerId;
    setActivo(true);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    calcularVector(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== e.pointerId) return;
    e.preventDefault();
    calcularVector(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== e.pointerId) return;
    activePointerRef.current = null;
    setActivo(false);
    setKnob({ x: 0, y: 0 });
    onChange({ x: 0, y: 0 });
    onRelease?.();
  };

  return (
    <div
      ref={baseRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`relative rounded-full touch-none select-none ${className}`}
      style={{
        width: size,
        height: size,
        background: 'rgba(15,23,42,0.35)',
        border: `2px solid ${activo ? color : 'rgba(255,255,255,0.35)'}`,
        boxShadow: activo ? `0 0 18px ${color}66` : 'none',
      }}
    >
      {/* Cruz de guía */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-px h-3/4 bg-white/15" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="h-px w-3/4 bg-white/15" />
      </div>

      {/* Etiqueta */}
      {label && (
        <span className="absolute inset-0 flex items-end justify-center pb-1 text-[10px] font-semibold text-white/60 pointer-events-none">
          {label}
        </span>
      )}

      {/* Knob */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: radioKnob * 2,
          height: radioKnob * 2,
          left: `calc(50% - ${radioKnob}px + ${knob.x}px)`,
          top: `calc(50% - ${radioKnob}px + ${knob.y}px)`,
          background: `radial-gradient(circle at 35% 35%, #ffffff, ${color})`,
          border: '2px solid rgba(255,255,255,0.8)',
          transition: activo ? 'none' : 'left 0.12s ease-out, top 0.12s ease-out',
        }}
      />
    </div>
  );
}
