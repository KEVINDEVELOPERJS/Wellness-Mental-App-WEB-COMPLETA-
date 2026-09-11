import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Crosshair, Heart, Target, Clock } from 'lucide-react';

/**
 * Mente Guerrera — shooter 3D en primera persona con temática de salud mental.
 *
 * Motor: raycasting sobre Canvas 2D (estilo Wolfenstein 3D / Doom), sin
 * dependencias externas. El mapa es un jardín zen con senderos, árboles y
 * fuentes. El jugador dispara "proyectiles de calma" a los "estresores"
 * (ansiedad, insomnio, rumiación) en lugar de enemigos: el objetivo es
 * restaurar la paz mental, no la violencia.
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
}

/** Proyectil de calma disparado por el jugador. */
interface Proyectil {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  life: number;
  alive: boolean;
}

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

const TIPOS_ESTRESOR = [
  { emoji: '😰', nombre: 'Ansiedad' },
  { emoji: '🌪️', nombre: 'Rumiación' },
  { emoji: '🌙', nombre: 'Insomnio' },
  { emoji: '⛈️', nombre: 'Estrés' },
  { emoji: '🕳️', nombre: 'Desánimo' },
] as const;

const DURACION = 90; // segundos
const FOV = Math.PI / 3; // 60 grados
const VELOCIDAD_MOV = 0.045;
const VELOCIDAD_ROT = 0.045;
const PUNTOS_POR_ESTRESOR = 100;
const CALMA_POR_DISPARO = 1;

