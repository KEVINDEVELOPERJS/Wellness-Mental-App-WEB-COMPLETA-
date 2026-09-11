import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Crosshair, Heart, Clock, Coins, Zap, Shield } from 'lucide-react';

/**
 * Mente Guerrera — shooter 3D en primera persona con temática de salud mental.
 *
 * Motor: raycasting sobre Canvas 2D (estilo Wolfenstein 3D / Doom), sin
 * dependencias externas. El mapa es un jardín zen con senderos, árboles y
 * fuentes. El jugador dispara "proyectiles de calma" a los "estresores"
 * (ansiedad, insomnio, rumiación) en lugar de enemigos: el objetivo es
 * restaurar la paz mental, no la violencia.
 *
 * Mecánicas inspiradas en CoD BO1 Zombies (adaptadas y re-tematizadas):
 *  - Armas montadas en las paredes con precio que se compran con "calma" (puntos).
 *  - Los estresores persiguen al jugador y le quitan vida al tocarlo (3 toques = 0 vida).
 *  - Cada arma tiene su propio lanzador de proyectiles (cadencia, daño, dispersión, visual).
 *  - Munición, recarga y compra de armas en paredes, como en BO1.
 *
 * Contrato con `JuegosPage`: `onGameComplete(score, combo, 'mente-guerrera', duration)`.
 */

interface MenteGuerreraGameProps {
  onBack: () => void;
  onGameComplete: (score: number, combo: number, gameType?: string, duration?: number) => void;
}

/** Enemigo temático: una manifestación del estrés que se disipa al recibir calma. */
interface Estresor {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  alive: boolean;
  /** Emoji que representa el tipo de estresor. */
  emoji: string;
  /** Nombre terapéutico mostrado en la UI. */
  nombre: string;
  /** Cuánto daño (calma) inflige por disparo. */
  hitFlash: number;
  /** Velocidad de persecución (unidades/frame). */
  velocidad: number;
  /** Puntos de calma que otorga al ser disipado. */
  recompensa: number;
  /** Tiempo (ms) desde el último toque al jugador, para el cooldown de daño. */
  ultimoToque: number;
  /** Animación de muerte: 0 = vivo, 1 = recién disipado. */
  muerte: number;
  /** Indica que está reproduciendo la animación de muerte (ya no colisiona ni persigue). */
  muriendo: boolean;
}

/** Proyectil de calma disparado por el jugador. */
interface Proyectil {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  life: number;
  alive: boolean;
  /** Daño (calma) que aplica al impactar. */
  dano: number;
  /** Radio de impacto. */
  radio: number;
  /** Color del proyectil (según el arma). */
  color: string;
  /** Borde del proyectil. */
  borde: string;
  /** Tamaño visual base del proyectil. */
  tamano: number;
  /** Forma del proyectil (según el cañón del arma). */
  forma: FormaBala;
}

/** Formas de bala/proyectil, temáticas por cañón. */
type FormaBala = 'orbe' | 'chispa' | 'abanico' | 'dardo' | 'onda';

/** Partícula de impacto para feedback visual. */
interface Particula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

/** Rayo de renderizado del raycasting. */
interface Rayo {
  distancia: number;
  esPared: boolean;
  lado: 0 | 1;
  tipoPared: number;
}

/** Definición de un arma comprable en la pared. */
interface ArmaDef {
  id: string;
  nombre: string;
  /** Emoji/icono del arma en el HUD. */
  icono: string;
  /** Precio en puntos de calma. */
  precio: number;
  /** Daño por proyectil. */
  dano: number;
  /** Cadencia mínima entre disparos (ms). */
  cadencia: number;
  /** Balas por cargador. */
  cargador: number;
  /** Munición de reserva al comprar. */
  reserva: number;
  /** Radio de impacto del proyectil. */
  radio: number;
  /** Dispersión (radianes) aplicada al disparo. */
  dispersion: number;
  /** Proyectiles por disparo (escopeta > 1). */
  perdigones: number;
  /** Color del proyectil. */
  color: string;
  /** Borde del proyectil. */
  borde: string;
  /** Tamaño visual del proyectil. */
  tamano: number;
  /** Forma del proyectil (temática del cañón). */
  forma: FormaBala;
  /** Estilo visual del cañón (viewmodel en primera persona y panel de pared). */
  estilo: EstiloCanon;
  /** Descripción terapéutica breve. */
  descripcion: string;
}

/** Estilos de cañón dibujados con Canvas (silueta de arma). */
type EstiloCanon = 'pistola' | 'ametralladora' | 'escopeta' | 'francotirador' | 'lanzador';

/** Arma montada en una pared del mapa. */
interface ArmaPared {
  id: string;
  armaId: string;
  /** Celda del mapa donde está montada. */
  cx: number;
  cy: number;
}

/** Estado de un arma en posesión del jugador. */
interface EstadoArma {
  armaId: string;
  cargador: number;
  reserva: number;
}

const ANCHO = 640;
const ALTO = 400;

/** Mapa del jardín zen. 0 = libre, >0 = tipo de pared/bloque. */
const MAPA: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const MAPA_ANCHO = MAPA[0]?.length ?? 0;
const MAPA_ALTO = MAPA.length;

/** Colores por tipo de bloque: 1 = seto, 2 = árbol, 3 = fuente. */
const COLORES_PARED: Record<number, { base: string; sombra: string }> = {
  1: { base: '#4ade80', sombra: '#16a34a' },
  2: { base: '#a16207', sombra: '#713f12' },
  3: { base: '#38bdf8', sombra: '#0284c7' },
};

/**
 * Tipos de estresor. Todos tienen 5 de vida: con el arma predeterminada
 * (1 de daño) hacen falta exactamente 5 disparos para disiparlos.
 */
const TIPOS_ESTRESOR = [
  { emoji: '😰', nombre: 'Ansiedad', hp: 5, velocidad: 0.010, recompensa: 100 },
  { emoji: '🌪️', nombre: 'Rumiación', hp: 5, velocidad: 0.008, recompensa: 120 },
  { emoji: '🌙', nombre: 'Insomnio', hp: 5, velocidad: 0.014, recompensa: 80 },
  { emoji: '⛈️', nombre: 'Estrés', hp: 5, velocidad: 0.007, recompensa: 150 },
  { emoji: '🕳️', nombre: 'Desánimo', hp: 5, velocidad: 0.011, recompensa: 110 },
] as const;

/**
 * Catálogo de armas. Cada una tiene un lanzador de proyectiles distinto
 * (cadencia, daño, dispersión, número de perdigones y visual).
 */
