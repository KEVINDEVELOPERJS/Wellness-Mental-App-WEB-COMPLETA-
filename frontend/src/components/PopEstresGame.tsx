import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Flame, Clock } from 'lucide-react';
import {
  animations,
  getComboAnimation,
  getComboColor,
  getMotivationalPhrase,
} from '../utils/animations';

interface PopEstresGameProps {
  onBack: () => void;
  onGameComplete: (score: number, combo: number, gameType?: string, duration?: number) => void;
}

interface Bubble {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  type: 'estres' | 'calma';
  wobble: number;
  wobbleSpeed: number;
}

const DURATION = 45; // seconds
const WIDTH = 320;
const HEIGHT = 420;

const STRESS_LABELS = ['😠', '😰', '😫', '😖', '🥺', '😣', '😩', '😤', '😨', '😵'];
const CALM_LABELS = ['😊', '😌', '🙂', '😄', '🤗', '😇', '🥰', '😎'];

let bubbleIdCounter = 0;

export default function PopEstresGame({ onBack, onGameComplete }: PopEstresGameProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [gameComplete, setGameComplete] = useState(false);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [motivationalPhrase, setMotivationalPhrase] = useState(getMotivationalPhrase(0));

  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speedRef = useRef(1);
  const isMountedRef = useRef(true);
  const bubblesRef = useRef<Bubble[]>([]);
  const missedRef = useRef(0);

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
    setMaxCombo(0);
    setBubbles([]);
    bubblesRef.current = [];
    missedRef.current = 0;
    speedRef.current = 1;
    setMotivationalPhrase(getMotivationalPhrase(0));

    const gameSession = {
      type: 'pop-estres',
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
    spawnRef.current = setInterval(spawnBubble, 700);

    // Initial bubbles
    for (let i = 0; i < 6; i++) {
      setTimeout(spawnBubble, i * 150);
    }
  };

  const spawnBubble = () => {
    if (!isMountedRef.current) return;

    const isCalm = Math.random() < 0.2; // 20% son calma (bonus), 80% estrés
    const size = 40 + Math.random() * 30;
    const type = isCalm ? 'calma' : 'estres';

    const bubble: Bubble = {
      id: bubbleIdCounter++,
      x: size / 2 + Math.random() * (WIDTH - size),
      y: HEIGHT + size,
      size,
      speed: 1 + Math.random() * 1.5,
      type,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
    };

    bubblesRef.current = [...bubblesRef.current, bubble];
    setBubbles(bubblesRef.current);
  };

  const floatBubbles = () => {
    if (!isMountedRef.current || !gameStarted) return;

    const floating: Bubble[] = [];
    let missed = false;

    for (const b of bubblesRef.current) {
      const nextY = b.y - b.speed * (0.6 + speedRef.current * 0.4);
      const wobble = b.wobble + b.wobbleSpeed;
      const x = b.x + Math.sin(wobble) * 0.8;

      if (nextY < -b.size) {
        // Bubble escaped - if it was stress, count as missed
        if (b.type === 'estres') {
          missedRef.current += 1;
          missed = true;
        }
        continue;
      }

      floating.push({ ...b, y: nextY, x, wobble });
    }

    bubblesRef.current = floating;
    setBubbles(floating);

    // Speed up over time
    speedRef.current = Math.min(speedRef.current + 0.002, 2.5);

    if (missed && missedRef.current >= 5) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnRef.current) clearInterval(spawnRef.current);
      // Too many escaped - game over
      endGame();
      return;
    }
  };

  useEffect(() => {
    if (!gameStarted || gameComplete) return;
    const interval = setInterval(floatBubbles, 50);
    return () => clearInterval(interval);
  }, [gameStarted, gameComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBubbleClick = (bubble: Bubble) => {
    if (!gameStarted || gameComplete || !isMountedRef.current) return;

    // Remove bubble
    const remaining = bubblesRef.current.filter((b) => b.id !== bubble.id);
    bubblesRef.current = remaining;
    setBubbles(remaining);

    // Apply pop animation to the clicked element
    const element = document.getElementById(`bubble-${bubble.id}`);
    if (element) {
      animations.destroy(element);
      setTimeout(() => {
        if (isMountedRef.current) {
          element.style.display = 'none';
        }
      }, 400);
    }

    if (bubble.type === 'estres') {
      // Popping stress = good (cathartic)
      const points = 10 * (combo + 1);
      setScore((prev) => prev + points);
      setCombo((prev) => {
        const newCombo = prev + 1;
        setMaxCombo((current) => Math.max(current, newCombo));
        return newCombo;
      });
      setMotivationalPhrase(getMotivationalPhrase(combo + 1));

      const comboElement = document.getElementById('combo-display');
      if (comboElement) {
        const animationType = getComboAnimation(combo + 1);
        // Las animaciones de combo (popIn/pulse/bounce/shake) reciben un único elemento.
        const comboAnimation = animations[animationType] as (el: HTMLElement) => void;
        comboAnimation(comboElement);
        comboElement.style.color = getComboColor(combo + 1);
      }
    } else {
      // Popping calm = bonus, resets combo (avoid spamming)
      setScore((prev) => prev + 25);
      setCombo(0);
      setMotivationalPhrase('¡Calma restaurada! +25');
      const comboElement = document.getElementById('combo-display');
      if (comboElement) {
        comboElement.style.color = '#10b981';
      }
    }
  };

  const endGame = () => {
    if (!isMountedRef.current) return;

    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);

    const duration = DURATION - timeLeft;
    setGameComplete(true);

    const gameSession = {
      type: 'pop-estres',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      finalScore: score,
      finalCombo: maxCombo,
      duration,
      completed: true,
    };
    localStorage.setItem('popEstresLastSession', JSON.stringify(gameSession));
    localStorage.removeItem('currentGameSession');

    if (typeof onGameComplete === 'function') {
      try {
        onGameComplete(score, maxCombo, 'pop', duration);
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
            <div className="text-6xl mb-4">🎈</div>
            <h2 className="text-2xl font-bold mb-6">¡PopEstrés Completado!</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Puntos</span>
                <span className="font-bold text-xl">{score}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Racha Máxima</span>
                <span className="font-bold text-xl">{maxCombo}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-100 rounded-lg">
                <span className="text-blue-600">Puntos Ganados</span>
                <span className="font-bold text-xl text-blue-700">+{Math.floor(score / 10)}</span>
              </div>
            </div>

            <div className="text-gray-600 mb-6">
              ¡Has liberado mucho estrés! Reventar globos de tensión es una gran forma de catarsis.
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
                className="flex-1 py-3 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Volver</span>
          </button>
          <h1 className="text-2xl font-bold text-rose-700">PopEstrés</h1>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-lg">
          {!gameStarted ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎈</div>
              <h2 className="text-xl font-semibold mb-2">¡Revienta el estrés!</h2>
              <p className="text-gray-600 mb-2">
                Toca los globos de estrés 😠 para reventarlos y liberar tensión.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Los globos felices 😊 dan bonus. ¡No dejes que escapen demasiados!
              </p>
              <button
                onClick={startGame}
                className="w-full py-3 bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-600 transition-colors"
              >
                Comenzar
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span id="combo-display" className="font-bold text-orange-500">
                    Combo {combo}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">{formatTime(timeLeft)}</span>
                </div>
              </div>

              <div
                ref={containerRef}
                className="relative rounded-xl border-2 border-dashed border-gray-200 overflow-hidden select-none"
                style={{ width: WIDTH, height: HEIGHT, margin: '0 auto' }}
              >
                {bubbles.map((bubble) => (
                  <button
                    key={bubble.id}
                    id={`bubble-${bubble.id}`}
                    onClick={() => handleBubbleClick(bubble)}
                    className="absolute rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform cursor-pointer select-none"
                    style={{
                      left: bubble.x,
                      top: bubble.y,
                      width: bubble.size,
                      height: bubble.size,
                      fontSize: bubble.size * 0.55,
                      background:
                        bubble.type === 'estres'
                          ? 'radial-gradient(circle at 30% 30%, #fecaca, #f87171)'
                          : 'radial-gradient(circle at 30% 30%, #bbf7d0, #34d399)',
                      border: `2px solid ${bubble.type === 'estres' ? '#ef4444' : '#10b981'}`,
                    }}
                  >
                    {bubble.type === 'estres'
                      ? STRESS_LABELS[Math.floor(Math.random() * STRESS_LABELS.length)]
                      : CALM_LABELS[Math.floor(Math.random() * CALM_LABELS.length)]}
                  </button>
                ))}
              </div>

              <p className="text-center text-sm text-gray-500 mt-3 min-h-5">
                {motivationalPhrase}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xs text-gray-500">Puntos</p>
            <p className="text-xl font-bold text-rose-600">{score}</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xs text-gray-500">Racha</p>
            <p className="text-xl font-bold text-rose-600">{combo}</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xs text-gray-500">Estrés liberado</p>
            <p className="text-xl font-bold text-rose-600">{maxCombo}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
