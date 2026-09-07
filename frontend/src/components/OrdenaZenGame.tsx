import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Clock, Layers } from 'lucide-react';
import { animations } from '../utils/animations';

interface OrdenaZenGameProps {
  onBack: () => void;
  onGameComplete: (score: number, combo: number, gameType?: string, duration?: number) => void;
}

type ColorKey = 'verde' | 'azul' | 'lila';

interface FallingItem {
  id: number;
  color: ColorKey;
  emoji: string;
  x: number;
  y: number;
  speed: number;
}

const COLOR_CONFIG: Record<ColorKey, { label: string; emoji: string; bg: string; border: string }> = {
  verde: { label: 'Verde', emoji: '🌿', bg: 'bg-green-50', border: 'border-green-400' },
  azul: { label: 'Azul', emoji: '💧', bg: 'bg-blue-50', border: 'border-blue-400' },
  lila: { label: 'Lila', emoji: '🪻', bg: 'bg-purple-50', border: 'border-purple-400' },
};

const ITEM_EMOJIS: Record<ColorKey, string> = {
  verde: '🌿',
  azul: '💧',
  lila: '🪻',
};

const DURATION = 60; // seconds
const WIDTH = 320;
const HEIGHT = 400;
const ZONES = 3;
const ZONE_HEIGHT = 90;
const MAX_MISSES = 3;

const COLOR_KEYS: ColorKey[] = ['verde', 'azul', 'lila'];

let itemIdCounter = 0;

