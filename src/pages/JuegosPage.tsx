import { useState, useEffect } from 'react';
import { gamificacionService } from '../services/gamificacionService';
import { useUIStore } from '../store/uiStore';
import { Logro, UsuarioLogro } from '../types/logro';
import { 
  Gamepad2, 
  Trophy, 
  Star, 
  Lock, 
  Play,
  Loader2,
  Target,
  Palette,
  Music,
  Sprout
} from 'lucide-react';

export default function JuegosPage() {
  const { addToast } = useUIStore();
  const [logros, setLogros] = useState<UsuarioLogro[]>([]);
  const [allLogros, setAllLogros] = useState<Logro[]>([]);
  const [nivel, setNivel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [userLogros, allLogrosData, nivelData] = await Promise.all([
        gamificacionService.getUserLogros(),
        gamificacionService.getLogros(),
        gamificacionService.getNivel(),
      ]);
      
      setLogros(userLogros);
      setAllLogros(allLogrosData);
      setNivel(nivelData);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los datos de gamificación',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const games = [
    {
      id: 'puzzle',
      name: 'Puzzle Zen',
      description: 'Ordena piezas relajantes',
      icon: Target,
      color: 'bg-purple-500',
      unlocked: true,
    },
    {
      id: 'arte',
      name: 'Arte Emocional',
      description: 'Dibuja con colores',
      icon: Palette,
      color: 'bg-pink-500',
      unlocked: true,
    },
    {
      id: 'ritmo',
      name: 'Ritmo Calma',
      description: 'Juego de timing',
      icon: Music,
      color: 'bg-blue-500',
      unlocked: true,
    },
    {
      id: 'jardin',
      name: 'Jardín Mental',
      description: 'Cultiva tu bienestar',
      icon: Sprout,
      color: 'bg-green-500',
      unlocked: nivel?.puntosActuales >= 100,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner h-12 w-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Juegos de Recompensa</h1>
        <p className="text-muted-foreground">
          Diviértete mientras mejoras tu bienestar mental
        </p>
      </div>

      {/* Level Progress */}
      <div className="bg-card rounded-xl p-6 border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-primary/10 rounded-full p-3">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{nivel?.nivel || 'Explorador Mental'}</h3>
              <p className="text-sm text-muted-foreground">
                {nivel?.puntosActuales || 0} / {nivel?.puntosSiguienteNivel || 500} puntos
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{Math.round(nivel?.progreso || 0)}%</p>
            <p className="text-xs text-muted-foreground">completado</p>
          </div>
        </div>
        <div className="w-full bg-secondary rounded-full h-3">
          <div
            className="bg-primary h-3 rounded-full transition-all"
            style={{ width: `${nivel?.progreso || 0}%` }}
          />
        </div>
      </div>

      {/* Games Grid */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Mini Juegos</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onSelect={() => setSelectedGame(game.id)}
            />
          ))}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Logros Desbloqueados</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {logros.length === 0 ? (
            <div className="col-span-full text-center py-8 bg-card rounded-xl border">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Completa actividades para desbloquear logros
              </p>
            </div>
          ) : (
            logros.map((usuarioLogro) => (
              <AchievementCard key={usuarioLogro.id} logro={usuarioLogro.logro} />
            ))
          )}
        </div>
      </div>

      {/* Available Achievements */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Logros Disponibles</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {allLogros
            .filter(logro => !logros.find(ul => ul.logroId === logro.id))
            .map((logro) => (
              <AchievementCard key={logro.id} logro={logro} locked />
            ))}
        </div>
      </div>
    </div>
  );
}

function GameCard({ game, onSelect }: any) {
  return (
    <div className="bg-card rounded-xl p-6 border hover:shadow-lg transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`${game.color} rounded-full p-3`}>
          <game.icon className="h-6 w-6 text-white" />
        </div>
        {!game.unlocked && (
          <div className="bg-gray-100 rounded-full p-2">
            <Lock className="h-4 w-4 text-gray-500" />
          </div>
        )}
      </div>
      
      <h3 className="text-xl font-semibold mb-2">{game.name}</h3>
      <p className="text-sm text-muted-foreground mb-4">{game.description}</p>
      
      <button
        onClick={onSelect}
        disabled={!game.unlocked}
        className="w-full py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
      >
        <Play className="h-4 w-4" />
        <span>{game.unlocked ? 'Jugar' : 'Bloqueado'}</span>
      </button>
    </div>
  );
}

function AchievementCard({ logro, locked }: any) {
  return (
    <div className={`bg-card rounded-xl p-4 border ${locked ? 'opacity-60' : ''}`}>
      <div className="flex items-center space-x-3 mb-3">
        <div className="text-2xl">{logro.icon || '🏆'}</div>
        <div>
          <h4 className="font-semibold text-sm">{logro.nombre}</h4>
          <p className="text-xs text-muted-foreground">+{logro.puntos} puntos</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{logro.descripcion}</p>
      {locked && (
        <div className="mt-2 flex items-center space-x-1 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          <span>Bloqueado</span>
        </div>
      )}
    </div>
  );
}
