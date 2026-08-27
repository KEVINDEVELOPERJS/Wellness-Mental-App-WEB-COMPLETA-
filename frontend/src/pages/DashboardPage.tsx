import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { gamificacionService } from '../services/gamificacionService';
import { useUIStore } from '../store/uiStore';
import { 
  Brain, 
  Heart, 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Award,
  Calendar,
  Clock,
  Zap
} from 'lucide-react';

interface DashboardStats {
  ejerciciosCompletados: number;
  chatsRealizados: number;
  evaluacionesCompletadas: number;
  postsComunidad: number;
  puntos: number;
  nivel: string;
  rachaDias: number;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect psychologists to their specific dashboard
    if (user?.rol === 'PSICOLOGO') {
      navigate('/dashboard-psicologo');
      return;
    }
    
    loadDashboardData();
  }, [user, navigate]);

  const loadDashboardData = async () => {
    try {
      const data = await gamificacionService.getEstadisticas();
      setStats(data);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar las estadísticas',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Iniciar Ejercicio',
      description: 'Respiración o meditación',
      icon: Heart,
      color: 'bg-pink-500',
      onClick: () => navigate('/ejercicios'),
    },
    {
      title: 'Chat con IA',
      description: 'Habla con el asistente',
      icon: MessageSquare,
      color: 'bg-blue-500',
      onClick: () => navigate('/chat-ia'),
    },
    {
      title: 'Evaluación',
      description: 'Test de bienestar',
      icon: Brain,
      color: 'bg-purple-500',
      onClick: () => navigate('/evaluacion'),
    },
    {
      title: 'Comunidad',
      description: 'Conecta con otros',
      icon: Users,
      color: 'bg-green-500',
      onClick: () => navigate('/comunidad'),
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
      {/* Welcome Header */}
      <div className="gradient-wellness rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          ¡Hola, {user?.nombre || 'Estudiante'}! 👋
        </h1>
        <p className="text-white/90">
          Bienvenido de nuevo. Tu bienestar es nuestra prioridad.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Heart}
          label="Ejercicios"
          value={stats?.ejerciciosCompletados || 0}
          color="text-pink-500"
          bgColor="bg-pink-50"
        />
        <StatCard
          icon={MessageSquare}
          label="Chats"
          value={stats?.chatsRealizados || 0}
          color="text-blue-500"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={Brain}
          label="Evaluaciones"
          value={stats?.evaluacionesCompletadas || 0}
          color="text-purple-500"
          bgColor="bg-purple-50"
        />
        <StatCard
          icon={Users}
          label="Posts"
          value={stats?.postsComunidad || 0}
          color="text-green-500"
          bgColor="bg-green-50"
        />
      </div>

      {/* Level and Points */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Tu Nivel</h3>
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">{stats?.nivel || 'Explorador'}</span>
              <span className="text-sm text-muted-foreground">{stats?.puntos || 0} puntos</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: '60%' }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Siguiente nivel: {Math.round(((stats?.puntos || 0) / 1500) * 100)}% completado
            </p>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Racha de Actividad</h3>
            <Zap className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-yellow-100 flex items-center justify-center">
              <span className="text-2xl font-bold text-yellow-600">{stats?.rachaDias || 0}</span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Días consecutivos</p>
              <p className="text-xs text-muted-foreground">
                ¡Mantén la racha para desbloquear logros!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={action.onClick}
              className="bg-card rounded-xl p-4 border hover:shadow-lg transition-all text-left group"
            >
              <div className={`${action.color} w-10 h-10 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
              <p className="text-xs text-muted-foreground">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-xl p-6 border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Actividad Reciente</h3>
          <button
            onClick={() => navigate('/perfil')}
            className="text-sm text-primary hover:underline"
          >
            Ver todo
          </button>
        </div>
        
        {stats?.ejerciciosCompletados === 0 && stats?.chatsRealizados === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              ¡Comienza tu viaje de bienestar! Realiza tu primera actividad.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <ActivityItem
              icon={Heart}
              title="Ejercicio de respiración completado"
              time="Hace 2 horas"
            />
            <ActivityItem
              icon={MessageSquare}
              title="Sesión de chat con IA"
              time="Ayer"
            />
            <ActivityItem
              icon={Brain}
              title="Evaluación de bienestar completada"
              time="Hace 3 días"
            />
          </div>
        )}
      </div>

      {/* Daily Tip */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 rounded-full p-3">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Tip del Día</h3>
            <p className="text-sm text-blue-800">
              Dedica 5 minutos cada mañana para respiración profunda. Puede reducir el estrés y mejorar tu concentración durante todo el día.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bgColor }: any) {
  return (
    <div className={`${bgColor} rounded-xl p-4 border`}>
      <Icon className={`h-6 w-6 ${color} mb-2`} />
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ActivityItem({ icon: Icon, title, time }: any) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-secondary rounded-lg">
      <div className="bg-primary/10 rounded-full p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
      <Clock className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}