export default function OrdenaZenGame({ onBack, onGameComplete }: OrdenaZenGameProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [misses, setMisses] = useState(0);

  const boardRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const itemsRef = useRef<FallingItem[]>([]);
  const missesRef = useRef(0);
  const speedRef = useRef(1);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
    };
  }, []);

  const startGame = () => {
    if (!isMountedRef.current) return;

    setGameStarted(true);
    setTimeLeft(DURATION);
    setScore(0);
    setCombo(0);
    setItems([]);
    itemsRef.current = [];
    missesRef.current = 0;
    setMisses(0);
    speedRef.current = 1;

    const gameSession = {
      type: 'ordena-zen',
      startTime: new Date().toISOString(),
      initialScore: 0,
      initialCombo: 0,
    };
    localStorage.setItem('currentGameSession', JSON.stringify(gameSession));

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          endGame();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    if (spawnRef.current) clearInterval(spawnRef.current);
    spawnRef.current = setInterval(spawnItem, 1300);

    // Initial items
    for (let i = 0; i < 3; i++) {
      setTimeout(spawnItem, i * 300);
    }
  };

  const spawnItem = () => {
    if (!isMountedRef.current) return;

    const color = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)]!;
    const zoneWidth = WIDTH / ZONES;

    const item: FallingItem = {
      id: itemIdCounter++,
      color,
      emoji: ITEM_EMOJIS[color],
      x: Math.floor(Math.random() * ZONES) * zoneWidth + zoneWidth / 2 - 20,
      y: -30,
      speed: 1.2 + Math.random() * 0.8,
    };

    itemsRef.current = [...itemsRef.current, item];
    setItems(itemsRef.current);
  };

  const fallItems = () => {
    if (!isMountedRef.current || !gameStarted) return;

    const falling: FallingItem[] = [];

    for (const item of itemsRef.current) {
      const nextY = item.y + item.speed * speedRef.current;

      // Item reached the drop zone area at bottom
      if (nextY > HEIGHT - ZONE_HEIGHT - 30) {
        // Determine which zone the item is over
        const zoneWidth = WIDTH / ZONES;
        const zoneIndex = Math.floor(item.x / zoneWidth);
        const zoneColor = COLOR_KEYS[zoneIndex];

        if (zoneColor && zoneColor === item.color) {
          // Correct zone - score!
          setScore((prev) => prev + 20);
          setCombo((prev) => prev + 1);
          const el = document.getElementById(`item-${item.id}`);
          if (el) animations.popIn(el);
        } else {
          // Wrong zone - miss
          missesRef.current += 1;
          setMisses(missesRef.current);
          setCombo(0);
        }
        continue; // remove item
      }

      falling.push({ ...item, y: nextY });
    }

    itemsRef.current = falling;
    setItems(falling);

    speedRef.current = Math.min(speedRef.current + 0.003, 2.4);

    if (missesRef.current >= MAX_MISSES) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
      endGame();
    }
  };

  useEffect(() => {
    if (!gameStarted || gameComplete) return;
    const interval = setInterval(fallItems, 40);
    return () => clearInterval(interval);
  }, [gameStarted, gameComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDropZoneClick = (zoneIndex: number) => {
    if (!gameStarted || gameComplete) return;

    // Find the lowest item in that zone column that's near the drop zone
    const zoneWidth = WIDTH / ZONES;
    const inZone = itemsRef.current
      .filter((item) => {
        const idx = Math.floor(item.x / zoneWidth);
        return idx === zoneIndex;
      })
      .sort((a, b) => b.y - a.y);

    const target = inZone[0];
    if (!target) return;

    // Remove it
    const remaining = itemsRef.current.filter((i) => i.id !== target.id);
    itemsRef.current = remaining;
    setItems(remaining);

    if (target.color === COLOR_KEYS[zoneIndex]) {
      setScore((prev) => prev + 20);
      setCombo((prev) => prev + 1);
    } else {
      missesRef.current += 1;
      setMisses(missesRef.current);
      setCombo(0);
    }
  };

  const endGame = () => {
    if (!isMountedRef.current) return;

    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);

    const duration = DURATION - timeLeft;
    setGameComplete(true);

    const gameSession = {
      type: 'ordena-zen',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      finalScore: score,
      finalCombo: combo,
      duration,
      completed: true,
    };
    localStorage.setItem('ordenaZenLastSession', JSON.stringify(gameSession));
    localStorage.removeItem('currentGameSession');

    if (typeof onGameComplete === 'function') {
      try {
        onGameComplete(score, combo, 'ordena', duration);
      } catch (error) {
        console.error('Error in onGameComplete:', error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (gameComplete) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🧺</div>
            <h2 className="text-2xl font-bold mb-6">¡OrdenaZen Completado!</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Puntos</span>
                <span className="font-bold text-xl">{score}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Racha</span>
                <span className="font-bold text-xl">{combo}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-teal-100 rounded-lg">
                <span className="text-teal-600">Puntos Ganados</span>
                <span className="font-bold text-xl text-teal-700">+{Math.floor(score / 10)}</span>
              </div>
            </div>

            <div className="text-gray-600 mb-6">
              Ordenar crea una sensación de control y calma mental.
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
                  setGameComplete(false);
                  setGameStarted(false);
                  startGame();
                }}
                className="flex-1 py-3 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Volver</span>
          </button>
          <h1 className="text-2xl font-bold text-teal-700">OrdenaZen</h1>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-lg">
          {!gameStarted ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🧺</div>
              <h2 className="text-xl font-semibold mb-2">Ordena para encontrar paz</h2>
              <p className="text-gray-600 mb-2">
                Cae cada elemento en su zona de color correcta. Toca la zona para soltar.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Ordenar reduce la ansiedad al darte sensación de control.
              </p>
              <button
                onClick={startGame}
                className="w-full py-3 bg-teal-500 text-white rounded-lg font-semibold hover:bg-teal-600 transition-colors"
              >
                Comenzar
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-teal-500" />
                  <span className="font-bold text-teal-600">Puntos: {score}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">{formatTime(timeLeft)}</span>
                </div>
              </div>

              <div
                ref={boardRef}
                className="relative rounded-xl border-2 border-gray-200 overflow-hidden select-none"
                style={{ width: WIDTH, height: HEIGHT, margin: '0 auto' }}
              >
                {/* Drop zones at bottom */}
                <div className="absolute bottom-0 left-0 right-0 flex" style={{ height: ZONE_HEIGHT }}>
                  {(Object.keys(COLOR_CONFIG) as ColorKey[]).map((color, idx) => (
                    <button
                      key={color}
                      onClick={() => handleDropZoneClick(idx)}
                      className={`flex-1 border-t ${COLOR_CONFIG[color].bg} ${COLOR_CONFIG[color].border} flex flex-col items-center justify-center hover:opacity-80 transition-opacity`}
                    >
                      <span className="text-2xl">{COLOR_CONFIG[color].emoji}</span>
                      <span className="text-xs font-medium text-gray-600">{COLOR_CONFIG[color].label}</span>
                    </button>
                  ))}
                </div>

                {/* Falling items */}
                {items.map((item) => (
                  <div
                    key={item.id}
                    id={`item-${item.id}`}
                    className="absolute text-3xl"
                    style={{ left: item.x, top: item.y }}
                  >
                    {item.emoji}
                  </div>
                ))}

                {/* Miss counter */}
                <div className="absolute top-2 right-2 bg-white/80 rounded-full px-2 py-1 text-xs font-medium">
                  Fallos: {misses}/{MAX_MISSES}
                </div>
              </div>

              <p className="text-center text-sm text-gray-500 mt-3">
                Toca la zona correcta para soltar el elemento
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
