import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Droplets, Sprout, Award } from 'lucide-react';
import { animations } from '../utils/animations';

interface JardinMentalGameProps {
  onBack: () => void;
  onGameComplete: (score: number, combo?: number, gameType?: string, duration?: number) => void;
}

interface Plant {
  id: number;
  slot: number;
  tipo: string;
  nombre: string;
  emoji: string;
  estado: number; // 0: semilla, 1: brote, 2: creciendo, 3: florecido
  puedeRegarHoy: boolean;
  diasSinAgua: number;
}

interface PlantType {
  id: string;
  nombre: string;
  emojiSemilla: string;
  emojiBrote: string;
  emojiCreciendo: string;
  emojiFlorecido: string;
  diasParaFlorecer: number;
}

const PLANT_TYPES: PlantType[] = [
  {
    id: 'flor_solar',
    nombre: 'Flor Solar',
    emojiSemilla: '🌱',
    emojiBrote: '🌿',
    emojiCreciendo: '🌻',
    emojiFlorecido: '🌼',
    diasParaFlorecer: 3
  },
  {
    id: 'luna_magica',
    nombre: 'Luna Mágica',
    emojiSemilla: '🌱',
    emojiBrote: '🌿',
    emojiCreciendo: '🌙',
    emojiFlorecido: '✨',
    diasParaFlorecer: 4
  },
  {
    id: 'corazon_rojo',
    nombre: 'Corazón Rojo',
    emojiSemilla: '🌱',
    emojiBrote: '🌿',
    emojiCreciendo: '❤️',
    emojiFlorecido: '🌹',
    diasParaFlorecer: 5
  }
];

const MAX_SLOTS = 6;

