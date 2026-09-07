import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Wind, Clock } from 'lucide-react';

interface RespiraZenGameProps {
  onBack: () => void;
  onGameComplete: (score: number, combo: number, gameType?: string, duration?: number) => void;
}

type Phase = 'inhala' | 'sostiene' | 'exhala';

const PHASE_DURATIONS: Record<Phase, number> = {
  inhala: 4,
  sostiene: 7,
  exhala: 8,
};

const PHASE_LABELS: Record<Phase, string> = {
  inhala: 'Inhala',
  sostiene: 'Sostén',
  exhala: 'Exhala',
};

const PHASE_COLORS: Record<Phase, string> = {
  inhala: '#10b981', // emerald-500
  sostiene: '#6366f1', // indigo-500
  exhala: '#3b82f6', // blue-500
};

const TOTAL_CYCLES = 4; // 4 ciclos de 4-7-8 ≈ 76 segundos
const SCORE_PER_CYCLE = 100;

export default function RespiraZenGame({ onBack, onGameComplete }: RespiraZenGameProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [phase, setPhase] = useState<Phase>('inhala');
  const [phaseTimeLeft, setPhaseTimeLeft] = useState(PHASE_DURATIONS.inhala);
  const [score, setScore] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const phaseRef = useRef<Phase>('inhala');
  const phaseStartRef = useRef(0);
  const currentCycleRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawBreathCircle(ctx, 0.5, PHASE_COLORS.inhala, 'Inhala');
      }
    }

    return () => {
      isMountedRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const drawBreathCircle = (ctx: CanvasRenderingContext2D, progress: number, color: string, label: string) => {
    const SIZE = 300;
    ctx.clearRect(0, 0, SIZE, SIZE);
    const centerX = SIZE / 2;
    const centerY = SIZE / 2;

    // Outer guide circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 120, 0, 2 * Math.PI);
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Breathing circle (scales with progress)
    const radius = 40 + progress * 80; // 40 -> 120
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.35;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Label
    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#374151';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, centerX, centerY - 150);
  };

  const animateBreath = (phaseTarget: Phase) => {
    if (!isMountedRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const durationMs = PHASE_DURATIONS[phaseTarget] * 1000;
    phaseStartRef.current = performance.now();

    const step = (now: number) => {
      if (!isMountedRef.current) return;
      const elapsed = now - phaseStartRef.current;
      const rawProgress = Math.min(elapsed / durationMs, 1);

      // inhala: 0->1, exhala: 1->0, sostiene: 1
      let progress: number;
      if (phaseTarget === 'inhala') progress = rawProgress;
      else if (phaseTarget === 'exhala') progress = 1 - rawProgress;
      else progress = 1;

      drawBreathCircle(ctx, progress, PHASE_COLORS[phaseTarget], PHASE_LABELS[phaseTarget]);

      if (rawProgress < 1) {
        animationRef.current = requestAnimationFrame(step);
      }
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(step);
  };

  const startGame = () => {
    if (!isMountedRef.current) return;

    setGameStarted(true);
    setCycle(0);
    setPhase('inhala');
    setPhaseTimeLeft(PHASE_DURATIONS.inhala);
    setScore(0);
    setSessionDuration(0);
    currentCycleRef.current = 0;
    phaseRef.current = 'inhala';

    const gameSession = {
      type: 'respira-zen',
      startTime: new Date().toISOString(),
      initialScore: 0,
      initialCombo: 0,
    };
    localStorage.setItem('currentGameSession', JSON.stringify(gameSession));

    animateBreath('inhala');

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setPhaseTimeLeft((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          advancePhase();
          return newTime;
        }
        return newTime;
      });
      setSessionDuration((prev) => prev + 1);
    }, 1000);
  };

  const advancePhase = () => {
    if (!isMountedRef.current) return;

    const order: Phase[] = ['inhala', 'sostiene', 'exhala'];
    const currentIndex = order.indexOf(phaseRef.current);
    const nextPhase = order[(currentIndex + 1) % order.length];

    if (phaseRef.current === 'exhala') {
      // Completed a full cycle
      const newCycle = currentCycleRef.current + 1;
      currentCycleRef.current = newCycle;
      setCycle(newCycle);
      setScore((prev) => prev + SCORE_PER_CYCLE);

      if (newCycle >= TOTAL_CYCLES) {
        endGame();
        return;
      }
    }

    phaseRef.current = nextPhase;
    setPhase(nextPhase);
    setPhaseTimeLeft(PHASE_DURATIONS[nextPhase]);
    animateBreath(nextPhase);
  };

  const endGame = () => {
    if (!isMountedRef.current) return;

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    const duration = sessionDuration;
    setGameComplete(true);

    const gameSession = {
      type: 'respira-zen',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      finalScore: score,
      finalCombo: 0,
      duration,
      completed: true,
    };
    localStorage.setItem('respiraZenLastSession', JSON.stringify(gameSession));
    localStorage.removeItem('currentGameSession');

    if (typeof onGameComplete === 'function') {
      try {
        onGameComplete(score, 0, 'respira', duration);
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
            <div className="text-6xl mb-4">🧘</div>
            <h2 className="text-2xl font-bold mb-6">¡RespiraZen Completado!</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Ciclos Completados</span>
                <span className="font-bold text-xl">{cycle}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Tiempo de Respiración</span>
                <span className="font-bold text-xl">{formatTime(sessionDuration)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-emerald-100 rounded-lg">
                <span className="text-emerald-600">Puntos Ganados</span>
                <span className="font-bold text-xl text-emerald-700">+{Math.floor(score / 10)}</span>
              </div>
            </div>

            <div className="text-gray-600 mb-6">
              ¡Excelente! La respiración consciente reduce el estrés y la ansiedad.
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
                className="flex-1 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Volver</span>
          </button>
          <h1 className="text-2xl font-bold text-emerald-700">RespiraZen</h1>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg">
          {!gameStarted ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🧘</div>
              <h2 className="text-xl font-semibold mb-2">Respiración 4-7-8</h2>
              <p className="text-gray-600 mb-2">
                Inhala 4s, sostén 7s y exhala 8s. Sincroniza tu respiración con el círculo.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Esta técnica calma el sistema nervioso y reduce la ansiedad.
              </p>
              <button
                onClick={startGame}
                className="w-full py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
              >
                Comenzar respiración
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <Wind className="h-5 w-5 text-emerald-500" />
                  <span className="font-semibold">Ciclo {cycle}/{TOTAL_CYCLES}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-5 w-5 text-emerald-500" />
                  <span>{formatTime(sessionDuration)}</span>
                </div>
              </div>

              <div className="flex justify-center mb-4">
                <canvas ref={canvasRef} width={300} height={300} />
              </div>

              <p className="text-lg font-medium text-gray-700 mb-2">
                {PHASE_LABELS[phase]} — {Math.max(phaseTimeLeft, 0)}s
              </p>

              <div className="flex justify-center gap-2 mb-4">
                {(Object.keys(PHASE_LABELS) as Phase[]).map((p) => (
                  <span
                    key={p}
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      phase === p ? 'text-white' : 'bg-gray-100 text-gray-500'
                    }`}
                    style={phase === p ? { backgroundColor: PHASE_COLORS[p] } : undefined}
                  >
                    {PHASE_LABELS[p]}
                  </span>
                ))}
              </div>

              <p className="text-sm text-gray-500">
                Sigue el ritmo del círculo para una respiración profunda y relajante.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xs text-gray-500">Puntos</p>
            <p className="text-xl font-bold text-emerald-600">{score}</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xs text-gray-500">Ciclos</p>
            <p className="text-xl font-bold text-emerald-600">{cycle}</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-xs text-gray-500">Técnica</p>
            <p className="text-xl font-bold text-emerald-600">4-7-8</p>
          </div>
        </div>
      </div>
    </div>
  );
}