const ARMAS: Record<string, ArmaDef> = {
  calma: {
    id: 'calma',
    nombre: 'Cañón de Calma',
    icono: '🔫',
    precio: 0,
    dano: 1,
    cadencia: 320,
    cargador: 8,
    reserva: 80,
    radio: 0.18,
    dispersion: 0.01,
    perdigones: 1,
    color: '#67e8f9',
    borde: '#06b6d4',
    tamano: 12,
    forma: 'orbe',
    estilo: 'pistola',
    descripcion: 'Cañón inicial de serenidad. 5 disparos disipan un estresor.',
  },
  respiracion: {
    id: 'respiracion',
    nombre: 'Cañón de Aliento',
    icono: '💨',
    precio: 500,
    dano: 1,
    cadencia: 110,
    cargador: 30,
    reserva: 180,
    radio: 0.16,
    dispersion: 0.05,
    perdigones: 1,
    color: '#a5f3fc',
    borde: '#22d3ee',
    tamano: 9,
    forma: 'chispa',
    estilo: 'ametralladora',
    descripcion: 'Cañón automático. Ráfagas rápidas de respiración consciente.',
  },
  gratitud: {
    id: 'gratitud',
    nombre: 'Cañón de Gratitud',
    icono: '🌻',
    precio: 900,
    dano: 2,
    cadencia: 750,
    cargador: 6,
    reserva: 36,
    radio: 0.22,
    dispersion: 0.16,
    perdigones: 6,
    color: '#fde68a',
    borde: '#f59e0b',
    tamano: 8,
    forma: 'abanico',
    estilo: 'escopeta',
    descripcion: 'Cañón de doble boca. Dispersa gratitud en abanico.',
  },
  enfoque: {
    id: 'enfoque',
    nombre: 'Cañón de Enfoque',
    icono: '🎯',
    precio: 1400,
    dano: 4,
    cadencia: 600,
    cargador: 5,
    reserva: 40,
    radio: 0.14,
    dispersion: 0.0,
    perdigones: 1,
    color: '#c4b5fd',
    borde: '#8b5cf6',
    tamano: 14,
    forma: 'dardo',
    estilo: 'francotirador',
    descripcion: 'Cañón de precisión. Un disparo, una intención clara.',
  },
  armonia: {
    id: 'armonia',
    nombre: 'Lanzador de Armonía',
    icono: '🎆',
    precio: 2000,
    dano: 3,
    cadencia: 900,
    cargador: 4,
    reserva: 20,
    radio: 0.5,
    dispersion: 0.03,
    perdigones: 1,
    color: '#fca5a5',
    borde: '#ef4444',
    tamano: 16,
    forma: 'onda',
    estilo: 'lanzador',
    descripcion: 'Cañón lanzador explosivo que armoniza una zona entera.',
  },
};

/** Armas montadas en las paredes del mapa (posiciones de compra). */
const ARMAS_PARED: ArmaPared[] = [
  { id: 'w-respiracion', armaId: 'respiracion', cx: 3, cy: 1 },
  { id: 'w-gratitud', armaId: 'gratitud', cx: 12, cy: 3 },
  { id: 'w-enfoque', armaId: 'enfoque', cx: 2, cy: 12 },
  { id: 'w-armonia', armaId: 'armonia', cx: 13, cy: 12 },
];

/** Orden de armas para la selección rápida con teclas 1-5. */
const ORDEN_ARMAS = ['calma', 'respiracion', 'gratitud', 'enfoque', 'armonia'] as const;

const DURACION = 120; // segundos
const FOV = Math.PI / 3; // 60 grados
const VELOCIDAD_MOV = 0.05;
const VELOCIDAD_ROT = 0.05;
const VIDA_MAX = 100;
/** Cada toque de un estresor quita 1/3 de la vida (3 toques = derrota). */
const DANO_POR_TOQUE = VIDA_MAX / 3;
/** Distancia a la que un estresor puede tocar al jugador. */
const DISTANCIA_TOQUE = 0.6;
/** Cooldown entre toques del mismo estresor (ms). */
const COOLDOWN_TOQUE = 900;
/** Distancia máxima para poder comprar un arma de pared. */
const DISTANCIA_COMPRA = 1.6;
const PUNTOS_POR_TOQUE = 10;
const MAX_ESTRESORES = 8;
const TIEMPO_RECARGA = 1000;

/**
 * Dibuja el cañón del arma en primera persona (viewmodel) en la parte inferior
 * de la pantalla. Cada estilo tiene una silueta creativa distinta, con colores
 * del proyectil del arma. `recoil` (0-1) desplaza el arma al disparar.
 */
