import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Clock } from 'lucide-react';

interface FlujoZenGameProps {
  onBack: () => void;
  onGameComplete: (score: number, combo: number, gameType?: string, duration?: number) => void;
}

interface Obstacle {
  x: number;
  gapY: number;
  gapSize: number;
  passed: boolean;
}

const WIDTH = 320;
const HEIGHT = 480;
const BIRD_RADIUS = 14;
const GRAVITY = 0.35;
const JUMP_FORCE = -6.2;
const OBSTACLE_SPEED = 2.2;
const OBSTACLE_SPACING = 190;
const GAP_SIZE = 150;
const DURATION = 60; // seconds for zen mode

export default function FlujoZenGame({ onBack, onGameComplete }: FlujoZenGameProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [score, setScore] = useState(0); // obstacles passed
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  const birdYRef = useRef(HEIGHT / 2);
  const birdVelocityRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const scoreRef = useRef(0);
  const timeRef = useRef(0);
  const gameOverRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        drawInitial(ctx);
      }
    }

    return () => {
      isMountedRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const drawInitial = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    drawBackground(ctx);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.textAlign = 'center';
    ctx.fillText('Toca para volar en calma', WIDTH / 2, HEIGHT / 2 - 40);
    drawBird(ctx, HEIGHT / 2);
  };

  const drawBackground = (ctx: CanvasRenderingContext2D) => {
    // Calm gradient sky
    const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    gradient.addColorStop(0, '#e0f2fe');
    gradient.addColorStop(0.5, '#c7d2fe');
    gradient.addColorStop(1, '#e0e7ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Soft clouds
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(60, 80, 20, 0, 2 * Math.PI);
    ctx.arc(90, 70, 26, 0, 2 * Math.PI);
    ctx.arc(120, 80, 18, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.beginPath();
    ctx.arc(230, 150, 18, 0, 2 * Math.PI);
    ctx.arc(255, 140, 22, 0, 2 * Math.PI);
    ctx.arc(280, 150, 16, 0, 2 * Math.PI);
    ctx.fill();
  };

  const drawBird = (ctx: CanvasRenderingContext2D, y: number) => {
    // Zen bird (soft blue circle with wings)
    ctx.save();
    ctx.translate(WIDTH / 3, y);
    ctx.rotate(Math.min(Math.max(birdVelocityRef.current * 0.05, -0.4), 0.4));

    ctx.beginPath();
    ctx.arc(0, 0, BIRD_RADIUS, 0, 2 * Math.PI);
    ctx.fillStyle = '#6366f1';
    ctx.fill();
    ctx.strokeStyle = '#4338ca';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eye
    ctx.beginPath();
    ctx.arc(5, -4, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6, -4, 1.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    // Wing
    ctx.beginPath();
    ctx.ellipse(-4, 4, 8, 5, 0.3, 0, 2 * Math.PI);
    ctx.fillStyle = '#818cf8';
    ctx.fill();

    ctx.restore();
  };

  const drawObstacles = (ctx: CanvasRenderingContext2D) => {
    for (const obs of obstaclesRef.current) {
      // Top obstacle
      ctx.fillStyle = '#34d399';
      ctx.fillRect(obs.x, 0, 40, obs.gapY - obs.gapSize / 2);
      // Bottom obstacle
      ctx.fillStyle = '#10b981';
      ctx.fillRect(obs.x, obs.gapY + obs.gapSize / 2, 40, HEIGHT - (obs.gapY + obs.gapSize / 2));
      // Caps
      ctx.fillStyle = '#059669';
      ctx.fillRect(obs.x - 3, obs.gapY - obs.gapSize / 2 - 10, 46, 10);
      ctx.fillRect(obs.x - 3, obs.gapY + obs.gapSize / 2, 46, 10);
    }
  };

  const resetGame = () => {
    birdYRef.current = HEIGHT / 2;
    birdVelocityRef.current = 0;
    obstaclesRef.current = [];
    scoreRef.current = 0;
    timeRef.current = 0;
    gameOverRef.current = false;
    setScore(0);
    setGameOver(false);
    setSessionDuration(0);
  };

  const startGame = () => {
    if (!isMountedRef.current) return;

    resetGame();
    setGameStarted(true);
    setGameComplete(false);
    setTimeLeft(DURATION);

    const gameSession = {
      type: 'flujo-zen',
      startTime: new Date().toISOString(),
      initialScore: 0,
      initialCombo: 0,
    };
    localStorage.setItem('currentGameSession', JSON.stringify(gameSession));

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      timeRef.current += 1;
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        setSessionDuration(DURATION - newTime);
        if (newTime <= 0) {
          // Time's up - zen success
          endGame(false);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(gameLoop);
  };

  const handleJump = () => {
    if (!gameStarted || gameComplete || !isMountedRef.current) return;
    if (gameOverRef.current) return;
    birdVelocityRef.current = JUMP_FORCE;
  };

  const gameLoop = (_now: number) => {
    if (!isMountedRef.current || !gameStarted || gameComplete) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Physics
    birdVelocityRef.current += GRAVITY;
    birdYRef.current += birdVelocityRef.current;

    // Move obstacles
    obstaclesRef.current = obstaclesRef.current
      .map((obs) => ({ ...obs, x: obs.x - OBSTACLE_SPEED }))
      .filter((obs) => obs.x > -50);

    // Spawn obstacles
    const lastObs = obstaclesRef.current[obstaclesRef.current.length - 1];
    if (!lastObs || lastObs.x <= WIDTH - OBSTACLE_SPACING) {
      const gapY = 90 + Math.random() * (HEIGHT - 90 - GAP_SIZE - 90);
      obstaclesRef.current.push({
        x: WIDTH,
        gapY,
        gapSize: GAP_SIZE,
        passed: false,
      });
    }

    // Check scoring (passing obstacle)
    for (const obs of obstaclesRef.current) {
      if (!obs.passed && obs.x + 40 < WIDTH / 3 - BIRD_RADIUS) {
        obs.passed = true;
        scoreRef.current += 1;
        setScore(scoreRef.current);
      }
    }

    // Collision detection
    const birdX = WIDTH / 3;
    for (const obs of obstaclesRef.current) {
      if (
        birdX + BIRD_RADIUS > obs.x &&
        birdX - BIRD_RADIUS < obs.x + 40 &&
        (birdYRef.current - BIRD_RADIUS < obs.gapY - obs.gapSize / 2 ||
          birdYRef.current + BIRD_RADIUS > obs.gapY + obs.gapSize / 2)
      ) {
        endGame(true);
        return;
      }
    }

    // Ceiling / floor
    if (birdYRef.current < BIRD_RADIUS) {
      birdYRef.current = BIRD_RADIUS;
      birdVelocityRef.current = 0;
    }
    if (birdYRef.current > HEIGHT - BIRD_RADIUS) {
      endGame(true);
      return;
    }

    // Draw
    drawBackground(ctx);
    drawObstacles(ctx);
    drawBird(ctx, birdYRef.current);

    animationRef.current = requestAnimationFrame(gameLoop);
  };

  const endGame = (crashed: boolean) => {
    if (!isMountedRef.current) return;

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    gameOverRef.current = true;
    setGameOver(crashed);
    const finalScore = scoreRef.current;
    const duration = DURATION - timeLeft;
    setSessionDuration(duration);
    setGameComplete(true);

    const gameSession = {
      type: 'flujo-zen',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      finalScore,
      finalCombo: 0,
      duration,
      completed: true,
    };
    localStorage.setItem('flujoZenLastSession', JSON.stringify(gameSession));
    localStorage.removeItem('currentGameSession');

    if (typeof onGameComplete === 'function') {
      try {
        // Score = obstacles * 10 (combo-style points)
        onGameComplete(finalScore * 10, 0, 'flujo', duration);
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
            <div className="text-6xl mb-4">🕊️</div>
            <h2 className="text-2xl font-bold mb-6">
              {gameOver ? '¡Flujo Zen Terminado!' : '¡Flujo Zen Completado!'}
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Obstáculos Superados</span>
                <span className="font-bold text-xl">{score}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Tiempo</span>
                <span className="font-bold text-xl">{formatTime(sessionDuration)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-indigo-100 rounded-lg">
                <span className="text-indigo-600">Puntos Ganados</span>
                <span className="font-bold text-xl text-indigo-700">+{Math.floor(score)}</span>
              </div>
            </div>

            <div className="text-gray-600 mb-6">
              {gameOver
                ? 'Cada intento te acerca al equilibrio. ¡Respira y vuelve a intentarlo!'
                : '¡Lograste mantener el flujo zen! La concentración calma la mente.'}
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
                className="flex-1 py-3 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-600 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-sky-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Volver</span>
          </button>
          <h1 className="text-2xl font-bold text-indigo-700">Flujo Zen</h1>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-lg">
          {!gameStarted ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🕊️</div>
              <h2 className="text-xl font-semibold mb-2">Vuela con calma</h2>
              <p className="text-gray-600 mb-2">
                Toca para mantener al ave zen en el aire y esquivar los obstáculos.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Un solo botón. Entra en el flujo meditativo y relájate.
              </p>
              <button
                onClick={startGame}
                className="w-full py-3 bg-indigo-500 text-white rounded-lg font-semibold hover:bg-indigo-600 transition-colors"
              >
                Comenzar
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-indigo-500" />
                  <span className="font-bold text-indigo-600">{score} obstáculos</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">{formatTime(timeLeft)}</span>
                </div>
              </div>

              <canvas
                ref={canvasRef}
                width={WIDTH}
                height={HEIGHT}
                onClick={handleJump}
                className="rounded-xl cursor-pointer select-none block mx-auto"
                style={{ touchAction: 'manipulation' }}
              />

              <p className="text-center text-sm text-gray-500 mt-3">
                Haz clic o toca el área para volar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
