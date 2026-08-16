import { useState, useEffect } from 'react';
import { ejercicioService } from '../services/ejercicioService';
import { useUIStore } from '../store/uiStore';
import { Ejercicio } from '../types/ejercicio';
import { 
  Heart, 
  Clock, 
  Play, 
  CheckCircle, 
  TrendingUp,
  Loader2,
  Flame
} from 'lucide-react';

export default function EjerciciosPage() {
  const { addToast } = useUIStore();
  const [ejercicios, setEjercicios] = useState<Ejercicio[]>([]);
  const [racha, setRacha] = useState(0);
  const [tiempoHoy, setTiempoHoy] = useState({ tiempoMinutos: 0, tiempoRestante: 30 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEjercicio, setSelectedEjercicio] = useState<Ejercicio | null>(null);
  const [isExerciseActive, setIsExerciseActive] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isExerciseActive && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isExerciseActive, timer]);

  const loadData = async () => {
    try {
      const [ejerciciosData, rachaData, tiempoData] = await Promise.all([
        ejercicioService.getEjercicios(),
        ejercicioService.getRacha(),
        ejercicioService.getTiempoHoy(),
      ]);
      
      setEjercicios(ejerciciosData);
      setRacha(rachaData.rachaDias);
      setTiempoHoy(tiempoData);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los ejercicios',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startExercise = (ejercicio: Ejercicio, duracion: number) => {
    setSelectedEjercicio(ejercicio);
    setTimer(duracion * 60); // Convert to seconds
    setIsExerciseActive(true);
    setIsBreathing(true);
  };

  const completeExercise = async () => {
    if (!selectedEjercicio) return;

    try {
      await ejercicioService.registrarProgreso({
        ejercicioId: selectedEjercicio.id,
        duracionReal: Math.round((selectedEjercicio.duracionMinima * 60 - timer) / 60),
        completado: true,
        satisfaccion: 5,
      });

      addToast({
        type: 'success',
        title: '¡Ejercicio completado!',
        message: 'Has ganado 50 puntos',
      });

      setIsExerciseActive(false);
      setIsBreathing(false);
      setSelectedEjercicio(null);
      loadData();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar el progreso',
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner h-12 w-12"></div>
      </div>
    );
  }

  if (isExerciseActive && selectedEjercicio) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Exercise Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{selectedEjercicio.titulo}</h1>
          <p className="text-muted-foreground">{selectedEjercicio.descripcion}</p>
        </div>

        {/* Breathing Animation */}
        <div className="flex justify-center">
          <div className={`relative w-64 h-64 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center ${
            isBreathing ? 'animate-breathe' : ''
          }`}>
            <div className="text-white text-center">
              <p className="text-4xl font-bold">{formatTime(timer)}</p>
              <p className="text-sm opacity-80">minutos restantes</p>
            </div>
          </div>
        </div>

        {/* Breathing Instructions */}
        <div className="text-center">
          <p className="text-lg font-medium text-primary">
            {isBreathing ? 'Inhala...' : 'Exhala...'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Sigue el ritmo del círculo
          </p>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setIsBreathing(!isBreathing)}
            className="px-6 py-3 bg-secondary rounded-lg hover:bg-accent transition-colors"
          >
            {isBreathing ? 'Pausar' : 'Reanudar'}
          </button>
          <button
            onClick={completeExercise}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Finalizar
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="font-semibold mb-3">Instrucciones</h3>
          <p className="text-muted-foreground">{selectedEjercicio.instrucciones}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Ejercicios de Bienestar</h1>
        <p className="text-muted-foreground">
          Técnicas de respiración y relajación para tu bienestar mental
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={Flame}
          label="Racha"
          value={`${racha} días`}
          color="text-orange-500"
          bgColor="bg-orange-50"
        />
        <StatCard
          icon={Clock}
          label="Tiempo hoy"
          value={`${tiempoHoy.tiempoMinutos} min`}
          color="text-blue-500"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={TrendingUp}
          label="Restante"
          value={`${tiempoHoy.tiempoRestante} min`}
          color="text-green-500"
          bgColor="bg-green-50"
        />
      </div>

      {/* Exercise Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {ejercicios.map((ejercicio) => (
          <ExerciseCard
            key={ejercicio.id}
            ejercicio={ejercicio}
            onStart={(duracion) => startExercise(ejercicio, duracion)}
            disabled={tiempoHoy.tiempoRestante <= 0}
          />
        ))}
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
        <div className="flex items-start space-x-4">
          <div className="bg-purple-100 rounded-full p-3">
            <Heart className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-900 mb-2">Beneficios de los Ejercicios</h3>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Reducen el estrés y la ansiedad</li>
              <li>• Mejoran la concentración y enfoque</li>
              <li>• Promueven mejor sueño</li>
              <li>• Aumentan la energía y vitalidad</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bgColor }: any) {
  return (
    <div className={`${bgColor} rounded-xl p-4 border`}>
      <Icon className={`h-5 w-5 ${color} mb-2`} />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ExerciseCard({ ejercicio, onStart, disabled }: any) {
  return (
    <div className="bg-card rounded-xl p-6 border hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="bg-primary/10 rounded-full p-3">
          <Heart className="h-6 w-6 text-primary" />
        </div>
        <span className="text-xs bg-secondary px-2 py-1 rounded-full">
          {ejercicio.tipo}
        </span>
      </div>
      
      <h3 className="text-xl font-semibold mb-2">{ejercicio.titulo}</h3>
      <p className="text-sm text-muted-foreground mb-4">
        {ejercicio.descripcion}
      </p>
      
      <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-4">
        <Clock className="h-4 w-4" />
        <span>{ejercicio.duracionMinima} - {ejercicio.duracionMaxima} min</span>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => onStart(ejercicio.duracionMinima)}
          disabled={disabled}
          className="w-full py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {disabled ? 'Límite diario alcanzado' : `Comenzar (${ejercicio.duracionMinuta} min)`}
        </button>
        
        <div className="flex space-x-2">
          <button
            onClick={() => onStart(Math.ceil((ejercicio.duracionMinima + ejercicio.duracionMaxima) / 2))}
            disabled={disabled}
            className="flex-1 py-2 bg-secondary rounded-lg font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {Math.ceil((ejercicio.duracionMinima + ejercicio.duracionMaxima) / 2)} min
          </button>
          <button
            onClick={() => onStart(ejercicio.duracionMaxima)}
            disabled={disabled}
            className="flex-1 py-2 bg-secondary rounded-lg font-medium hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {ejercicio.duracionMaxima} min
          </button>
        </div>
      </div>
    </div>
  );
}