export default function JardinMentalGame({ onBack, onGameComplete }: JardinMentalGameProps) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [selectedPlantType, setSelectedPlantType] = useState<PlantType | null>(null);
  const [isPlantingMode, setIsPlantingMode] = useState(false);
  const [streak, setStreak] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Selecciona una planta para regar');
  const [canWaterToday, setCanWaterToday] = useState(true);
  const [availableSlots, setAvailableSlots] = useState(MAX_SLOTS);
  const [showPlantSelector, setShowPlantSelector] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'info' }>({
    show: false,
    message: '',
    type: 'info'
  });
  const [sessionScore, setSessionScore] = useState(0);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    loadGarden();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadGarden = () => {
    // Load garden data from localStorage or initialize empty garden
    try {
      const savedData = localStorage.getItem('jardinMentalData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        if (parsedData.plants && Array.isArray(parsedData.plants)) {
          setPlants(parsedData.plants);
          setStreak(parsedData.streak || 0);
          setSessionScore(parsedData.sessionScore || 0);
          
          // Check if we can water today
          if (parsedData.lastWatered) {
            const now = new Date();
            const lastWatered = new Date(parsedData.lastWatered);
            const daysSinceLastWater = Math.floor((now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
            setCanWaterToday(daysSinceLastWater >= 1);
          }
        }
      } else {
        // Try legacy format
        const savedPlants = localStorage.getItem('jardin_plantas');
        if (savedPlants) {
          setPlants(JSON.parse(savedPlants));
        } else {
          setPlants([]);
        }
        
        const savedStreak = localStorage.getItem('jardin_streak');
        if (savedStreak) {
          setStreak(parseInt(savedStreak));
        }
        
        const lastWaterDate = localStorage.getItem('jardin_last_water');
        if (lastWaterDate) {
          const today = new Date().toDateString();
          const lastWater = new Date(lastWaterDate).toDateString();
          setCanWaterToday(today !== lastWater);
        }
      }
    } catch (error) {
      console.error('Error loading garden data:', error);
      // Initialize with defaults if there's an error
      setPlants([]);
      setStreak(0);
      setSessionScore(0);
      setCanWaterToday(true);
    }
  };

  const saveGarden = () => {
    const gardenData = {
      plants,
      streak,
      lastWatered: new Date().toISOString(),
      sessionScore
    };
    localStorage.setItem('jardinMentalData', JSON.stringify(gardenData));
  };

  const getPlantEmoji = (plant: Plant) => {
    const plantType = PLANT_TYPES.find(pt => pt.id === plant.tipo);
    if (!plantType) return '🌱';
    
    switch (plant.estado) {
      case 0: return plantType.emojiSemilla;
      case 1: return plantType.emojiBrote;
      case 2: return plantType.emojiCreciendo;
      case 3: return plantType.emojiFlorecido;
      default: return plantType.emojiSemilla;
    }
  };

  const handleSlotClick = (slot: number) => {
    if (isPlantingMode && selectedPlantType) {
      plantSeed(slot, selectedPlantType);
      return;
    }

    const plant = plants.find(p => p.slot === slot);
    if (plant) {
      setSelectedPlant(plant);
      setStatusMessage(plant.puedeRegarHoy 
        ? `Toca para regar ${plant.nombre}` 
        : 'Ya fue regada hoy');
    } else {
      setSelectedPlant(null);
      setStatusMessage('Slot vacío - Toca para plantar');
    }
  };

  const plantSeed = (slot: number, plantType: PlantType) => {
    if (!isMountedRef.current) return;
    
    const newPlant: Plant = {
      id: Date.now(),
      slot,
      tipo: plantType.id,
      nombre: plantType.nombre,
      emoji: plantType.emojiSemilla,
      estado: 0,
      puedeRegarHoy: true,
      diasSinAgua: 0
    };

    const updatedPlants = [...plants, newPlant];
    setPlants(updatedPlants);
    setIsPlantingMode(false);
    setSelectedPlantType(null);
    setAvailableSlots(MAX_SLOTS - updatedPlants.length);
    setStatusMessage('¡Semilla plantada!');
    
    // Animation for new plant
    setTimeout(() => {
      const element = document.getElementById(`plant-${slot}`);
      if (element) {
        animations.popIn(element);
      }
    }, 100);

    showNotification('¡Semilla plantada con éxito!', 'success');
    saveGarden();
    
    // Track points internally without exiting the game
    setSessionScore(prev => prev + 15);
  };

  const waterPlant = () => {
    if (!selectedPlant || !canWaterToday) {
      showNotification('No puedes regar hoy', 'info');
      return;
    }

    if (!selectedPlant.puedeRegarHoy) {
      showNotification('Esta planta ya fue regada hoy', 'info');
      return;
    }

    const updatedPlants = plants.map(p => {
      if (p.id === selectedPlant.id) {
        const newEstado = Math.min(p.estado + 1, 3);
        const newPlant = {
          ...p,
          estado: newEstado,
          puedeRegarHoy: false,
          diasSinAgua: 0
        };
        
        // Check if plant bloomed
        if (newEstado === 3) {
          showNotification(`¡${p.nombre} floreció! 🌸`, 'success');
          setStreak(prev => prev + 1);
        }
        
        return newPlant;
      }
      return p;
    });

    setPlants(updatedPlants);
    setCanWaterToday(false);
    setStatusMessage('¡Planta regada!');
    
    // Animation for watering
    const element = document.getElementById(`plant-${selectedPlant.slot}`);
    if (element) {
      animations.pulse(element);
    }

    showNotification('¡Planta regada con éxito!', 'success');
    saveGarden();
    
    // Track points internally without exiting the game
    setSessionScore(prev => prev + 25);
  };

  const showNotification = (message: string, type: 'success' | 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      if (isMountedRef.current) {
        setNotification(prev => ({ ...prev, show: false }));
      }
    }, 3000);
  };

  const openPlantSelector = () => {
    if (availableSlots <= 0) {
      showNotification('No hay slots disponibles', 'info');
      return;
    }
    setShowPlantSelector(true);
  };

  const selectPlantType = (plantType: PlantType) => {
    setSelectedPlantType(plantType);
    setShowPlantSelector(false);
    setIsPlantingMode(true);
    setStatusMessage('Toca un slot vacío para plantar');
  };

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
        <h1 className="text-2xl font-bold">Jardín Mental</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-green-600">
            <Award className="h-5 w-5" />
            <span className="font-bold">Racha: {streak}</span>
          </div>
          <div className="flex items-center gap-1 text-purple-600">
            <Award className="h-5 w-5" />
            <span className="font-bold">Puntos: {sessionScore}</span>
          </div>
        </div>
      </div>

      <div className="mb-6 text-center">
        <div className="text-gray-600">{statusMessage}</div>
      </div>

      {/* Garden Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6 max-w-md mx-auto">
        {Array.from({ length: MAX_SLOTS }).map((_, index) => {
          const plant = plants.find(p => p.slot === index);
          return (
            <div
              key={index}
              id={`plant-${index}`}
              onClick={() => handleSlotClick(index)}
              className={`
                aspect-square rounded-xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all
                ${isPlantingMode && !plant ? 'border-dashed border-green-400 bg-green-50' : 'border-gray-200 bg-white'}
                ${selectedPlant?.slot === index ? 'ring-4 ring-green-500' : ''}
                ${plant ? 'hover:shadow-lg' : ''}
              `}
            >
              {plant ? (
                <>
                  <div className="text-4xl mb-2">{getPlantEmoji(plant)}</div>
                  <div className="text-xs text-gray-600">{plant.nombre}</div>
                  <div className="text-xs text-gray-400">
                    {plant.puedeRegarHoy ? '💧 Needs water' : '✅ Watered'}
                  </div>
                </>
              ) : (
                <div className="text-gray-400 text-2xl">+</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mb-6 flex-wrap">
        <button
          onClick={openPlantSelector}
          disabled={availableSlots <= 0}
          className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Sprout className="h-5 w-5" />
          <span>Plantar ({availableSlots} slots)</span>
        </button>
        <button
          onClick={waterPlant}
          disabled={!selectedPlant || !canWaterToday}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Droplets className="h-5 w-5" />
          <span>Regar</span>
        </button>
        <button
          onClick={() => {
            if (typeof onGameComplete === 'function') {
              onGameComplete(sessionScore, 0, 'jardin', 0);
            }
          }}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <Award className="h-5 w-5" />
          <span>Terminar Sesión</span>
        </button>
      </div>

      {/* Plant Selector Modal */}
      {showPlantSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Elige una planta</h2>
            <div className="space-y-3">
              {PLANT_TYPES.map(plantType => (
                <button
                  key={plantType.id}
                  onClick={() => selectPlantType(plantType)}
                  className="w-full p-4 border rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-4"
                >
                  <div className="text-4xl">{plantType.emojiFlorecido}</div>
                  <div className="text-left">
                    <div className="font-semibold">{plantType.nombre}</div>
                    <div className="text-sm text-gray-600">
                      Florece en {plantType.diasParaFlorecer} días
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowPlantSelector(false)}
              className="mt-4 w-full py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
        } text-white`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}