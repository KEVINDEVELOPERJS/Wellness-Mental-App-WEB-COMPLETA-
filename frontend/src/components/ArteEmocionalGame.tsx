import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Palette, CheckCircle } from 'lucide-react';
import { animations } from '../utils/animations';

interface ArteEmocionalGameProps {
  onBack: () => void;
  onGameComplete: (score: number) => void;
}

interface Emocion {
  id: string;
  nombre: string;
  emoji: string;
  colores: string[];
}

interface Section {
  id: number;
  coloreado: boolean;
  colorUsado: string | null;
}

const EMOCIONES: Emocion[] = [
  {
    id: 'alegria',
    nombre: 'Alegría',
    emoji: '😊',
    colores: ['#FFD700', '#FFA500', '#FF6347', '#FF4500', '#FFFF00', '#FFE4B5']
  },
  {
    id: 'calma',
    nombre: 'Calma',
    emoji: '😌',
    colores: ['#87CEEB', '#4682B4', '#5F9EA0', '#B0E0E6', '#ADD8E6', '#E0FFFF']
  },
  {
    id: 'amor',
    nombre: 'Amor',
    emoji: '❤️',
    colores: ['#FF69B4', '#FF1493', '#DB7093', '#FFB6C1', '#FFC0CB', '#FFE4E1']
  },
  {
    id: 'energia',
    nombre: 'Energía',
    emoji: '⚡',
    colores: ['#FF4500', '#FF6347', '#FF7F50', '#FFA500', '#FFD700', '#FFFF00']
  },
  {
    id: 'serenidad',
    nombre: 'Serenidad',
    emoji: '🧘',
    colores: ['#98FB98', '#90EE90', '#00FA9A', '#3CB371', '#2E8B57', '#228B22']
  }
];

const SECTIONS_PER_ARTWORK = 6;

export default function ArteEmocionalGame({ onBack, onGameComplete }: ArteEmocionalGameProps) {
  const [selectedEmocion, setSelectedEmocion] = useState<Emocion>(EMOCIONES[0]);
  const [selectedColor, setSelectedColor] = useState<string>(selectedEmocion.colores[0]);
  const [sections, setSections] = useState<Section[]>([]);
  const [progress, setProgress] = useState(0);
  const [artworkComplete, setArtworkComplete] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [totalArtworks, setTotalArtworks] = useState(0);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    initializeArtwork();
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    setSelectedColor(selectedEmocion.colores[0]);
  }, [selectedEmocion]);

  const initializeArtwork = () => {
    const newSections: Section[] = [];
    for (let i = 0; i < SECTIONS_PER_ARTWORK; i++) {
      newSections.push({
        id: i,
        coloreado: false,
        colorUsado: null
      });
    }
    setSections(newSections);
    setProgress(0);
    setArtworkComplete(false);
    setTimeElapsed(0);
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
  };

  const handleEmocionChange = (emocion: Emocion) => {
    setSelectedEmocion(emocion);
    initializeArtwork();
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
  };

  const handleSectionClick = (sectionId: number) => {
    if (artworkComplete || !isMountedRef.current) return;

    const updatedSections = sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          coloreado: true,
          colorUsado: selectedColor
        };
      }
      return section;
    });

    setSections(updatedSections);
    
    const newProgress = updatedSections.filter(s => s.coloreado).length;
    setProgress(newProgress);

    // Animation for coloring
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      animations.popIn(element);
    }

    // Check if artwork is complete
    if (newProgress === SECTIONS_PER_ARTWORK) {
      handleArtworkComplete();
    }
  };

  const handleArtworkComplete = () => {
    if (!isMountedRef.current) return;
    
    setArtworkComplete(true);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    setTotalArtworks(prev => prev + 1);
    
    // Award points
    const score = Math.max(50, 200 - timeElapsed);
    
    if (typeof onGameComplete === 'function') {
      try {
        onGameComplete(score);
      } catch (error) {
        console.error('Error in onGameComplete:', error);
      }
    }

    // Show completion message
    setTimeout(() => {
      if (!isMountedRef.current) return;
      initializeArtwork();
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const drawArtwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw simple abstract shapes representing the artwork
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Draw sections as circular segments
    sections.forEach((section, index) => {
      const startAngle = (index / SECTIONS_PER_ARTWORK) * 2 * Math.PI;
      const endAngle = ((index + 1) / SECTIONS_PER_ARTWORK) * 2 * Math.PI;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, 100, startAngle, endAngle);
      ctx.closePath();
      
      if (section.coloreado && section.colorUsado) {
        ctx.fillStyle = section.colorUsado;
        ctx.fill();
      } else {
        ctx.fillStyle = '#f3f4f6';
        ctx.fill();
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw center circle with emotion emoji
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = selectedEmocion.colores[0];
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(selectedEmocion.emoji, centerX, centerY);
  };

  useEffect(() => {
    drawArtwork();
  }, [sections, selectedEmocion]);

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
        <h1 className="text-2xl font-bold">Arte Emocional</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-pink-600">
            <Palette className="h-5 w-5" />
            <span className="font-bold">{formatTime(timeElapsed)}</span>
          </div>
        </div>
      </div>

      {/* Emotion Selector */}
      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-2">Selecciona una emoción:</div>
        <div className="flex flex-wrap gap-2">
          {EMOCIONES.map(emocion => (
            <button
              key={emocion.id}
              onClick={() => handleEmocionChange(emocion)}
              className={`
                px-4 py-2 rounded-full font-medium transition-all
                ${selectedEmocion.id === emocion.id 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
              `}
            >
              {emocion.emoji} {emocion.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Color Palette */}
      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-2">Paleta de colores:</div>
        <div className="flex flex-wrap gap-2">
          {selectedEmocion.colores.map((color, index) => (
            <button
              key={index}
              onClick={() => handleColorSelect(color)}
              className={`
                w-10 h-10 rounded-full transition-all
                ${selectedColor === color ? 'ring-4 ring-offset-2 ring-pink-500 scale-110' : 'hover:scale-105'}
              `}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Progreso</span>
          <span className="text-sm font-medium">{progress} / {SECTIONS_PER_ARTWORK}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-pink-500 h-2 rounded-full transition-all"
            style={{ width: `${(progress / SECTIONS_PER_ARTWORK) * 100}%` }}
          />
        </div>
      </div>

      {/* Artwork Canvas */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            className="rounded-lg shadow-lg"
          />
          {artworkComplete && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
              <div className="text-center text-white">
                <div className="text-6xl mb-2">🎨</div>
                <div className="text-xl font-bold">¡Obra Completada!</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section Buttons (Alternative to canvas clicking) */}
      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-2">O toca las secciones:</div>
        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              id={`section-${section.id}`}
              onClick={() => handleSectionClick(section.id)}
              disabled={artworkComplete}
              className={`
                aspect-square rounded-lg flex items-center justify-center transition-all
                ${section.coloreado 
                  ? 'shadow-md' 
                  : 'bg-gray-100 border-2 border-dashed border-gray-300'}
                ${artworkComplete ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
              `}
              style={{ 
                backgroundColor: section.coloreado ? section.colorUsado : undefined 
              }}
            >
              {section.coloreado && (
                <CheckCircle className="h-6 w-6 text-white" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center text-gray-600 mb-6">
        <p>Selecciona colores y colorea las secciones para expresar tu emoción.</p>
        <p className="text-sm mt-1">Completa la obra para ganar puntos.</p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={initializeArtwork}
          className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <span>🔄</span>
          <span>Nueva Obra</span>
        </button>
      </div>
    </div>
  );
}