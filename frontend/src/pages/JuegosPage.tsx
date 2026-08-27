import { useState, useEffect, useMemo } from 'react';
import React from 'react';
import { gamificacionService } from '../services/gamificacionService';
import { useUIStore } from '../store/uiStore';
import { Logro, UsuarioLogro } from '../types/logro';
import CalmaMatchGame from '../components/CalmaMatchGame';
import RitmoCalmaGame from '../components/RitmoCalmaGame';
import JardinMentalGame from '../components/JardinMentalGame';
import PuzzleZenGame from '../components/PuzzleZenGame';
import ArteEmocionalGame from '../components/ArteEmocionalGame';
import { animations } from '../utils/animations';
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
  ArrowLeft,
  Flame,
  Clock,
  Award,
  TrendingUp,
  CheckCircle
} from 'lucide-react';

export default function JuegosPage() {
  const { addToast } = useUIStore();
  const [logros, setLogros] = useState<UsuarioLogro[]>([]);
  const [allLogros, setAllLogros] = useState<Logro[]>([]);
  const [nivel, setNivel] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [misiones, setMisiones] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);
  const [estadoGamificacion, setEstadoGamificacion] = useState<any>(null);

  const loadData = async () => {
    try {
      const [userLogros, allLogrosData, nivelData, misionesData, rankingData, estadoData] = await Promise.all([
        gamificacionService.getUserLogros().catch(() => []),
        gamificacionService.getLogros().catch(() => []),
        gamificacionService.getNivel().catch(() => ({ nivel: 'Explorador Mental', puntosActuales: 0, puntosSiguienteNivel: 500, progreso: 0 })),
        gamificacionService.getMisionesDiarias(),
        gamificacionService.getLeaderboard().catch(() => []),
        gamificacionService.getEstadoGamificacion(),
      ]);
      
      // Ensure data is in correct format
      setLogros(Array.isArray(userLogros) ? userLogros : []);
      setAllLogros(Array.isArray(allLogrosData) ? allLogrosData : []);
      setNivel(nivelData || { nivel: 'Explorador Mental', puntosActuales: 0, puntosSiguienteNivel: 500, progreso: 0 });
      setMisiones(Array.isArray(misionesData) ? misionesData : []);
      setRanking(Array.isArray(rankingData) ? rankingData : []);
      setEstadoGamificacion(estadoData || {
        rachaActividad: 0,
        minutosRestantesHoy: 30,
        posicionRanking: 0,
        misionesCompletadasHoy: 0,
        misionesTotalesHoy: 3
      });
    } catch (error) {
      console.error('Error loading gamification data:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los datos de gamificación',
      });
      // Set default values on error
      setLogros([]);
      setAllLogros([]);
      setNivel({ nivel: 'Explorador Mental', puntosActuales: 0, puntosSiguienteNivel: 500, progreso: 0 });
      setMisiones([]);
      setRanking([]);
      setEstadoGamificacion({
        rachaActividad: 0,
        minutosRestantesHoy: 30,
        posicionRanking: 0,
        misionesCompletadasHoy: 0,
        misionesTotalesHoy: 3
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGameComplete = (gameScore: number, gameCombo?: number, gameType?: string) => {
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
      // Still show success and navigate back even if API fails
      addToast({
        type: 'success',
        title: '¡Juego Completado!',
        message: `Has ganado ${pointsEarned} puntos`,
      });
      setSelectedGame(null);
      loadData(); // Try to reload anyway
    });
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
      unlocked: (nivel?.puntosActuales || 0) >= 100,
    },
  ], [nivel?.puntosActuales]);

  if (selectedGame === 'calma-match') {
    return (
      <CalmaMatchGame
        onBack={() => setSelectedGame(null)}
        onGameComplete={(score, combo) => handleGameComplete(score, combo, 'calma-match')}
      />
    );
  }

  if (selectedGame === 'ritmo') {
    return (
      <RitmoCalmaGame
        onBack={() => setSelectedGame(null)}
        onGameComplete={(score, combo) => handleGameComplete(score, combo, 'ritmo')}
      />
    );
  }

  if (selectedGame === 'jardin') {
    return (
      <JardinMentalGame
        onBack={() => setSelectedGame(null)}
        onGameComplete={(score) => handleGameComplete(score, 0, 'jardin')}
      />
    );
  }

  if (selectedGame === 'puzzle') {
    return (
      <PuzzleZenGame
        onBack={() => setSelectedGame(null)}
        onGameComplete={(score, level) => handleGameComplete(score, 0, 'puzzle')}
      />
    );
  }

  if (selectedGame === 'arte') {
    return (
      <ArteEmocionalGame
        onBack={() => setSelectedGame(null)}
        onGameComplete={(score) => handleGameComplete(score, 0, 'arte')}
      />
    );
  }

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

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-muted-foreground">Racha</span>
          </div>
          <p className="text-2xl font-bold">{estadoGamificacion?.rachaActividad || 0}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">Tiempo Hoy</span>
          </div>
          <p className="text-2xl font-bold">{estadoGamificacion?.minutosRestantesHoy || 0} min</p>
        </div>
        <div className="bg-card rounded-xl p-4 border">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <span className="text-sm text-muted-foreground">Ranking</span>
          </div>
          <p className="text-2xl font-bold">#{estadoGamificacion?.posicionRanking || 0}</p>
        </div>
        <div className="bg-card rounded-xl p-4 border">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-muted-foreground">Misiones</span>
          </div>
          <p className="text-2xl font-bold">{estadoGamificacion?.misionesCompletadasHoy || 0}/{estadoGamificacion?.misionesTotalesHoy || 3}</p>
        </div>
      </div>

      {/* Daily Missions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Misiones Diarias</h2>
        <div className="space-y-3">
          {!Array.isArray(misiones) || misiones.length === 0 ? (
            <div className="text-center py-8 bg-card rounded-xl border">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No hay misiones disponibles por ahora
              </p>
            </div>
          ) : (
            misiones.map((mision, index) => (
              <div
                key={mision.id || index}
                className={`bg-card rounded-xl p-4 border ${
                  mision.completada ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      mision.completada ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {mision.completada ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <Star className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{mision.titulo || 'Misión'}</h4>
                      <p className="text-sm text-muted-foreground">{mision.descripcion || 'Completa esta misión'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">+{mision.puntos || 0} pts</p>
                    {mision.progreso !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        {mision.progreso}/{mision.objetivo || 1}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
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

      {/* Ranking */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Ranking Global</h2>
        <div className="bg-card rounded-xl border overflow-hidden">
          {!Array.isArray(ranking) || ranking.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Ranking no disponible
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {Array.isArray(ranking) && ranking.slice(0, 5).map((user, index) => (
                <div
                  key={user.id || index}
                  className={`flex items-center justify-between p-4 ${
                    index === 0 ? 'bg-yellow-50' : index === 1 ? 'bg-gray-50' : index === 2 ? 'bg-orange-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' : 
                      index === 1 ? 'bg-gray-400 text-white' : 
                      index === 2 ? 'bg-orange-400 text-white' : 
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold">{user.nombre || 'Usuario'}</h4>
                      <p className="text-sm text-muted-foreground">{user.puntos || 0} puntos</p>
                    </div>
                  </div>
                  {user.esUsuario && (
                    <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                      Tú
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Logros Desbloqueados</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {!Array.isArray(logros) || logros.length === 0 ? (
            <div className="col-span-full text-center py-8 bg-card rounded-xl border">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Completa actividades para desbloquear logros
              </p>
            </div>
          ) : (
            logros.map((usuarioLogro, index) => (
              <AchievementCard key={usuarioLogro.id || index} logro={usuarioLogro.logro || usuarioLogro} />
            ))
          )}
        </div>
      </div>

      {/* Available Achievements */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Logros Disponibles</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {!Array.isArray(allLogros) || allLogros.length === 0 ? (
            <div className="col-span-full text-center py-8 bg-card rounded-xl border">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                No hay logros disponibles
              </p>
            </div>
          ) : (
            allLogros
              .filter(logro => !logros.find(ul => ul.logroId === logro.id))
              .map((logro, index) => (
                <AchievementCard key={logro.id || index} logro={logro} locked />
              ))
          )}
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
    <div className="bg-card rounded-xl p-6 border hover:shadow-lg transition-all cursor-pointer">
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
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
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
  if (!logro) return null;
  
  return (
    <div className={`bg-card rounded-xl p-4 border ${locked ? 'opacity-60' : ''}`}>
      <div className="flex items-center space-x-3 mb-3">
        <div className="text-2xl">{logro.icon || logro.emoji || '🏆'}</div>
        <div>
          <h4 className="font-semibold text-sm">{logro.nombre || logro.name || 'Logro'}</h4>
          <p className="text-xs text-muted-foreground">+{logro.puntos || logro.points || 0} puntos</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{logro.descripcion || logro.description || 'Descripción no disponible'}</p>
      {locked && (
        <div className="mt-2 flex items-center space-x-1 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          <span>Bloqueado</span>
        </div>
      )}
    </div>
  );
}