function dibujarCanon(
  ctx: CanvasRenderingContext2D,
  estilo: EstiloCanon,
  color: string,
  borde: string,
  recoil: number,
): void {
  const baseX = ANCHO / 2;
  const baseY = ALTO + recoil * 26; // sube al retroceder
  const escala = 1;

  ctx.save();
  ctx.translate(baseX, baseY);
  ctx.scale(escala, escala);

  // Sombra suave bajo el arma
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, -6, 120, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Color de cuerpo metálico oscuro con acento del arma
  const cuerpo = '#1f2937';
  const cuerpoClaro = '#374151';
  const acento = color;

  const rect = (x: number, y: number, w: number, h: number, r: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  };

  if (estilo === 'pistola') {
    // Cañón de Calma: pistola compacta y elegante
    rect(-26, -78, 52, 60, 8, cuerpo);          // cuerpo
    rect(-14, -96, 28, 26, 6, cuerpoClaro);     // cañón
    rect(-9, -104, 18, 12, 4, acento);          // boca
    rect(-22, -30, 44, 34, 6, cuerpo);          // empuñadura
    rect(-16, -24, 32, 8, 3, acento);           // detalle
    ctx.fillStyle = acento;
    ctx.beginPath();
    ctx.arc(0, -66, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (estilo === 'ametralladora') {
    // Cañón de Aliento: subfusil con cargador
    rect(-30, -96, 60, 46, 8, cuerpo);          // cuerpo
    rect(-12, -122, 24, 32, 6, cuerpoClaro);    // cañón
    rect(-7, -132, 14, 12, 3, acento);          // boca
    rect(-18, -60, 36, 46, 6, cuerpoClaro);     // cargador
    rect(-18, -56, 36, 8, 3, acento);           // banda
    rect(-40, -104, 14, 60, 6, cuerpo);         // culata
    ctx.fillStyle = acento;
    ctx.fillRect(-12, -108, 24, 5);
  } else if (estilo === 'escopeta') {
    // Cañón de Gratitud: doble boca ancha
    rect(-40, -100, 80, 44, 8, cuerpo);         // cuerpo
    rect(-42, -132, 26, 36, 6, cuerpoClaro);    // cañón izq
    rect(16, -132, 26, 36, 6, cuerpoClaro);     // cañón der
    rect(-38, -140, 18, 12, 3, acento);         // boca izq
    rect(20, -140, 18, 12, 3, acento);          // boca der
    rect(-20, -62, 40, 40, 6, cuerpoClaro);     // guardamanos
    rect(-26, -34, 52, 30, 6, cuerpo);          // culata
  } else if (estilo === 'francotirador') {
    // Cañón de Enfoque: rifle largo con mira
    rect(-22, -104, 44, 40, 8, cuerpo);         // cuerpo
    rect(-9, -150, 18, 50, 5, cuerpoClaro);     // cañón largo
    rect(-5, -160, 10, 12, 3, acento);          // boca
    rect(-16, -128, 32, 10, 4, '#111827');      // mira
    ctx.fillStyle = acento;
    ctx.beginPath();
    ctx.arc(0, -123, 4, 0, Math.PI * 2);
    ctx.fill();
    rect(-24, -66, 48, 42, 6, cuerpoClaro);     // culata
    rect(-14, -30, 28, 26, 5, cuerpo);          // empuñadura
  } else {
    // Lanzador de Armonía: tubo grueso con proyectil visible
    rect(-34, -104, 68, 52, 10, cuerpo);        // cuerpo
    rect(-22, -148, 44, 48, 12, cuerpoClaro);   // tubo lanzador
    ctx.fillStyle = acento;
    ctx.beginPath();
    ctx.arc(0, -150, 18, 0, Math.PI * 2);       // proyectil en la boca
    ctx.fill();
    ctx.strokeStyle = borde;
    ctx.lineWidth = 3;
    ctx.stroke();
    rect(-28, -60, 56, 46, 8, cuerpoClaro);     // depósito
    rect(-14, -28, 28, 24, 5, cuerpo);          // empuñadura
  }

  // Acento luminoso común (línea de energía)
  ctx.strokeStyle = acento;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(-18, -84);
  ctx.lineTo(18, -84);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.restore();
}

/**
 * Dibuja la silueta de un arma para el panel de compra de la pared.
 * `tam` controla el tamaño; el dibujo se centra en (cx, cy).
 */
function dibujarSiluetaArma(
  ctx: CanvasRenderingContext2D,
  estilo: EstiloCanon,
  cx: number,
  cy: number,
  tam: number,
  color: string,
): void {
  const s = tam / 60; // factor de escala
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);

  ctx.fillStyle = '#e5e7eb';
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;

  const rect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  if (estilo === 'pistola') {
    rect(-22, -18, 44, 22, 4);
    rect(-10, -30, 20, 14, 3);
    rect(-16, 4, 32, 16, 3);
  } else if (estilo === 'ametralladora') {
    rect(-30, -18, 60, 20, 4);
    rect(-12, -32, 24, 16, 3);
    rect(-16, 2, 32, 18, 3);
    rect(-40, -20, 12, 26, 3);
  } else if (estilo === 'escopeta') {
    rect(-34, -16, 68, 18, 4);
    rect(-32, -30, 20, 16, 3);
    rect(12, -30, 20, 16, 3);
    rect(-20, 2, 40, 16, 3);
  } else if (estilo === 'francotirador') {
    rect(-20, -18, 40, 18, 4);
    rect(-8, -40, 16, 24, 3);
    rect(-14, -30, 28, 8, 2);
    rect(-22, 0, 44, 16, 3);
  } else {
    rect(-30, -18, 60, 22, 6);
    rect(-18, -40, 36, 24, 8);
    ctx.beginPath();
    ctx.arc(0, -42, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    rect(-24, 4, 48, 18, 4);
  }

  ctx.restore();
}

/**
 * Dibuja un proyectil temático según la forma del cañón.
 */
function dibujarBala(
  ctx: CanvasRenderingContext2D,
  forma: FormaBala,
  sx: number,
  sy: number,
  r: number,
  color: string,
  borde: string,
): void {
  ctx.save();
  ctx.strokeStyle = borde;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;

  if (forma === 'orbe') {
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (forma === 'chispa') {
    // Trazo alargado (chispa veloz)
    ctx.beginPath();
    ctx.ellipse(sx, sy, r * 1.8, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (forma === 'abanico') {
    // Pequeño rombo (perdigón)
    ctx.beginPath();
    ctx.moveTo(sx, sy - r);
    ctx.lineTo(sx + r, sy);
    ctx.lineTo(sx, sy + r);
    ctx.lineTo(sx - r, sy);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (forma === 'dardo') {
    // Dardo afilado
    ctx.beginPath();
    ctx.moveTo(sx + r * 2, sy);
    ctx.lineTo(sx - r, sy - r * 0.7);
    ctx.lineTo(sx - r, sy + r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Onda: anillo expansivo
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx, sy, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export default function MenteGuerreraGame({ onBack, onGameComplete }: MenteGuerreraGameProps) {
  const [iniciado, setIniciado] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [puntuacion, setPuntuacion] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(DURACION);
  const [vida, setVida] = useState(VIDA_MAX);
  const [mensaje, setMensaje] = useState('Respira. El estrés no te define.');
  const [estresoresRestantes, setEstresoresRestantes] = useState(0);
  const [ronda, setRonda] = useState(1);
  const [armaActual, setArmaActual] = useState('calma');
  const [cargador, setCargador] = useState(ARMAS.calma?.cargador ?? 8);
  const [reserva, setReserva] = useState(ARMAS.calma?.reserva ?? 80);
  const [armasCompradas, setArmasCompradas] = useState<string[]>(['calma']);
  const [armaCercana, setArmaCercana] = useState<ArmaPared | null>(null);
  const [recargando, setRecargando] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const runningRef = useRef(false);

  // Estado del jugador (refs para el bucle de animación, sin re-render).
  // (1.5, 1.5) es una celda libre del mapa (MAPA[1][1] === 0).
  const jugadorRef = useRef({ x: 1.5, y: 1.5, dir: 0 });
  const teclasRef = useRef<Set<string>>(new Set());
  const estresoresRef = useRef<Estresor[]>([]);
  const proyectilesRef = useRef<Proyectil[]>([]);
  const particulasRef = useRef<Particula[]>([]);
  const puntuacionRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const vidaRef = useRef(VIDA_MAX);
  const tiempoRef = useRef(DURACION);
  const estresorIdRef = useRef(0);
  const ultimoSpawnRef = useRef(0);
  const ultimoDisparoRef = useRef(0);
  const mensajeRef = useRef('Respira. El estrés no te define.');
  const rondaRef = useRef(1);
  const toqueFlashRef = useRef(0);
  /** Retroceso del arma (0-1) para animar el viewmodel al disparar. */
  const recoilRef = useRef(0);
  /** Destello del cañón (0-1) al disparar. */
  const muzzleRef = useRef(0);

  // Armas
  const armasRef = useRef<Record<string, EstadoArma>>({
    calma: { armaId: 'calma', cargador: ARMAS.calma?.cargador ?? 8, reserva: ARMAS.calma?.reserva ?? 80 },
  });
  const armaActualRef = useRef('calma');
  const recargandoRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      runningRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  /** Comprueba si una celda del mapa es transitable. */
  const esLibre = useCallback((x: number, y: number): boolean => {
    const cx = Math.floor(x);
    const cy = Math.floor(y);
    if (cx < 0 || cy < 0 || cx >= MAPA_ANCHO || cy >= MAPA_ALTO) return false;
    return (MAPA[cy]?.[cx] ?? 1) === 0;
  }, []);

  /** Lanza un rayo DDA y devuelve la distancia al primer bloque. */
  const lanzarRayo = useCallback((posX: number, posY: number, dirX: number, dirY: number): Rayo => {
    let mapX = Math.floor(posX);
    let mapY = Math.floor(posY);

    const deltaDistX = dirX === 0 ? 1e30 : Math.abs(1 / dirX);
    const deltaDistY = dirY === 0 ? 1e30 : Math.abs(1 / dirY);

    const stepX = dirX < 0 ? -1 : 1;
    const stepY = dirY < 0 ? -1 : 1;

    let sideDistX = dirX < 0 ? (posX - mapX) * deltaDistX : (mapX + 1 - posX) * deltaDistX;
    let sideDistY = dirY < 0 ? (posY - mapY) * deltaDistY : (mapY + 1 - posY) * deltaDistY;

    let lado: 0 | 1 = 0;
    let tipoPared = 1;

    for (let i = 0; i < 64; i++) {
      if (sideDistX < sideDistY) {
        sideDistX += deltaDistX;
        mapX += stepX;
        lado = 0;
      } else {
        sideDistY += deltaDistY;
        mapY += stepY;
        lado = 1;
      }

      if (mapX < 0 || mapY < 0 || mapX >= MAPA_ANCHO || mapY >= MAPA_ALTO) break;
      const celda = MAPA[mapY]?.[mapX] ?? 1;
      if (celda > 0) {
        tipoPared = celda;
        break;
      }
    }

    const distancia = lado === 0 ? sideDistX - deltaDistX : sideDistY - deltaDistY;
    return { distancia: Math.max(0.01, distancia), esPared: true, lado, tipoPared };
  }, []);

  /** Genera un estresor en una posición libre aleatoria del mapa. */
  const generarEstresor = useCallback((): Estresor => {
    const tipo = TIPOS_ESTRESOR[Math.floor(Math.random() * TIPOS_ESTRESOR.length)] ?? TIPOS_ESTRESOR[0];
    // Posición de respaldo garantizada libre (celda 1,1 del mapa).
    let x = 1.5;
    let y = 1.5;
    for (let intento = 0; intento < 80; intento++) {
      const cx = 1.5 + Math.random() * (MAPA_ANCHO - 3);
      const cy = 1.5 + Math.random() * (MAPA_ALTO - 3);
      if (esLibre(cx, cy)) {
        const dx = cx - jugadorRef.current.x;
        const dy = cy - jugadorRef.current.y;
        if (dx * dx + dy * dy > 9) {
          x = cx;
          y = cy;
          break;
        }
      }
    }
    estresorIdRef.current += 1;
    // Escalado por ronda: más vida y velocidad.
    const factorRonda = 1 + (rondaRef.current - 1) * 0.15;
    const hp = Math.round(tipo.hp * factorRonda);
    return {
      id: estresorIdRef.current,
      x,
      y,
      hp,
      maxHp: hp,
      alive: true,
      emoji: tipo.emoji,
      nombre: tipo.nombre,
      hitFlash: 0,
      velocidad: tipo.velocidad * factorRonda,
      recompensa: tipo.recompensa,
      ultimoToque: 0,
      muerte: 0,
      muriendo: false,
    };
  }, [esLibre]);

  /** Sincroniza el estado del arma actual hacia React (para el HUD). */
  const sincronizarArma = useCallback(() => {
    const estado = armasRef.current[armaActualRef.current];
    if (!estado) return;
    setCargador(estado.cargador);
    setReserva(estado.reserva);
    setArmaActual(estado.armaId);
  }, []);

  /** Recarga el arma actual (mueve balas de reserva al cargador). */
  const recargar = useCallback(() => {
    const arma = ARMAS[armaActualRef.current];
    const estado = armasRef.current[armaActualRef.current];
    if (!arma || !estado) return;
    if (recargandoRef.current) return;
    if (estado.cargador >= arma.cargador || estado.reserva <= 0) return;

    recargandoRef.current = true;
    setRecargando(true);

    setTimeout(() => {
      if (!isMountedRef.current) return;
      const e = armasRef.current[armaActualRef.current];
      const a = ARMAS[armaActualRef.current];
      if (!e || !a) return;
      const faltan = a.cargador - e.cargador;
      const mover = Math.min(faltan, e.reserva);
      e.cargador += mover;
      e.reserva -= mover;
      recargandoRef.current = false;
      setRecargando(false);
      sincronizarArma();
    }, TIEMPO_RECARGA);
  }, [sincronizarArma]);

  /** Dispara el arma actual. Cada arma usa su propio lanzador de proyectiles. */
  const disparar = useCallback(() => {
    if (!runningRef.current) return;
    if (recargandoRef.current) return;

    const arma = ARMAS[armaActualRef.current];
    const estado = armasRef.current[armaActualRef.current];
    if (!arma || !estado) return;

    const ahora = performance.now();
    if (ahora - ultimoDisparoRef.current < arma.cadencia) return;

    if (estado.cargador <= 0) {
      // Auto-recarga si hay reserva.
      if (estado.reserva > 0) recargar();
      return;
    }

    ultimoDisparoRef.current = ahora;
    estado.cargador -= 1;
    recoilRef.current = 1;
    muzzleRef.current = 1;

    const { x, y, dir } = jugadorRef.current;
    for (let i = 0; i < arma.perdigones; i++) {
      const dispersion = (Math.random() - 0.5) * arma.dispersion * 2;
      const angulo = dir + dispersion;
      proyectilesRef.current.push({
        x,
        y,
        dirX: Math.cos(angulo),
        dirY: Math.sin(angulo),
        life: 60,
        alive: true,
        dano: arma.dano,
        radio: arma.radio,
        color: arma.color,
        borde: arma.borde,
        tamano: arma.tamano,
        forma: arma.forma,
      });
    }

    sincronizarArma();
  }, [recargar, sincronizarArma]);

  /** Cambia al arma indicada si está comprada. */
  const cambiarArma = useCallback((armaId: string) => {
    if (!armasRef.current[armaId]) return;
    armaActualRef.current = armaId;
    sincronizarArma();
  }, [sincronizarArma]);

  /** Intenta comprar (o reabastecer) el arma de la pared indicada. */
  const comprarArma = useCallback((pared: ArmaPared) => {
    if (!runningRef.current) return;
    const arma = ARMAS[pared.armaId];
    if (!arma) return;

    // Si ya la tiene, reabastece munición al máximo (como en BO1).
    if (armasRef.current[pared.armaId]) {
      const estado = armasRef.current[pared.armaId];
      if (estado.reserva >= arma.reserva) {
        mensajeRef.current = `${arma.nombre}: munición al máximo`;
        setMensaje(mensajeRef.current);
        return;
      }
      if (puntuacionRef.current < arma.precio) {
        mensajeRef.current = `Necesitas ${arma.precio} de calma para reabastecer`;
        setMensaje(mensajeRef.current);
        return;
      }
      puntuacionRef.current -= arma.precio;
      estado.reserva = arma.reserva;
      setPuntuacion(puntuacionRef.current);
      mensajeRef.current = `¡${arma.nombre} reabastecida!`;
      setMensaje(mensajeRef.current);
      sincronizarArma();
      return;
    }

    if (puntuacionRef.current < arma.precio) {
      mensajeRef.current = `Necesitas ${arma.precio} de calma para ${arma.nombre}`;
      setMensaje(mensajeRef.current);
      return;
    }

    puntuacionRef.current -= arma.precio;
    armasRef.current[arma.id] = { armaId: arma.id, cargador: arma.cargador, reserva: arma.reserva };
    armaActualRef.current = arma.id;
    setPuntuacion(puntuacionRef.current);
    setArmasCompradas((prev) => (prev.includes(arma.id) ? prev : [...prev, arma.id]));
    mensajeRef.current = `¡${arma.nombre} adquirida!`;
    setMensaje(mensajeRef.current);
    sincronizarArma();
  }, [sincronizarArma]);

  /** Devuelve el arma de pared más cercana dentro del rango de compra. */
  const armaParedCercana = useCallback((): ArmaPared | null => {
    const { x, y } = jugadorRef.current;
    let mejor: ArmaPared | null = null;
    let mejorDist = DISTANCIA_COMPRA * DISTANCIA_COMPRA;
    for (const pared of ARMAS_PARED) {
      const dx = pared.cx + 0.5 - x;
      const dy = pared.cy + 0.5 - y;
      const d = dx * dx + dy * dy;
      if (d < mejorDist) {
        mejorDist = d;
        mejor = pared;
      }
    }
    return mejor;
  }, []);

  /** Actualiza proyectiles, colisiones, IA de persecución y daño al jugador. */
  const actualizarCombate = useCallback(() => {
    const ahora = performance.now();
    const jugador = jugadorRef.current;

    // Proyectiles
    for (const p of proyectilesRef.current) {
      if (!p.alive) continue;
      const pasoX = p.dirX * 0.18;
      const pasoY = p.dirY * 0.18;
      // Colisión barrida: comprueba varios puntos del recorrido para evitar
      // que el proyectil "atraviese" al enemigo entre fotogramas (tunneling).
      const SUBPASOS = 4;
      let impacto = false;

      for (let s = 1; s <= SUBPASOS && !impacto; s++) {
        const nx = p.x + (pasoX * s) / SUBPASOS;
        const ny = p.y + (pasoY * s) / SUBPASOS;

        if (!esLibre(nx, ny)) {
          p.alive = false;
          impacto = true;
          break;
        }

        for (const e of estresoresRef.current) {
          if (!e.alive || e.muriendo) continue;
          const dx = e.x - nx;
          const dy = e.y - ny;
          if (dx * dx + dy * dy < p.radio * p.radio) {
            e.hp -= p.dano;
            e.hitFlash = 1;
            p.alive = false;
            impacto = true;

            // Partículas de calma
            for (let i = 0; i < 8; i++) {
              particulasRef.current.push({
                x: e.x,
                y: e.y,
                vx: (Math.random() - 0.5) * 0.04,
                vy: (Math.random() - 0.5) * 0.04,
                life: 30,
                maxLife: 30,
                color: p.color,
              });
            }

            if (e.hp <= 0) {
              // Inicia la animación de muerte (no desaparece de golpe).
              e.hp = 0;
              e.muriendo = true;
              e.muerte = 1;
              comboRef.current += 1;
              maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
              const bonus = e.recompensa * comboRef.current;
              puntuacionRef.current += bonus;
              setPuntuacion(puntuacionRef.current);
              setCombo(comboRef.current);
              setMaxCombo(maxComboRef.current);
              mensajeRef.current = `¡${e.nombre} disipado! +${bonus} calma`;
              setMensaje(mensajeRef.current);
              // Estallido de partículas de disipación
              for (let i = 0; i < 16; i++) {
                particulasRef.current.push({
                  x: e.x,
                  y: e.y,
                  vx: (Math.random() - 0.5) * 0.07,
                  vy: (Math.random() - 0.5) * 0.07,
                  life: 40,
                  maxLife: 40,
                  color: p.color,
                });
              }
            }
            break;
          }
        }
      }

      if (impacto) continue;

      // Avanza el proyectil solo si no impactó.
      p.x += pasoX;
      p.y += pasoY;
      p.life -= 1;
      if (p.life <= 0) p.alive = false;
    }
    proyectilesRef.current = proyectilesRef.current.filter((p) => p.alive);

    // Partículas
    for (const pa of particulasRef.current) {
      pa.x += pa.vx;
      pa.y += pa.vy;
      pa.life -= 1;
    }
    particulasRef.current = particulasRef.current.filter((pa) => pa.life > 0);

    // IA: los estresores persiguen al jugador y le quitan vida al tocarle.
    for (const e of estresoresRef.current) {
      if (!e.alive) continue;

      // Enemigos en animación de muerte: avanzan su animación y no interactúan.
      if (e.muriendo) {
        e.muerte -= 0.045;
        if (e.muerte <= 0) {
          e.muerte = 0;
          e.alive = false;
        }
        continue;
      }

      const dx = jugador.x - e.x;
      const dy = jugador.y - e.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.0001) continue;

      // Movimiento de persecución con colisión simple por ejes.
      if (dist > DISTANCIA_TOQUE) {
        const paso = e.velocidad;
        const nx = e.x + (dx / dist) * paso;
        const ny = e.y + (dy / dist) * paso;
        if (esLibre(nx, e.y)) e.x = nx;
        if (esLibre(e.x, ny)) e.y = ny;
      }

      // Toque al jugador: quita 1/3 de vida con cooldown.
      if (dist * dist < DISTANCIA_TOQUE * DISTANCIA_TOQUE && ahora - e.ultimoToque > COOLDOWN_TOQUE) {
        e.ultimoToque = ahora;
        // Recompensa por aguantar el toque (como BO1 da puntos por daño recibido).
        puntuacionRef.current += PUNTOS_POR_TOQUE;
        setPuntuacion(puntuacionRef.current);
        vidaRef.current = Math.max(0, vidaRef.current - DANO_POR_TOQUE);
        setVida(vidaRef.current);
        toqueFlashRef.current = 1;
        mensajeRef.current = `¡${e.nombre} te alcanzó! Respira y retrocede.`;
        setMensaje(mensajeRef.current);

        if (vidaRef.current <= 0) {
          endGame(true);
          return;
        }
      }
    }

    // Spawn progresivo de estresores (aumenta con la ronda).
    const vivos = estresoresRef.current.filter((e) => e.alive && !e.muriendo).length;
    const limiteRonda = Math.min(MAX_ESTRESORES, 5 + rondaRef.current);
    if (vivos < limiteRonda && ahora - ultimoSpawnRef.current > Math.max(700, 2000 - rondaRef.current * 150)) {
      ultimoSpawnRef.current = ahora;
      estresoresRef.current.push(generarEstresor());
    }

    estresoresRef.current = estresoresRef.current.filter((e) => e.alive);
    setEstresoresRestantes(estresoresRef.current.filter((e) => !e.muriendo).length);

    // Subida de ronda cada 30 segundos.
    const rondaCalculada = 1 + Math.floor((DURACION - tiempoRef.current) / 30);
    if (rondaCalculada !== rondaRef.current) {
      rondaRef.current = rondaCalculada;
      setRonda(rondaCalculada);
      mensajeRef.current = `Ronda ${rondaCalculada}: el estrés se intensifica`;
      setMensaje(mensajeRef.current);
    }
  }, [esLibre, generarEstresor]);

  /** Dibuja el mundo 3D con raycasting, sprites, armas de pared y HUD. */
  const renderizar = useCallback((ctx: CanvasRenderingContext2D) => {
    const { x: posX, y: posY, dir } = jugadorRef.current;

    // Cielo degradado (amanecer sereno)
    const gradCielo = ctx.createLinearGradient(0, 0, 0, ALTO / 2);
    gradCielo.addColorStop(0, '#bae6fd');
    gradCielo.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = gradCielo;
    ctx.fillRect(0, 0, ANCHO, ALTO / 2);

    // Suelo
    const gradSuelo = ctx.createLinearGradient(0, ALTO / 2, 0, ALTO);
    gradSuelo.addColorStop(0, '#86efac');
    gradSuelo.addColorStop(1, '#22c55e');
    ctx.fillStyle = gradSuelo;
    ctx.fillRect(0, ALTO / 2, ANCHO, ALTO / 2);

    // Paredes (raycasting por columnas)
    const dirX = Math.cos(dir);
    const dirY = Math.sin(dir);
    const planoX = -dirY * Math.tan(FOV / 2);
    const planoY = dirX * Math.tan(FOV / 2);

    for (let col = 0; col < ANCHO; col += 2) {
      const camX = (2 * col) / ANCHO - 1;
      const rayDirX = dirX + planoX * camX;
      const rayDirY = dirY + planoY * camX;

      const rayo = lanzarRayo(posX, posY, rayDirX, rayDirY);
      const alturaLinea = Math.floor(ALTO / rayo.distancia);
      const inicio = Math.floor(-alturaLinea / 2 + ALTO / 2);
      const fin = Math.floor(alturaLinea / 2 + ALTO / 2);

      const colores = COLORES_PARED[rayo.tipoPared] ?? COLORES_PARED[1]!;
      ctx.fillStyle = rayo.lado === 1 ? colores.sombra : colores.base;
      ctx.fillRect(col, inicio, 2, Math.max(0, fin - inicio));

      // Neblina de distancia (calma atmosférica).
      const niebla = Math.min(0.55, rayo.distancia / 18);
      if (niebla > 0.02) {
        ctx.fillStyle = `rgba(224, 242, 254, ${niebla})`;
        ctx.fillRect(col, inicio, 2, Math.max(0, fin - inicio));
      }
    }

    // Utilidad de proyección de sprites.
    const proyectar = (wx: number, wy: number) => {
      const dx = wx - posX;
      const dy = wy - posY;
      const invDet = 1 / (planoX * dirY - dirX * planoY);
      const transformX = invDet * (dirY * dx - dirX * dy);
      const transformY = invDet * (-planoY * dx + planoX * dy);
      if (transformY <= 0.1) return null;
      const sx = (ANCHO / 2) * (1 + transformX / transformY);
      return { sx, transformY };
    };

    // Sprites (estresores) ordenados de lejos a cerca.
    const sprites = estresoresRef.current
      .map((e) => {
        const dx = e.x - posX;
        const dy = e.y - posY;
        return { e, dist: dx * dx + dy * dy };
      })
      .sort((a, b) => b.dist - a.dist);

    for (const { e } of sprites) {
      const proj = proyectar(e.x, e.y);
      if (!proj) continue;
      const { sx: spriteScreenX, transformY } = proj;
      const spriteHeight = Math.abs(Math.floor(ALTO / transformY));
      const spriteWidth = spriteHeight;
      const inicioY = Math.floor(-spriteHeight / 2 + ALTO / 2);

      // Animación de muerte: se expande, se eleva y se desvanece.
      const progresoMuerte = e.muriendo ? 1 - e.muerte : 0; // 0 -> 1
      const escalaMuerte = e.muriendo ? 1 + progresoMuerte * 0.8 : 1;
      const alfaMuerte = e.muriendo ? Math.max(0, e.muerte) : 1;
      const elevacionMuerte = e.muriendo ? progresoMuerte * spriteHeight * 0.5 : 0;
      const altoSprite = spriteHeight * escalaMuerte;

      // Sombra en el suelo (se desvanece en la muerte)
      ctx.fillStyle = `rgba(0,0,0,${0.18 * alfaMuerte})`;
      ctx.beginPath();
      ctx.ellipse(spriteScreenX, ALTO / 2 + spriteHeight * 0.42, spriteWidth * 0.28, spriteHeight * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();

      // Aura de disipación (anillo que se expande al morir)
      if (e.muriendo) {
        ctx.save();
        ctx.globalAlpha = alfaMuerte * 0.6;
        ctx.strokeStyle = '#a5f3fc';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(spriteScreenX, ALTO / 2 - elevacionMuerte, spriteWidth * (0.3 + progresoMuerte * 0.5), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Cuerpo del estresor (nube temática)
      ctx.save();
      ctx.globalAlpha = alfaMuerte * (e.hitFlash > 0 ? 0.5 : 0.95);
      ctx.font = `${Math.max(16, altoSprite * 0.7)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.emoji, spriteScreenX, ALTO / 2 - altoSprite * 0.05 - elevacionMuerte);
      ctx.restore();
      ctx.globalAlpha = 1;

      // Barra de vida (calma restante) — solo mientras está vivo.
      if (!e.muriendo) {
        const barraAncho = spriteWidth * 0.6;
        const barraX = spriteScreenX - barraAncho / 2;
        const barraY = inicioY + spriteHeight * 0.05;
        const fraccion = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(barraX, barraY, barraAncho, 5);
        // Color según vida restante: verde -> ámbar -> rojo.
        ctx.fillStyle = fraccion > 0.6 ? '#22d3ee' : fraccion > 0.3 ? '#facc15' : '#f87171';
        ctx.fillRect(barraX, barraY, barraAncho * fraccion, 5);
      }

      if (e.hitFlash > 0) e.hitFlash -= 0.08;
    }

    // Armas montadas en las paredes (compra).
    for (const pared of ARMAS_PARED) {
      const proj = proyectar(pared.cx + 0.5, pared.cy + 0.5);
      if (!proj) continue;
      const { sx, transformY } = proj;
      const tam = Math.max(18, Math.floor(ALTO / transformY) * 0.4);
      const arma = ARMAS[pared.armaId];
      if (!arma) continue;

      const panelAncho = tam * 1.4;
      const panelAlto = tam * 1.6;
      const px = sx - panelAncho / 2;
      const py = ALTO / 2 - panelAlto / 2;

      const yaComprada = armasCompradas.includes(pared.armaId);
      ctx.fillStyle = yaComprada ? 'rgba(16,185,129,0.85)' : 'rgba(15,23,42,0.78)';
      ctx.strokeStyle = yaComprada ? '#34d399' : '#facc15';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(px, py, panelAncho, panelAlto);
      ctx.fill();
      ctx.stroke();

      // Silueta del arma (cañón) en el panel
      dibujarSiluetaArma(ctx, arma.estilo, sx, py + panelAlto * 0.4, tam * 0.9, arma.color);

      ctx.font = `bold ${Math.max(9, tam * 0.32)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = yaComprada ? '#ecfdf5' : '#fde047';
      ctx.fillText(yaComprada ? 'MUNICIÓN' : `${arma.precio}`, sx, py + panelAlto * 0.82);
    }

    // Proyectiles de calma (balas temáticas según el cañón)
    for (const p of proyectilesRef.current) {
      const proj = proyectar(p.x, p.y);
      if (!proj) continue;
      const { sx, transformY } = proj;
      const sy = ALTO / 2;
      const r = Math.max(2, (p.tamano / transformY) * 1.4);
      dibujarBala(ctx, p.forma, sx, sy, r, p.color, p.borde);
    }

    // Partículas
    for (const pa of particulasRef.current) {
      const proj = proyectar(pa.x, pa.y);
      if (!proj) continue;
      ctx.globalAlpha = pa.life / pa.maxLife;
      ctx.fillStyle = pa.color;
      ctx.fillRect(proj.sx, ALTO / 2, 3, 3);
      ctx.globalAlpha = 1;
    }

    // Viñeta de calma (borde suave), se intensifica al recibir daño.
    const intensidadDano = toqueFlashRef.current * 0.5;
    const vineta = ctx.createRadialGradient(ANCHO / 2, ALTO / 2, ALTO * 0.3, ANCHO / 2, ALTO / 2, ALTO * 0.75);
    vineta.addColorStop(0, 'rgba(0,0,0,0)');
    vineta.addColorStop(1, `rgba(${Math.round(120 + intensidadDano * 135)}, 20, 34, ${0.35 + intensidadDano})`);
    ctx.fillStyle = vineta;
    ctx.fillRect(0, 0, ANCHO, ALTO);
    if (toqueFlashRef.current > 0) toqueFlashRef.current = Math.max(0, toqueFlashRef.current - 0.04);

    // Viewmodel: cañón en primera persona (siempre visible).
    const armaVista = ARMAS[armaActualRef.current];
    if (armaVista) {
      dibujarCanon(ctx, armaVista.estilo, armaVista.color, armaVista.borde, recoilRef.current);
      // Destello de boca al disparar.
      if (muzzleRef.current > 0) {
        ctx.save();
        ctx.globalAlpha = muzzleRef.current;
        ctx.fillStyle = armaVista.color;
        ctx.beginPath();
        ctx.arc(ANCHO / 2, ALTO - 150, 22 * muzzleRef.current, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = muzzleRef.current * 0.6;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(ANCHO / 2, ALTO - 150, 12 * muzzleRef.current, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    // Decaimiento de la animación del arma.
    if (recoilRef.current > 0) recoilRef.current = Math.max(0, recoilRef.current - 0.08);
    if (muzzleRef.current > 0) muzzleRef.current = Math.max(0, muzzleRef.current - 0.15);

    // Retícula
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ANCHO / 2 - 10, ALTO / 2);
    ctx.lineTo(ANCHO / 2 - 3, ALTO / 2);
    ctx.moveTo(ANCHO / 2 + 3, ALTO / 2);
    ctx.lineTo(ANCHO / 2 + 10, ALTO / 2);
    ctx.moveTo(ANCHO / 2, ALTO / 2 - 10);
    ctx.lineTo(ANCHO / 2, ALTO / 2 - 3);
    ctx.moveTo(ANCHO / 2, ALTO / 2 + 3);
    ctx.lineTo(ANCHO / 2, ALTO / 2 + 10);
    ctx.stroke();
  }, [lanzarRayo, armasCompradas]);

  /** Bucle principal: movimiento, combate y render. */
  const gameLoop = useCallback(() => {
    if (!isMountedRef.current || !runningRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const jugador = jugadorRef.current;
    const teclas = teclasRef.current;

    // Rotación
    if (teclas.has('ArrowLeft') || teclas.has('a')) jugador.dir -= VELOCIDAD_ROT;
    if (teclas.has('ArrowRight') || teclas.has('d')) jugador.dir += VELOCIDAD_ROT;

    // Movimiento con colisión
    const dirX = Math.cos(jugador.dir);
    const dirY = Math.sin(jugador.dir);
    if (teclas.has('ArrowUp') || teclas.has('w')) {
      const nx = jugador.x + dirX * VELOCIDAD_MOV;
      const ny = jugador.y + dirY * VELOCIDAD_MOV;
      if (esLibre(nx, jugador.y)) jugador.x = nx;
      if (esLibre(jugador.x, ny)) jugador.y = ny;
    }
    if (teclas.has('ArrowDown') || teclas.has('s')) {
      const nx = jugador.x - dirX * VELOCIDAD_MOV;
      const ny = jugador.y - dirY * VELOCIDAD_MOV;
      if (esLibre(nx, jugador.y)) jugador.x = nx;
      if (esLibre(jugador.x, ny)) jugador.y = ny;
    }

    actualizarCombate();

    // Detecta arma de pared cercana para mostrar el prompt de compra.
    const cercana = armaParedCercana();
    setArmaCercana((prev) => (prev?.id === cercana?.id ? prev : cercana));

    renderizar(ctx);

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [esLibre, actualizarCombate, renderizar, armaParedCercana]);

  const endGame = useCallback((derrota: boolean) => {
    if (!isMountedRef.current) return;
    runningRef.current = false;

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    const duracion = Math.max(0, DURACION - tiempoRef.current);
    const puntuacionFinal = puntuacionRef.current;
    setCompletado(true);
    setMensaje(derrota
      ? 'La mente necesita descanso. Vuelve cuando estés listo.'
      : 'Has restaurado la calma. La paz interior es tu victoria.');

    localStorage.setItem('menteGuerreraLastSession', JSON.stringify({
      type: 'mente-guerrera',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      finalScore: puntuacionFinal,
      finalCombo: maxComboRef.current,
      duration: duracion,
      completed: true,
    }));
    localStorage.removeItem('currentGameSession');

    if (typeof onGameComplete === 'function') {
      try {
        onGameComplete(puntuacionFinal, maxComboRef.current, 'mente-guerrera', duracion);
      } catch (error) {
        console.error('Error in onGameComplete:', error);
      }
    }
  }, [onGameComplete]);

  const startGame = useCallback(() => {
    if (!isMountedRef.current) return;

    jugadorRef.current = { x: 1.5, y: 1.5, dir: 0 };
    teclasRef.current = new Set();
    proyectilesRef.current = [];
    particulasRef.current = [];
    puntuacionRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    vidaRef.current = VIDA_MAX;
    tiempoRef.current = DURACION;
    estresorIdRef.current = 0;
    ultimoSpawnRef.current = 0;
    ultimoDisparoRef.current = 0;
    mensajeRef.current = 'Respira. El estrés no te define.';
    rondaRef.current = 1;
    toqueFlashRef.current = 0;
    armaActualRef.current = 'calma';
    recargandoRef.current = false;
    armasRef.current = {
      calma: { armaId: 'calma', cargador: ARMAS.calma?.cargador ?? 8, reserva: ARMAS.calma?.reserva ?? 80 },
    };

    const iniciales: Estresor[] = [];
    for (let i = 0; i < 5; i++) iniciales.push(generarEstresor());
    estresoresRef.current = iniciales;

    setPuntuacion(0);
    setCombo(0);
    setMaxCombo(0);
    setVida(VIDA_MAX);
    setTiempoRestante(DURACION);
    setMensaje('Respira. El estrés no te define.');
    setEstresoresRestantes(iniciales.length);
    setRonda(1);
    setArmaActual('calma');
    setCargador(ARMAS.calma?.cargador ?? 8);
    setReserva(ARMAS.calma?.reserva ?? 80);
    setArmasCompradas(['calma']);
    setArmaCercana(null);
    setRecargando(false);
    setIniciado(true);
    setCompletado(false);
    runningRef.current = true;

    localStorage.setItem('currentGameSession', JSON.stringify({
      type: 'mente-guerrera',
      startTime: new Date().toISOString(),
      initialScore: 0,
      initialCombo: 0,
    }));

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      tiempoRef.current -= 1;
      setTiempoRestante(Math.max(0, tiempoRef.current));
      if (tiempoRef.current <= 0) {
        endGame(false);
      }
    }, 1000);

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [generarEstresor, endGame, gameLoop]);

  // Controles de teclado
  useEffect(() => {
    if (!iniciado || completado) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (e.key === ' ') {
        disparar();
        return;
      }
      if (e.key.toLowerCase() === 'r') {
        recargar();
        return;
      }
      if (e.key.toLowerCase() === 'e') {
        const cercana = armaParedCercana();
        if (cercana) comprarArma(cercana);
        return;
      }
      // Selección rápida de armas con 1-5.
      const idx = Number.parseInt(e.key, 10);
      if (idx >= 1 && idx <= ORDEN_ARMAS.length) {
        const armaId = ORDEN_ARMAS[idx - 1];
        if (armaId) cambiarArma(armaId);
        return;
      }
      teclasRef.current.add(e.key.toLowerCase());
      teclasRef.current.add(e.key);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      teclasRef.current.delete(e.key.toLowerCase());
      teclasRef.current.delete(e.key);
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [iniciado, completado, disparar, recargar, cambiarArma, comprarArma, armaParedCercana]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const armaInfo = ARMAS[armaActual];

  if (completado) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full">
          <div className="text-center">
            <div className="text-6xl mb-4">🧘‍♂️</div>
            <h2 className="text-2xl font-bold mb-2">Mente Guerrera</h2>
            <p className="text-sm text-gray-500 mb-6">{mensaje}</p>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-3 bg-cyan-50 rounded-lg">
                <span className="text-cyan-700">Calma Total</span>
                <span className="font-bold text-xl text-cyan-800">{puntuacion}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Mejor Combo</span>
                <span className="font-bold text-xl">{maxCombo}x</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Ronda Alcanzada</span>
                <span className="font-bold text-xl">{ronda}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Tiempo</span>
                <span className="font-bold text-xl">{formatTime(Math.max(0, DURACION - tiempoRestante))}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-emerald-100 rounded-lg">
                <span className="text-emerald-600">Puntos Ganados</span>
                <span className="font-bold text-xl text-emerald-700">+{Math.floor(puntuacion / 10)}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onBack}
                className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setCompletado(false);
                  setIniciado(false);
                  startGame();
                }}
                className="flex-1 py-3 bg-cyan-600 text-white rounded-lg font-medium hover:bg-cyan-700 transition-colors"
              >
                Jugar de nuevo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-emerald-50 flex items-center justify-center p-4">
      <div className="max-w-3xl w-full">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Volver</span>
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-cyan-700">Mente Guerrera 3D</h1>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-lg">
          {!iniciado ? (
            <div className="text-center py-6">
              <div className="text-6xl mb-4">🧘‍♂️🎯</div>
              <h2 className="text-xl font-semibold mb-2">Defiende tu calma</h2>
              <p className="text-gray-600 mb-2 max-w-md mx-auto">
                Los estresores (ansiedad, insomnio, rumiación) te perseguirán.
                Si te tocan 3 veces, pierdes toda tu calma. Gana puntos disipándolos
                y compra armas en las paredes para resistir.
              </p>
              <div className="bg-sky-50 rounded-lg p-3 my-4 text-left text-sm text-gray-700 max-w-md mx-auto">
                <p className="font-semibold mb-1">Controles:</p>
                <p>• <strong>W A S D</strong> o <strong>flechas</strong>: moverte</p>
                <p>• <strong>Ratón</strong>: girar (arrastra sobre el lienzo)</p>
                <p>• <strong>Espacio</strong> o <strong>clic</strong>: disparar</p>
                <p>• <strong>R</strong>: recargar · <strong>1-5</strong>: cambiar de arma</p>
                <p>• <strong>E</strong>: comprar arma de la pared cercana</p>
              </div>
              <button
                onClick={startGame}
                className="w-full max-w-md py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition-colors"
              >
                Comenzar
              </button>
            </div>
          ) : (
            <div>
              {/* HUD superior */}
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-500" />
                  <span className="font-bold text-amber-600">{puntuacion}</span>
                  {combo > 1 && (
                    <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-semibold">
                      {combo}x
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                    Ronda {ronda}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Heart className="h-5 w-5 text-rose-500" />
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 transition-all"
                      style={{ width: `${vida}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">{formatTime(tiempoRestante)}</span>
                </div>
              </div>

              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={ANCHO}
                  height={ALTO}
                  className="rounded-xl w-full cursor-crosshair select-none bg-sky-100"
                  style={{ touchAction: 'none' }}
                  onClick={disparar}
                  onMouseDown={(e) => {
                    const startX = e.clientX;
                    const startDir = jugadorRef.current.dir;
                    const onMove = (ev: MouseEvent) => {
                      jugadorRef.current.dir = startDir + (ev.clientX - startX) * 0.005;
                    };
                    const onUp = () => {
                      window.removeEventListener('mousemove', onMove);
                      window.removeEventListener('mouseup', onUp);
                    };
                    window.addEventListener('mousemove', onMove);
                    window.addEventListener('mouseup', onUp);
                  }}
                />

                {/* Indicador de estresores */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/40 text-white text-xs px-3 py-1 rounded-full">
                  <Crosshair className="h-3 w-3 inline mr-1" />
                  {estresoresRestantes} estresores
                </div>

                {/* Prompt de compra de arma de pared */}
                {armaCercana && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs md:text-sm px-4 py-2 rounded-lg text-center">
                    <p className="font-semibold">
                      {ARMAS[armaCercana.armaId]?.icono} {ARMAS[armaCercana.armaId]?.nombre}
                    </p>
                    <p className="text-amber-300">
                      {armasCompradas.includes(armaCercana.armaId)
                        ? 'Pulsa E para reabastecer munición'
                        : `Pulsa E para comprar (${ARMAS[armaCercana.armaId]?.precio} calma)`}
                    </p>
                  </div>
                )}

                {/* Aviso de recarga */}
                {recargando && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white text-sm px-4 py-2 rounded-lg">
                    Recargando…
                  </div>
                )}
              </div>

              {/* HUD inferior: arma, munición y vida */}
              <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{armaInfo?.icono}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 leading-tight">{armaInfo?.nombre}</p>
                    <p className="text-xs text-gray-500">
                      {cargador} / {reserva}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {ORDEN_ARMAS.map((id) => {
                    const tiene = armasCompradas.includes(id);
                    const activa = armaActual === id;
                    return (
                      <button
                        key={id}
                        onClick={() => cambiarArma(id)}
                        disabled={!tiene}
                        title={ARMAS[id]?.nombre}
                        className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-all ${
                          activa
                            ? 'bg-cyan-600 border-cyan-700 text-white'
                            : tiene
                              ? 'bg-white border-gray-300 hover:border-cyan-400'
                              : 'bg-gray-100 border-gray-200 opacity-40'
                        }`}
                      >
                        {tiene ? ARMAS[id]?.icono : '🔒'}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={recargar}
                  disabled={recargando}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50"
                >
                  <Zap className="h-4 w-4" /> Recargar (R)
                </button>
              </div>

              {/* Botón de compra para móvil */}
              {armaCercana && (
                <button
                  onClick={() => comprarArma(armaCercana)}
                  className="mt-3 w-full py-2 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  {armasCompradas.includes(armaCercana.armaId)
                    ? 'Reabastecer munición'
                    : `Comprar ${ARMAS[armaCercana.armaId]?.nombre} (${ARMAS[armaCercana.armaId]?.precio})`}
                </button>
              )}

              <p className="text-center text-sm text-cyan-700 mt-3 font-medium">{mensaje}</p>

              {/* Controles táctiles */}
              <div className="flex justify-center gap-2 mt-3 md:hidden">
                <button
                  onPointerDown={() => teclasRef.current.add('ArrowLeft')}
                  onPointerUp={() => teclasRef.current.delete('ArrowLeft')}
                  onPointerLeave={() => teclasRef.current.delete('ArrowLeft')}
                  className="w-14 h-14 bg-gray-200 rounded-full font-bold text-xl active:bg-gray-300"
                >
                  ↺
                </button>
                <button
                  onPointerDown={() => teclasRef.current.add('ArrowUp')}
                  onPointerUp={() => teclasRef.current.delete('ArrowUp')}
                  onPointerLeave={() => teclasRef.current.delete('ArrowUp')}
                  className="w-14 h-14 bg-gray-200 rounded-full font-bold text-xl active:bg-gray-300"
                >
                  ↑
                </button>
                <button
                  onClick={disparar}
                  className="w-14 h-14 bg-cyan-600 text-white rounded-full font-bold text-xl active:bg-cyan-700"
                >
                  ✦
                </button>
                <button
                  onPointerDown={() => teclasRef.current.add('ArrowRight')}
                  onPointerUp={() => teclasRef.current.delete('ArrowRight')}
                  onPointerLeave={() => teclasRef.current.delete('ArrowRight')}
                  className="w-14 h-14 bg-gray-200 rounded-full font-bold text-xl active:bg-gray-300"
                >
                  ↻
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Leyenda de armas de pared */}
        {iniciado && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
            {ARMAS_PARED.map((pared) => {
              const arma = ARMAS[pared.armaId];
              const comprada = armasCompradas.includes(pared.armaId);
              return (
                <div
                  key={pared.id}
                  className={`rounded-lg p-2 border text-xs ${
                    comprada ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-1 font-semibold text-gray-800">
                    <span>{arma?.icono}</span>
                    <span className="truncate">{arma?.nombre}</span>
                  </div>
                  <p className="text-gray-500 text-[10px] leading-tight mt-0.5">{arma?.descripcion}</p>
                  <p className={`font-bold mt-1 ${comprada ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {comprada ? 'Comprada' : `${arma?.precio} calma`}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
