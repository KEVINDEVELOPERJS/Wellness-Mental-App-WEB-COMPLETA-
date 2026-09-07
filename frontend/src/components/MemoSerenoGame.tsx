import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Timer, Brain } from 'lucide-react';
import { animations } from '../utils/animations';

interface MemoSerenoGameProps {
  onBack: () => void;
  onGameComplete: (score: number, combo: number, gameType?: string, duration?: number) => void;
}

interface Card {
  id: number;
  pairId: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CARD_CONTENT = [
  { emoji: '🕊️', label: 'Paz' },
  { emoji: '🌿', label: 'Calma' },
  { emoji: '💧', label: 'Serenidad' },
  { emoji: '🌸', label: 'Armonía' },
  { emoji: '🌞', label: 'Luz' },
  { emoji: '🍃', label: 'Tranquilidad' },
];

const NUM_PAIRS = 6; // 12 cards in 4x3 grid

export default function MemoSerenoGame({ onBack, onGameComplete }: MemoSerenoGameProps) {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIndexes, setFlippedIndexes] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const matchedPairsRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const initializeCards = (): Card[] => {
    const deck: Card[] = [];
    for (let i = 0; i < NUM_PAIRS; i++) {
      deck.push({ id: i * 2, pairId: i, emoji: CARD_CONTENT[i].emoji, isFlipped: false, isMatched: false });
      deck.push({ id: i * 2 + 1, pairId: i, emoji: CARD_CONTENT[i].emoji, isFlipped: false, isMatched: false });
    }
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]!] as [Card, Card];
    }
    return deck;
  };

  const startGame = () => {
    if (!isMountedRef.current) return;

    setGameStarted(true);
    setGameComplete(false);
    setCards(initializeCards());
    setFlippedIndexes([]);
    setMatchedPairs(0);
    matchedPairsRef.current = 0;
    setMoves(0);
    setTimeElapsed(0);
    setFinalScore(0);
    setIsLocked(false);

    const gameSession = {
      type: 'memo-sereno',
      startTime: new Date().toISOString(),
      initialScore: 0,
      initialCombo: 0,
    };
    localStorage.setItem('currentGameSession', JSON.stringify(gameSession));

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
  };

  const handleCardClick = (index: number) => {
    if (!gameStarted || gameComplete || isLocked) return;

    const card = cards[index];
    if (!card || card.isFlipped || card.isMatched) return;

    // Can't flip more than 2
    if (flippedIndexes.length >= 2) return;

    const newCards = cards.map((c, i) => (i === index ? { ...c, isFlipped: true } : c));
    setCards(newCards);

    const newFlipped = [...flippedIndexes, index];
    setFlippedIndexes(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      checkMatch(newFlipped, newCards);
    }
  };

  const checkMatch = (indexes: number[], currentCards: Card[]) => {
    setIsLocked(true);

    const first = currentCards[indexes[0]!];
    const second = currentCards[indexes[1]!];

    if (first && second && first.pairId === second.pairId) {
      // Match!
      setTimeout(() => {
        if (!isMountedRef.current) return;
        const matched = currentCards.map((c, i) =>
          indexes.includes(i) ? { ...c, isMatched: true, isFlipped: true } : c
        );
        setCards(matched);
        matchedPairsRef.current += 1;
        setMatchedPairs(matchedPairsRef.current);

        // Animate matched cards
        indexes.forEach((idx) => {
          const el = document.getElementById(`memo-card-${idx}`);
          if (el) animations.pulse(el);
        });

        setFlippedIndexes([]);
        setIsLocked(false);

        if (matchedPairsRef.current >= NUM_PAIRS) {
          endGame();
        }
      }, 400);
    } else {
      // No match - flip back
      setTimeout(() => {
        if (!isMountedRef.current) return;
        const unflipped = currentCards.map((c, i) =>
          indexes.includes(i) ? { ...c, isFlipped: false } : c
        );
        setCards(unflipped);
        setFlippedIndexes([]);
        setIsLocked(false);
      }, 900);
    }
  };

  const endGame = () => {
    if (!isMountedRef.current) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const duration = timeElapsed;
    // Score: perfect = 1000, minus moves penalty and time
    const idealMoves = NUM_PAIRS + Math.floor(NUM_PAIRS / 2);
    const score = Math.max(100, 1000 - Math.max(0, moves - idealMoves) * 20 - Math.floor(duration / 2));
    setFinalScore(score);
    setGameComplete(true);

    const gameSession = {
      type: 'memo-sereno',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      finalScore: score,
      finalCombo: 0,
      duration,
      completed: true,
    };
    localStorage.setItem('memoSerenoLastSession', JSON.stringify(gameSession));
    localStorage.removeItem('currentGameSession');

    if (typeof onGameComplete === 'function') {
      try {
        onGameComplete(score, 0, 'memo', duration);
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
            <div className="text-6xl mb-4">🧠</div>
            <h2 className="text-2xl font-bold mb-6">¡MemoSereno Completado!</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Pares Encontrados</span>
                <span className="font-bold text-xl">{matchedPairs}/{NUM_PAIRS}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-100 rounded-lg">
                <span className="text-gray-600">Movimientos</span>
                <span className="font-bold text-xl">{moves}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-100 rounded-lg">
                <span className="text-purple-600">Puntos Ganados</span>
                <span className="font-bold text-xl text-purple-700">+{Math.floor(finalScore / 10)}</span>
              </div>
            </div>

            <div className="text-gray-600 mb-6">
              ¡Ejercitaste tu memoria y atención de forma relajante!
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
                className="flex-1 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-violet-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Volver</span>
          </button>
          <h1 className="text-2xl font-bold text-purple-700">MemoSereno</h1>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-lg">
          {!gameStarted ? (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🧠</div>
              <h2 className="text-xl font-semibold mb-2">Empareja con calma</h2>
              <p className="text-gray-600 mb-2">
                Encuentra los pares de emociones y palabras de serenidad.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Sin presión de tiempo. Ejercita tu memoria mientras te relajas.
              </p>
              <button
                onClick={startGame}
                className="w-full py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors"
              >
                Comenzar
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-500" />
                  <span className="font-semibold text-purple-700">
                    Pares: {matchedPairs}/{NUM_PAIRS}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Timer className="h-5 w-5 text-blue-500" />
                  <span>{formatTime(timeElapsed)}</span>
                </div>
                <div className="text-gray-600 font-medium">Movs: {moves}</div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {cards.map((card, index) => (
                  <button
                    key={card.id}
                    id={`memo-card-${index}`}
                    onClick={() => handleCardClick(index)}
                    disabled={card.isMatched || isLocked}
                    className={`aspect-square rounded-lg flex items-center justify-center text-2xl md:text-3xl transition-all duration-300 ${
                      card.isMatched
                        ? 'bg-green-100 border-2 border-green-300 opacity-80'
                        : card.isFlipped
                          ? 'bg-purple-100 border-2 border-purple-300'
                          : 'bg-gradient-to-br from-purple-400 to-violet-500 border-2 border-purple-400 hover:scale-105'
                    }`}
                  >
                    {card.isFlipped || card.isMatched ? card.emoji : '❓'}
                  </button>
                ))}
              </div>

              <div className="mt-3 text-center">
                {matchedPairs < NUM_PAIRS ? (
                  <p className="text-xs text-gray-400">
                    {CARD_CONTENT.map((c) => c.label).join(' · ')}
                  </p>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
