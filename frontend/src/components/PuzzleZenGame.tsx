import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Clock, Target } from 'lucide-react';
import { animations } from '../utils/animations';

interface PuzzleZenGameProps {
  onBack: () => void;
  onGameComplete: (score: number, combo: number, level?: number) => void;
}

interface PuzzlePiece {
  id: number;
  correctPosition: number;
  currentPosition: number;
  image: string;
}

// Simple puzzle images using emojis
const PUZZLE_IMAGES = [
  '🌸', '🌺', '🌻', '🌹', '💐', '🏵️', '🌷', '🌼'
];

export default function PuzzleZenGame({ onBack, onGameComplete }: PuzzleZenGameProps) {
  const GRID_SIZE = 3; // 3x3 puzzle
  const TOTAL_PIECES = GRID_SIZE * GRID_SIZE;
  
  const [gameStarted, setGameStarted] = useState(false);
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [level, setLevel] = useState(1);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [moves, setMoves] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Ordena las piezas para completar el puzzle');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const initializePuzzle = () => {
    const newPieces: PuzzlePiece[] = [];
    const shuffledPositions = Array.from({ length: TOTAL_PIECES }, (_, i) => i)
      .sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < TOTAL_PIECES; i++) {
      newPieces.push({
        id: i,
        correctPosition: i,
        currentPosition: shuffledPositions[i],
        image: PUZZLE_IMAGES[i % PUZZLE_IMAGES.length]
      });
    }
    
    setPieces(newPieces);
    setSelectedPiece(null);
    setMoves(0);
    setStatusMessage('Ordena las piezas para completar el puzzle');
  };

  const startGame = () => {
    if (!isMountedRef.current) return;
    
    setGameStarted(true);
    setTimeElapsed(0);
    setLevel(1);
    initializePuzzle();
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
  };

  const endGame = () => {
    if (!isMountedRef.current) return;
    
    if (timerRef.current) clearInterval(timerRef.current);
    setGameComplete(true);
    
    const score = Math.max(0, 1000 - moves * 10 - timeElapsed);
    
    if (typeof onGameComplete === 'function') {
      try {
        onGameComplete(score, 0, level);
      } catch (error) {
        console.error('Error in onGameComplete:', error);
      }
    }
  };

  const handlePieceClick = (pieceId: number) => {
    if (!gameStarted || gameComplete || !isMountedRef.current) return;

    if (selectedPiece === null) {
      setSelectedPiece(pieceId);
      setStatusMessage('Selecciona otra pieza para intercambiar');
    } else if (selectedPiece === pieceId) {
      setSelectedPiece(null);
      setStatusMessage('Ordena las piezas para completar el puzzle');
    } else {
      swapPieces(selectedPiece, pieceId);
    }
  };

  const swapPieces = (pieceId1: number, pieceId2: number) => {
    const newPieces = pieces.map(piece => {
      if (piece.id === pieceId1) {
        return { ...piece, currentPosition: pieces.find(p => p.id === pieceId2)!.currentPosition };
      }
      if (piece.id === pieceId2) {
        return { ...piece, currentPosition: pieces.find(p => p.id === pieceId1)!.currentPosition };
      }
      return piece;
    });

    setPieces(newPieces);
    setSelectedPiece(null);
    setMoves(prev => prev + 1);
    setStatusMessage('Ordena las piezas para completar el puzzle');

    // Check if puzzle is solved
    if (checkPuzzleSolved(newPieces)) {
      handlePuzzleSolved();
    }
  };

  const checkPuzzleSolved = (currentPieces: PuzzlePiece[]) => {
    return currentPieces.every(piece => piece.correctPosition === piece.currentPosition);
  };

  const handlePuzzleSolved = () => {
    setStatusMessage('¡Puzzle completado! 🎉');
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    setTimeout(() => {
      if (!isMountedRef.current) return;
      
      if (level < 5) {
        setLevel(prev => prev + 1);
        initializePuzzle();
        setStatusMessage(`¡Nivel ${level} completado! Iniciando nivel ${level + 1}...`);
        
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setTimeElapsed(prev => prev + 1);
        }, 1000);
      } else {
        endGame();
      }
    }, 2000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPieceAtPosition = (position: number) => {
    return pieces.find(piece => piece.currentPosition === position);
  };

  if (gameComplete) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-6xl mb-4">🧩</div>
            <h2 className="text-2xl font-bold mb-6">¡Puzzle Zen Completado!</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Nivel Alcanzado</span>
                <span className="font-bold text-xl">{level}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Movimientos</span>
                <span className="font-bold text-xl">{moves}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Tiempo</span>
                <span className="font-bold text-xl">{formatTime(timeElapsed)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-100 rounded-lg">
                <span className="text-purple-600">Puntos Ganados</span>
                <span className="font-bold text-xl text-purple-700">+{Math.max(0, 1000 - moves * 10 - timeElapsed)}</span>
              </div>
            </div>

            <div className="text-gray-600 mb-6">¡Excelente trabajo! Has completado el puzzle zen.</div>

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
                className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
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
        <h1 className="text-2xl font-bold">Puzzle Zen</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-purple-600">
            <Target className="h-5 w-5" />
            <span className="font-bold">Nivel {level}</span>
          </div>
          <div className="flex items-center gap-1 text-blue-600">
            <Clock className="h-5 w-5" />
            <span className="font-bold">{formatTime(timeElapsed)}</span>
          </div>
        </div>
      </div>

      <div className="mb-6 text-center">
        <div className="text-gray-600">{statusMessage}</div>
        <div className="text-sm text-gray-500 mt-1">Movimientos: {moves}</div>
      </div>

      {/* Puzzle Grid */}
      <div className="flex justify-center mb-6">
        <div 
          className="grid gap-2"
          style={{ 
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
            maxWidth: '300px',
            width: '100%'
          }}
        >
          {Array.from({ length: TOTAL_PIECES }).map((_, position) => {
            const piece = getPieceAtPosition(position);
            return (
              <div
                key={position}
                onClick={() => piece && handlePieceClick(piece.id)}
                className={`
                  aspect-square rounded-lg flex items-center justify-center text-4xl cursor-pointer transition-all
                  ${selectedPiece === piece?.id ? 'ring-4 ring-purple-500 scale-105' : ''}
                  ${piece ? 'bg-white shadow-md hover:shadow-lg' : 'bg-gray-100'}
                  ${piece && piece.correctPosition === piece.currentPosition ? 'bg-green-50' : ''}
                `}
              >
                {piece ? piece.image : ''}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reference Solution */}
      <div className="mb-6 text-center">
        <div className="text-sm text-gray-600 mb-2">Solución de referencia:</div>
        <div 
          className="grid gap-1 inline-block"
          style={{ 
            gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
          }}
        >
          {Array.from({ length: TOTAL_PIECES }).map((_, index) => (
            <div
              key={index}
              className="w-8 h-8 flex items-center justify-center text-xl bg-gray-50 rounded"
            >
              {PUZZLE_IMAGES[index % PUZZLE_IMAGES.length]}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-4">
        {!gameStarted ? (
          <button
            onClick={startGame}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <span>▶️</span>
            <span>Iniciar Juego</span>
          </button>
        ) : (
          <button
            onClick={() => {
              if (timerRef.current) clearInterval(timerRef.current);
              setGameStarted(false);
              setTimeElapsed(0);
              setLevel(1);
              setMoves(0);
              initializePuzzle();
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