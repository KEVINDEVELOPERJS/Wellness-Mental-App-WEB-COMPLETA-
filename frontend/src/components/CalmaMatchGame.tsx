import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Trophy, Flame, Clock } from 'lucide-react';
import { animations, getComboAnimation, getComboColor, getComboWord, getMotivationalPhrase } from '../utils/animations';

interface CalmaMatchGameProps {
  onBack: () => void;
  onGameComplete: (score: number, combo: number, gameType?: string, duration?: number) => void;
}

export default function CalmaMatchGame({ onBack, onGameComplete }: CalmaMatchGameProps) {
  const COLS = 8;
  const ROWS = 8;
  const TYPES = 5;
  const DURATION = 90; // seconds

  const emojis = ['💜', '💚', '💙', '⭐', '🌸'];
  const colors = ['#9C27B0', '#4CAF50', '#2196F3', '#FFC107', '#E91E63'];

  const [grid, setGrid] = useState<number[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DURATION);
  const [gameStarted, setGameStarted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [motivationalPhrase, setMotivationalPhrase] = useState(getMotivationalPhrase(0));
  const [sessionDuration, setSessionDuration] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Initialize grid on mount
  useEffect(() => {
    isMountedRef.current = true;
    
    const initializeGrid = () => {
      const newGrid: number[][] = [];
      for (let row = 0; row < ROWS; row++) {
        newGrid[row] = [];
        for (let col = 0; col < COLS; col++) {
          newGrid[row][col] = Math.floor(Math.random() * TYPES);
        }
      }
      if (isMountedRef.current) {
        setGrid(newGrid);
      }
    };
    
    initializeGrid();
    
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
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
    setMotivationalPhrase(getMotivationalPhrase(0));
    
    // Save game start to localStorage
    const gameSession = {
      type: 'calma-match',
      startTime: new Date().toISOString(),
      initialScore: 0,
      initialCombo: 0
    };
    localStorage.setItem('currentGameSession', JSON.stringify(gameSession));
    
    // Reset combo color
    setTimeout(() => {
      const comboElement = document.getElementById('combo-display');
      if (comboElement) {
        comboElement.style.color = '#f97316'; // orange-500
      }
    }, 100);
    
    // Reinitialize grid
    const newGrid: number[][] = [];
    for (let row = 0; row < ROWS; row++) {
      newGrid[row] = [];
      for (let col = 0; col < COLS; col++) {
        newGrid[row][col] = Math.floor(Math.random() * TYPES);
      }
    }
    setGrid(newGrid);

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const newTime = prev - 1;
        setSessionDuration(DURATION - newTime); // Track session duration
        if (newTime <= 0) {
          endGame();
          return 0;
        }
        return newTime;
      });
    }, 1000);
  };

  const endGame = () => {
    if (!isMountedRef.current) return;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setGameComplete(true);
    
    // Calculate duration
    const duration = DURATION - timeLeft;
    
    // Save final game session to localStorage
    const gameSession = {
      type: 'calma-match',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      finalScore: score,
      finalCombo: maxCombo,
      duration: duration,
      completed: true
    };
    localStorage.setItem('calmaMatchLastSession', JSON.stringify(gameSession));
    
    // Clear current game session
    localStorage.removeItem('currentGameSession');
    
    // Only call onGameComplete if it's a valid function
    if (typeof onGameComplete === 'function') {
      try {
        onGameComplete(score, maxCombo, 'calma-match', duration);
      } catch (error) {
        console.error('Error in onGameComplete:', error);
      }
    }
  };

  const handleCellClick = (row: number, col: number) => {
    if (!gameStarted || isProcessing || gameComplete || !isMountedRef.current) return;

    if (!selectedCell) {
      setSelectedCell({ row, col });
    } else {
      const isAdjacent = 
        (Math.abs(selectedCell.row - row) === 1 && selectedCell.col === col) ||
        (Math.abs(selectedCell.col - col) === 1 && selectedCell.row === row);

      if (isAdjacent) {
        swapCells(selectedCell.row, selectedCell.col, row, col);
      } else {
        setSelectedCell({ row, col });
      }
    }
  };

  const swapCells = async (row1: number, col1: number, row2: number, col2: number) => {
    if (!isMountedRef.current || isProcessing || gameComplete) return;
    
    setIsProcessing(true);
    setSelectedCell(null);

    // Deep copy the grid
    const newGrid = grid.map(row => [...row]);
    const temp = newGrid[row1][col1];
    newGrid[row1][col1] = newGrid[row2][col2];
    newGrid[row2][col2] = temp;
    setGrid(newGrid);

    // Check for matches
    const matches = findMatches(newGrid);
    
    if (matches.length > 0) {
      await processMatches(newGrid, matches);
    } else {
      // Swap back if no match
      setTimeout(() => {
        if (!isMountedRef.current) return;
        
        const revertGrid = newGrid.map(row => [...row]);
        const temp = revertGrid[row1][col1];
        revertGrid[row1][col1] = revertGrid[row2][col2];
        revertGrid[row2][col2] = temp;
        setGrid(revertGrid);
        setIsProcessing(false);
      }, 300);
    }
  };

  const findMatches = (currentGrid: number[][]) => {
    const matches: {row: number, col: number}[] = [];

    // Check horizontal matches
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS - 2; col++) {
        const type = currentGrid[row][col];
        if (type === currentGrid[row][col + 1] && type === currentGrid[row][col + 2]) {
          matches.push({row, col});
          matches.push({row, col: col + 1});
          matches.push({row, col: col + 2});
        }
      }
    }

    // Check vertical matches
    for (let col = 0; col < COLS; col++) {
      for (let row = 0; row < ROWS - 2; row++) {
        const type = currentGrid[row][col];
        if (type === currentGrid[row + 1][col] && type === currentGrid[row + 2][col]) {
          matches.push({row, col});
          matches.push({row: row + 1, col});
          matches.push({row: row + 2, col});
        }
      }
    }

    return matches;
  };

  const processMatches = async (currentGrid: number[][], matches: {row: number, col: number}[]) => {
    if (!isMountedRef.current) return;

    // Remove duplicates
    const uniqueMatches = Array.from(new Set(matches.map(m => `${m.row},${m.col}`)))
      .map(str => {
        const [row, col] = str.split(',').map(Number);
        return {row, col};
      });

    // Calculate score
    const points = uniqueMatches.length * 10 * (combo + 1);
    setScore(prev => prev + points);
    
    const newCombo = combo + 1;
    setCombo(newCombo);
    setMaxCombo(current => Math.max(current, newCombo));
    
    // Update motivational phrase based on new combo
    setMotivationalPhrase(getMotivationalPhrase(newCombo));
    
    // Apply combo animation to combo display
    const comboElement = document.getElementById('combo-display');
    if (comboElement) {
      const animationType = getComboAnimation(newCombo);
      animations[animationType](comboElement);
      comboElement.style.color = getComboColor(newCombo);
    }

    // Apply destruction animations to matched cells
    uniqueMatches.forEach(({row, col}) => {
      const cellElement = document.getElementById(`cell-${row}-${col}`);
      if (cellElement) {
        // Use explosion animation for better visual effect
        animations.explode(cellElement);
      }
    });

    // Show points popup at center of matches
    if (uniqueMatches.length > 0) {
      const centerMatch = uniqueMatches[Math.floor(uniqueMatches.length / 2)];
      const cellElement = document.getElementById(`cell-${centerMatch.row}-${centerMatch.col}`);
      
      if (cellElement) {
        const rect = cellElement.getBoundingClientRect();
        
        // Create popup element showing points gained
        const popup = document.createElement('div');
        popup.textContent = `+${points}`;
        popup.className = 'font-bold text-white drop-shadow-lg text-center';
        popup.style.fontSize = `${Math.min(24 + newCombo * 2, 48)}px`;
        popup.style.color = getComboColor(newCombo);
        popup.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        document.body.appendChild(popup);
        
        // Apply popup animation
        animations.comboPopup(popup, rect.left + rect.width / 2, rect.top + rect.height / 2);
        
        // Remove popup after animation
        setTimeout(() => {
          if (document.body.contains(popup)) {
            document.body.removeChild(popup);
          }
        }, 800);
      }
    }

    // Wait for destruction animation
    await new Promise(resolve => setTimeout(resolve, 400));

    if (!isMountedRef.current) return;

    // Remove matched cells
    const newGrid = currentGrid.map(row => [...row]);
    uniqueMatches.forEach(({row, col}) => {
      newGrid[row][col] = -1; // Mark as empty
    });
    setGrid(newGrid);

    // Wait for empty state
    await new Promise(resolve => setTimeout(resolve, 200));

    if (!isMountedRef.current) return;

    // Drop cells
    dropCells(newGrid);

    // Fill empty cells
    fillEmptyCells(newGrid);
    setGrid(newGrid);

    // Check for new matches
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (!isMountedRef.current) return;
    
    const newMatches = findMatches(newGrid);
    
    if (newMatches.length > 0) {
      await processMatches(newGrid, newMatches);
    } else {
      setCombo(0);
      setMotivationalPhrase(getMotivationalPhrase(0));
      setIsProcessing(false);
      
      // Reset combo color
      const comboElement = document.getElementById('combo-display');
      if (comboElement) {
        comboElement.style.color = '#f97316'; // orange-500
      }
    }
  };

  const dropCells = (currentGrid: number[][]) => {
    for (let col = 0; col < COLS; col++) {
      let emptyRow = ROWS - 1;
      for (let row = ROWS - 1; row >= 0; row--) {
        if (currentGrid[row][col] !== -1) {
          if (row !== emptyRow) {
            currentGrid[emptyRow][col] = currentGrid[row][col];
            currentGrid[row][col] = -1;
          }
          emptyRow--;
        }
      }
    }
  };

  const fillEmptyCells = (currentGrid: number[][]) => {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (currentGrid[row][col] === -1) {
          currentGrid[row][col] = Math.floor(Math.random() * TYPES);
        }
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
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-6">¡Juego Completado!</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Puntos</span>
                <span className="font-bold text-xl">{score}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Combo Máximo</span>
                <span className="font-bold text-xl">{maxCombo}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-100 rounded-lg">
                <span className="text-purple-600">Puntos Ganados</span>
                <span className="font-bold text-xl text-purple-700">+{Math.floor(score / 10)}</span>
              </div>
            </div>

            <div className="text-gray-600 mb-6">¡Excelente trabajo! Has completado el juego Calma Match.</div>

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
        <h1 className="text-2xl font-bold">Calma Match</h1>
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
        <div className="text-gray-600">Intercambia gemas adyacentes para crear grupos de 3 o más. ¡Relájate y diviértete!</div>
        <div className="mt-2 text-sm md:text-base font-semibold text-purple-600 animate-pulse">
          {motivationalPhrase}
        </div>
      </div>

      <div className="flex justify-center mb-6">
        <div 
          className="grid gap-1"
          style={{ 
            gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            maxWidth: '400px',
            width: '100%'
          }}
        >
          {grid.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <div
                id={`cell-${rowIndex}-${colIndex}`}
                key={`${rowIndex}-${colIndex}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                className={`
                  w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center text-2xl cursor-pointer transition-all
                  ${selectedCell?.row === rowIndex && selectedCell?.col === colIndex ? 'ring-4 ring-purple-500 scale-110' : ''}
                  ${cell === -1 ? 'opacity-0' : 'hover:scale-105'}
                `}
                style={{ 
                  backgroundColor: cell !== -1 ? colors[cell] : 'transparent',
                  boxShadow: cell !== -1 ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                }}
              >
                {cell !== -1 && emojis[cell]}
              </div>
            ))
          )}
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
              setTimeLeft(DURATION);
              setScore(0);
              setCombo(0);
              setMaxCombo(0);
              setMotivationalPhrase(getMotivationalPhrase(0));
              
              // Reset combo color
              const comboElement = document.getElementById('combo-display');
              if (comboElement) {
                comboElement.style.color = '#f97316'; // orange-500
              }
              
              // Reinitialize grid
              const newGrid: number[][] = [];
              for (let row = 0; row < ROWS; row++) {
                newGrid[row] = [];
                for (let col = 0; col < COLS; col++) {
                  newGrid[row][col] = Math.floor(Math.random() * TYPES);
                }
              }
              setGrid(newGrid);
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