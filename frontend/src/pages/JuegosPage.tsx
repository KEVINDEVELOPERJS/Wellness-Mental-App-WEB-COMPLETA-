import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import { gamificacionService } from '../services/gamificacionService';
import { useUIStore } from '../store/uiStore';
import { Logro, UsuarioLogro } from '../types/logro';
import CalmaMatchGame from '../components/CalmaMatchGame';
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
  Sprout,
  Candy,
  ArrowLeft
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGameComplete = (gameScore: number, gameCombo: number) => {
    // Update gamification stats
    const pointsEarned = Math.floor(gameScore / 10);
    gamificacionService.addPuntos(pointsEarned).then(() => {
      addToast({
        type: 'success',
        title: '¡Juego Completado!',
        message: `Has ganado ${pointsEarned} puntos`,
      });
      setSelectedGame(null);
      loadData(); // Reload to show updated stats
    }).catch((error) => {
      console.error('Error updating gamification:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo actualizar los puntos',
      });
      setSelectedGame(null);
    });
  };

  if (selectedGame === 'calma-match') {
    return (
      <CalmaMatchGame
        onBack={() => setSelectedGame(null)}
        onGameComplete={handleGameComplete}
      />
    );
  }

  if (selectedGame === 'puzzle') {
    return (
      <PlaceholderGame
        onBack={() => setSelectedGame(null)}
        title="Puzzle Zen"
        description="Este juego estará disponible próximamente. Ordena piezas relajantes para mejorar tu concentración."
        iconName="target"
        color="bg-purple-500"
      />
    );
  }

  if (selectedGame === 'arte') {
    return (
      <PlaceholderGame
        onBack={() => setSelectedGame(null)}
        title="Arte Emocional"
        description="Este juego estará disponible próximamente. Dibuja con colores para expresar tus emociones."
        iconName="palette"
        color="bg-pink-500"
      />
    );
  }

  if (selectedGame === 'ritmo') {
    return (
      <PlaceholderGame
        onBack={() => setSelectedGame(null)}
        title="Ritmo Calma"
        description="Este juego estará disponible próximamente. Juego de timing para relajarte con la música."
        iconName="music"
        color="bg-blue-500"
      />
    );
  }

  if (selectedGame === 'jardin') {
    return (
      <PlaceholderGame
        onBack={() => setSelectedGame(null)}
        title="Jardín Mental"
        description="Este juego estará disponible próximamente. Cultiva tu bienestar en un jardín virtual."
        iconName="sprout"
        color="bg-green-500"
      />
    );
  }

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

  const games = useMemo(() => [
    {
      id: 'calma-match',
      name: 'Calma Match',
      description: 'Combina gemas emocionales',
      icon: Candy,
      color: 'bg-rose-500',
      unlocked: true,
    },
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
  ], [nivel?.puntosActuales]);

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
              onSelect={setSelectedGame}
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
              <AchievementCard key={usuarioLogro.id} logro={usuarioLogro.logro || usuarioLogro} />
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

const GameCard = React.memo(function GameCard({ game, onSelect }: any) {
  const handleClick = () => {
    if (game.unlocked) {
      onSelect(game.id);
    }
  };

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
        onClick={handleClick}
        disabled={!game.unlocked}
        className="w-full py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
      >
        <Play className="h-4 w-4" />
        <span>{game.unlocked ? 'Jugar' : 'Bloqueado'}</span>
      </button>
    </div>
  );
});

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

function PlaceholderGame({ onBack, title, description, iconName, color }: any) {
  const iconMap: any = {
    target: Target,
    palette: Palette,
    music: Music,
    sprout: Sprout,
  };
  
  const Icon = iconMap[iconName] || Gamepad2;

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
        <h1 className="text-2xl font-bold">{title}</h1>
        <div className="w-20"></div>
      </div>

      <div className="flex flex-col items-center justify-center py-16">
        <div className={`${color} rounded-full p-8 mb-6`}>
          <Icon className="h-16 w-16 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-4">Próximamente</h2>
        <p className="text-gray-600 text-center max-w-md mb-8">{description}</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Volver a Juegos
        </button>
      </div>
    </div>
  );
}