export default function MenteGuerreraGame({ onBack, onGameComplete }: MenteGuerreraGameProps) {
  const [iniciado, setIniciado] = useState(false);
  const [completado, setCompletado] = useState(false);
  const [puntuacion, setPuntuacion] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [tiempoRestante, setTiempoRestante] = useState(DURACION);
  const [vida, setVida] = useState(100);
  const [mensaje, setMensaje] = useState('Respira. El estrés no te define.');
  const [estresoresRestantes, setEstresoresRestantes] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const runningRef = useRef(false);

  // Estado del jugador (refs para el bucle de animación, sin re-render).
  const jugadorRef = useRef({ x: 2.5, y: 2.5, dir: 0 });
  const teclasRef = useRef<Set<string>>(new Set());
  const estresoresRef = useRef<Estresor[]>([]);
  const proyectilesRef = useRef<Proyectil[]>([]);
  const particulasRef = useRef<Particula[]>([]);
  const puntuacionRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const vidaRef = useRef(100);
  const tiempoRef = useRef(DURACION);
  const estresorIdRef = useRef(0);
  const ultimoSpawnRef = useRef(0);
  const ultimoDisparoRef = useRef(0);
  const mensajeRef = useRef('Respira. El estrés no te define.');

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
    let x = 2.5;
    let y = 2.5;
    for (let intento = 0; intento < 50; intento++) {
      const cx = 1 + Math.random() * (MAPA_ANCHO - 2);
      const cy = 1 + Math.random() * (MAPA_ALTO - 2);
      if (esLibre(cx, cy)) {
        // Evita aparecer encima del jugador.
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
    return {
      id: estresorIdRef.current,
      x,
      y,
      hp: 2,
      maxHp: 2,
      alive: true,
      emoji: tipo.emoji,
      nombre: tipo.nombre,
      hitFlash: 0,
    };
  }, [esLibre]);

  const startGame = useCallback(() => {
    if (!isMountedRef.current) return;

    jugadorRef.current = { x: 2.5, y: 2.5, dir: 0 };
    teclasRef.current = new Set();
    proyectilesRef.current = [];
    particulasRef.current = [];
    puntuacionRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    vidaRef.current = 100;
    tiempoRef.current = DURACION;
    estresorIdRef.current = 0;
    ultimoSpawnRef.current = 0;
    ultimoDisparoRef.current = 0;
    mensajeRef.current = 'Respira. El estrés no te define.';

    const iniciales: Estresor[] = [];
    for (let i = 0; i < 5; i++) iniciales.push(generarEstresor());
    estresoresRef.current = iniciales;

    setPuntuacion(0);
    setCombo(0);
    setMaxCombo(0);
    setVida(100);
    setTiempoRestante(DURACION);
    setMensaje('Respira. El estrés no te define.');
    setEstresoresRestantes(iniciales.length);
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
  }, [generarEstresor]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Dispara un proyectil de calma desde la posición del jugador. */
  const disparar = useCallback(() => {
    if (!runningRef.current) return;
    const ahora = performance.now();
    if (ahora - ultimoDisparoRef.current < 250) return; // cadencia
    ultimoDisparoRef.current = ahora;

    const { x, y, dir } = jugadorRef.current;
    proyectilesRef.current.push({
      x,
      y,
      dirX: Math.cos(dir),
      dirY: Math.sin(dir),
      life: 60,
      alive: true,
    });
  }, []);

  /** Actualiza proyectiles, colisiones con estresores y partículas. */
  const actualizarCombate = useCallback(() => {
    // Proyectiles
    for (const p of proyectilesRef.current) {
      if (!p.alive) continue;
      p.x += p.dirX * 0.18;
      p.y += p.dirY * 0.18;
      p.life -= 1;

      if (p.life <= 0 || !esLibre(p.x, p.y)) {
        p.alive = false;
        continue;
      }

      for (const e of estresoresRef.current) {
        if (!e.alive) continue;
        const dx = e.x - p.x;
        const dy = e.y - p.y;
        if (dx * dx + dy * dy < 0.16) {
          e.hp -= CALMA_POR_DISPARO;
          e.hitFlash = 1;
          p.alive = false;

          // Partículas de calma
          for (let i = 0; i < 8; i++) {
            particulasRef.current.push({
              x: e.x,
              y: e.y,
              vx: (Math.random() - 0.5) * 0.04,
              vy: (Math.random() - 0.5) * 0.04,
              life: 30,
              maxLife: 30,
              color: '#a5f3fc',
            });
          }

          if (e.hp <= 0) {
            e.alive = false;
            comboRef.current += 1;
            maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);
            const bonus = PUNTOS_POR_ESTRESOR * comboRef.current;
            puntuacionRef.current += bonus;
            setPuntuacion(puntuacionRef.current);
            setCombo(comboRef.current);
            setMaxCombo(maxComboRef.current);
            mensajeRef.current = `¡${e.nombre} disipado! +${bonus} calma`;
            setMensaje(mensajeRef.current);
          }
          break;
        }
      }
    }
    proyectilesRef.current = proyectilesRef.current.filter((p) => p.alive);

    // Partículas
    for (const pa of particulasRef.current) {
      pa.x += pa.vx;
      pa.y += pa.vy;
      pa.life -= 1;
    }
    particulasRef.current = particulasRef.current.filter((pa) => pa.life > 0);

    // Spawn progresivo de estresores
    const vivos = estresoresRef.current.filter((e) => e.alive).length;
    const ahora = performance.now();
    if (vivos < 6 && ahora - ultimoSpawnRef.current > 2000) {
      ultimoSpawnRef.current = ahora;
      estresoresRef.current.push(generarEstresor());
    }
    estresoresRef.current = estresoresRef.current.filter((e) => e.alive);
    setEstresoresRestantes(estresoresRef.current.length);
  }, [esLibre, generarEstresor]);

  /** Dibuja el mundo 3D con raycasting y los sprites de estresores. */
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
    for (let col = 0; col < ANCHO; col += 2) {
      const camX = (2 * col) / ANCHO - 1;
      const dirX = Math.cos(dir);
      const dirY = Math.sin(dir);
      const planoX = -dirY * Math.tan(FOV / 2);
      const planoY = dirX * Math.tan(FOV / 2);

      const rayDirX = dirX + planoX * camX;
      const rayDirY = dirY + planoY * camX;

      const rayo = lanzarRayo(posX, posY, rayDirX, rayDirY);
      const alturaLinea = Math.floor(ALTO / rayo.distancia);
      const inicio = Math.floor(-alturaLinea / 2 + ALTO / 2);
      const fin = Math.floor(alturaLinea / 2 + ALTO / 2);

      const colores = COLORES_PARED[rayo.tipoPared] ?? COLORES_PARED[1]!;
      // Sombrea según el lado del muro para dar profundidad.
      ctx.fillStyle = rayo.lado === 1 ? colores.sombra : colores.base;
      ctx.fillRect(col, inicio, 2, Math.max(0, fin - inicio));

      // Neblina de distancia (calma atmosférica).
      const niebla = Math.min(0.55, rayo.distancia / 18);
      if (niebla > 0.02) {
        ctx.fillStyle = `rgba(224, 242, 254, ${niebla})`;
        ctx.fillRect(col, inicio, 2, Math.max(0, fin - inicio));
      }
    }

    // Sprites (estresores) ordenados de lejos a cerca.
    const dirX = Math.cos(dir);
    const dirY = Math.sin(dir);
    const planoX = -dirY * Math.tan(FOV / 2);
    const planoY = dirX * Math.tan(FOV / 2);

    const sprites = estresoresRef.current
      .map((e) => {
        const dx = e.x - posX;
        const dy = e.y - posY;
        return { e, dist: dx * dx + dy * dy, dx, dy };
      })
      .sort((a, b) => b.dist - a.dist);

    for (const { e, dx, dy } of sprites) {
      const invDet = 1 / (planoX * dirY - dirX * planoY);
      const transformX = invDet * (dirY * dx - dirX * dy);
      const transformY = invDet * (-planoY * dx + planoX * dy);
      if (transformY <= 0.1) continue;

      const spriteScreenX = Math.floor((ANCHO / 2) * (1 + transformX / transformY));
      const spriteHeight = Math.abs(Math.floor(ALTO / transformY));
      const spriteWidth = spriteHeight;
      const inicioY = Math.floor(-spriteHeight / 2 + ALTO / 2);

      // Sombra en el suelo
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(spriteScreenX, ALTO / 2 + spriteHeight * 0.42, spriteWidth * 0.28, spriteHeight * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cuerpo del estresor (nube temática)
      ctx.font = `${Math.max(16, spriteHeight * 0.7)}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = e.hitFlash > 0 ? 0.5 : 0.95;
      ctx.fillText(e.emoji, spriteScreenX, ALTO / 2 - spriteHeight * 0.05);
      ctx.globalAlpha = 1;

      // Barra de vida (calma restante)
      const barraAncho = spriteWidth * 0.6;
      const barraX = spriteScreenX - barraAncho / 2;
      const barraY = inicioY + spriteHeight * 0.05;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(barraX, barraY, barraAncho, 5);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(barraX, barraY, barraAncho * (e.hp / e.maxHp), 5);

      if (e.hitFlash > 0) e.hitFlash -= 0.08;
    }

    // Proyectiles de calma
    for (const p of proyectilesRef.current) {
      const dx = p.x - posX;
      const dy = p.y - posY;
      const invDet = 1 / (planoX * dirY - dirX * planoY);
      const transformX = invDet * (dirY * dx - dirX * dy);
      const transformY = invDet * (-planoY * dx + planoX * dy);
      if (transformY <= 0.1) continue;
      const sx = (ANCHO / 2) * (1 + transformX / transformY);
      const sy = ALTO / 2;
      const r = Math.max(3, 12 / transformY);
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#67e8f9';
      ctx.fill();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Partículas
    for (const pa of particulasRef.current) {
      const dx = pa.x - posX;
      const dy = pa.y - posY;
      const invDet = 1 / (planoX * dirY - dirX * planoY);
      const transformX = invDet * (dirY * dx - dirX * dy);
      const transformY = invDet * (-planoY * dx + planoX * dy);
      if (transformY <= 0.1) continue;
      const sx = (ANCHO / 2) * (1 + transformX / transformY);
      const sy = ALTO / 2;
      ctx.globalAlpha = pa.life / pa.maxLife;
      ctx.fillStyle = pa.color;
      ctx.fillRect(sx, sy, 3, 3);
      ctx.globalAlpha = 1;
    }

    // Viñeta de calma (borde suave)
    const vineta = ctx.createRadialGradient(ANCHO / 2, ALTO / 2, ALTO * 0.3, ANCHO / 2, ALTO / 2, ALTO * 0.75);
    vineta.addColorStop(0, 'rgba(0,0,0,0)');
    vineta.addColorStop(1, 'rgba(2, 44, 34, 0.35)');
    ctx.fillStyle = vineta;
    ctx.fillRect(0, 0, ANCHO, ALTO);

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
  }, [lanzarRayo]);

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
    renderizar(ctx);

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [esLibre, actualizarCombate, renderizar]);

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
  }, [iniciado, completado, disparar]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
              <h2 className="text-xl font-semibold mb-2">Dispara calma a tu estrés</h2>
              <p className="text-gray-600 mb-2 max-w-md mx-auto">
                Explora un jardín zen en primera persona y disipa los estresores
                (ansiedad, insomnio, rumiación) con proyectiles de calma.
              </p>
              <div className="bg-sky-50 rounded-lg p-3 my-4 text-left text-sm text-gray-700 max-w-md mx-auto">
                <p className="font-semibold mb-1">Controles:</p>
                <p>• <strong>W A S D</strong> o <strong>flechas</strong>: moverte</p>
                <p>• <strong>Ratón</strong>: girar (arrastra sobre el lienzo)</p>
                <p>• <strong>Espacio</strong> o <strong>clic</strong>: disparar calma</p>
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
              {/* HUD */}
              <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-cyan-600" />
                  <span className="font-bold text-cyan-700">{puntuacion}</span>
                  {combo > 1 && (
                    <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-semibold">
                      {combo}x
                    </span>
                  )}
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
                    // Arrastrar para girar la vista.
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
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/40 text-white text-xs px-3 py-1 rounded-full">
                  <Crosshair className="h-3 w-3 inline mr-1" />
                  {estresoresRestantes} estresores
                </div>
              </div>

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
      </div>
    </div>
  );
}
