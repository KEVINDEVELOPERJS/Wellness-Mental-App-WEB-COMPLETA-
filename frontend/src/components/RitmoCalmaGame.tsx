import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Flame, Clock } from 'lucide-react';
import { animations, getComboAnimation, getComboColor } from '../utils/animations';

interface RitmoCalmaGameProps {
  onBack: () => void;
  onGameComplete: (score: number, combo: number, gameType?: string, duration?: number) => void;
}

export default function RitmoCalmaGame({ onBack, onGameComplete }: RitmoCalmaGameProps) {
  const DURATION = 60; // seconds
  const CANVAS_SIZE = 300;
  
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [gameComplete, setGameComplete] = useState(false);
  const [feedback, setFeedback] = useState({ text: '', alpha: 0 });
  
  // Session tracking for progress saving
  const [sessionDuration, setSessionDuration] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const indicatorAngleRef = useRef(0);
  const speedRef = useRef(2.8);
  const tapZoneRef = useRef(0); // 0-100 position
  const lastTapTimeRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Initialize canvas when component mounts
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Initial render
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        const centerX = CANVAS_SIZE / 2;
        const centerY = CANVAS_SIZE / 2;
        const radius = CANVAS_SIZE * 0.32;
        
        // Draw initial circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Draw initial indicator
        const indicatorX = centerX + Math.cos(indicatorAngleRef.current) * radius;
        const indicatorY = centerY + Math.sin(indicatorAngleRef.current) * radius;
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, 12, 0, 2 * Math.PI);
        ctx.fillStyle = '#6366f1';
        ctx.fill();
      }
    }
    
    return () => {
      isMountedRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startGame = () => {
    if (!isMountedRef.current) return;
    
    setGameStarted(true);
    setTimeLeft(DURATION);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setSessionDuration(0);
    indicatorAngleRef.current = 0;
    speedRef.current = 2.8;
    
    // Set random tap zone
    tapZoneRef.current = Math.random() * 100;
    
    // Save game start to localStorage
    const gameSession = {
      type: 'ritmo-calma',
      startTime: new Date().toISOString(),
      initialScore: 0,
      initialCombo: 0
    };
    localStorage.setItem('currentGameSession', JSON.stringify(gameSession));
    
    // Start timer
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const newTime = prev - 1;
        setSessionDuration(DURATION - newTime); // Track session duration
        if (newTime <= 0) {
          endGame();
          return 0;
        }
        return newTime;
      });
    }, 1000);
    
    // Start animation loop
    animate();
  };

  const endGame = () => {
    if (!isMountedRef.current) return;
    
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    
    setGameComplete(true);
    
    // Calculate duration
    const duration = DURATION - timeLeft;
    
    // Save final game session to localStorage
    const gameSession = {
      type: 'ritmo-calma',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      finalScore: score,
      finalCombo: maxCombo,
      duration: duration,
      completed: true
    };
    localStorage.setItem('ritmoCalmaLastSession', JSON.stringify(gameSession));
    
    // Clear current game session
    localStorage.removeItem('currentGameSession');
    
    if (typeof onGameComplete === 'function') {
      try {
        onGameComplete(score, maxCombo, 'ritmo', duration);
      } catch (error) {
        console.error('Error in onGameComplete:', error);
      }
    }
  };

  const animate = () => {
    if (!isMountedRef.current || !gameStarted) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas with proper dimensions
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    
    const centerX = CANVAS_SIZE / 2;
    const centerY = CANVAS_SIZE / 2;
    const radius = CANVAS_SIZE * 0.32;
    
    // Draw tap zone
    const zoneAngle = (tapZoneRef.current / 100) * 2 * Math.PI - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, zoneAngle - 0.3, zoneAngle + 0.3);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 16;
    ctx.stroke();
    
    // Draw main circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 4;
    ctx.stroke();
    
    // Draw indicator
    const indicatorX = centerX + Math.cos(indicatorAngleRef.current) * radius;
    const indicatorY = centerY + Math.sin(indicatorAngleRef.current) * radius;
    
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#6366f1';
    ctx.fill();
    
    // Update indicator angle
    indicatorAngleRef.current += (speedRef.current * Math.PI) / 180;
    if (indicatorAngleRef.current > 2 * Math.PI) {
      indicatorAngleRef.current -= 2 * Math.PI;
    }
    
    // Draw feedback
    if (feedback.alpha > 0) {
      ctx.globalAlpha = feedback.alpha;
      ctx.font = 'bold 24px sans-serif';
      ctx.fillStyle = feedback.text === '¡Perfecto!' ? '#10b981' : feedback.text === '¡Bien!' ? '#3b82f6' : '#ef4444';
      ctx.textAlign = 'center';
      ctx.fillText(feedback.text, centerX, centerY + 8);
      ctx.globalAlpha = 1;
      setFeedback(prev => ({ ...prev, alpha: Math.max(0, prev.alpha - 0.02) }));
    }
    
    animationRef.current = requestAnimationFrame(animate);
  };

  const handleTap = () => {
    if (!gameStarted || gameComplete || !isMountedRef.current) return;
    
    const currentAngle = (indicatorAngleRef.current + Math.PI / 2) / (2 * Math.PI) * 100;
    const distance = Math.abs(currentAngle - tapZoneRef.current);
    const wrappedDistance = Math.min(distance, 100 - distance);
    
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTimeRef.current;
    lastTapTimeRef.current = now;
    
    if (wrappedDistance < 15) {
      // Perfect tap
      const points = 10 * (combo + 1);
      setScore(prev => prev + points);
      setCombo(prev => {
        const newCombo = prev + 1;
        setMaxCombo(current => Math.max(current, newCombo));
        return newCombo;
      });
      
      setFeedback({ text: '¡Perfecto!', alpha: 1 });
      
      // Increase speed
      speedRef.current = Math.min(speedRef.current + 0.1, 5);
      
      // Set new tap zone
      tapZoneRef.current = Math.random() * 100;
      
      // Apply combo animation
      const comboElement = document.getElementById('combo-display');
      if (comboElement) {
        const animationType = getComboAnimation(combo + 1);
        animations[animationType](comboElement);
        comboElement.style.color = getComboColor(combo + 1);
      }
    } else if (wrappedDistance < 30) {
      // Good tap
      const points = 5;
      setScore(prev => prev + points);
      setFeedback({ text: '¡Bien!', alpha: 1 });
    } else {
      // Miss
      setCombo(0);
      setFeedback({ text: '¡Fallaste!', alpha: 1 });
      
      const comboElement = document.getElementById('combo-display');
      if (comboElement) {
        comboElement.style.color = '#6b7280';
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
            <div className="text-6xl mb-4">🎵</div>
            <h2 className="text-2xl font-bold mb-6">¡Ritmo Calma Completado!</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Puntos</span>
                <span className="font-bold text-xl">{score}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Combo Máximo</span>
                <span className="font-bold text-xl">{maxCombo}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-100 rounded-lg">
                <span className="text-blue-600">Puntos Ganados</span>
                <span className="font-bold text-xl text-blue-700">+{Math.floor(score / 10)}</span>
              </div>
            </div>

            <div className="text-gray-600 mb-6">¡Excelente trabajo! Has completado el juego Ritmo Calma.</div>

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
                  startGame();
                }}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Jugar de Nuevo
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Volver</span>
        </button>
        <h1 className="text-2xl font-bold">Ritmo Calma</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-yellow-600">
            <Trophy className="h-5 w-5" />
            <span className="font-bold">{score}</span>
          </div>
          <div className="flex items-center gap-1 text-orange-600">
            <Flame className="h-5 w-5" />
            <span id="combo-display" className="font-bold">{combo}</span>
          </div>
          <div className="flex items-center gap-1 text-blue-600">
            <Clock className="h-5 w-5" />
            <span className="font-bold">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      <div className="mb-6 text-center">
        <div className="text-gray-600">Toca cuando el indicador esté en la zona verde. ¡Mantén el ritmo!</div>
      </div>

      <div className="flex justify-center mb-6">
        <div className="relative" style={{ width: `${CANVAS_SIZE}px`, height: `${CANVAS_SIZE}px` }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            onClick={handleTap}
            className="cursor-pointer w-full h-full"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>

      <div className="flex justify-center gap-4">
        {!gameStarted ? (
          <button
            onClick={startGame}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <span>▶️</span>
            <span>Iniciar Juego</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (animationRef.current) cancelAnimationFrame(animationRef.current);
              if (timerRef.current) clearInterval(timerRef.current);
              setGameStarted(false);
              setTimeLeft(DURATION);
              setScore(0);
              setCombo(0);
              setMaxCombo(0);
            }}
            className="px-8 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <span>🔄</span>
            <span>Reiniciar</span>
          </button>
        )}
      </div>
    </div>
  );
}