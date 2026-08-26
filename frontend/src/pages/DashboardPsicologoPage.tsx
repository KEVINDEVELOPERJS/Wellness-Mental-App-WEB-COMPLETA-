import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { alertaService } from '../services/alertaService';
import { 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  Clock,
  Shield,
  Activity,
  CheckCircle,
  AlertCircle,
  Bell
} from 'lucide-react';

interface AlertaRiesgo {
  id: number;
  nivelRiesgo: 'ALTO' | 'MEDIO' | 'BAJO';
  estado: 'PENDIENTE' | 'ATENDIDA' | 'EN_SEGUIMIENTO' | 'DERIVADA';
  estudiante: {
    id: number;
    nombre: string;
    grado: string;
  };
  evaluacion?: {
    puntaje: number;
    prediagnostico?: string;
  };
  fechaCreacion: string;
}

interface DashboardStats {
  totalAlertas: number;
  altoRiesgo: number;
  medioRiesgo: number;
  bajoRiesgo: number;
  pendientes: number;
  atendidas: number;
  enSeguimiento: number;
}

export default function DashboardPsicologoPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [alertas, setAlertas] = useState<AlertaRiesgo[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAlarm, setShowAlarm] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    // Check for high-risk alerts and show alarm
    const checkHighRiskAlerts = setInterval(() => {
      const highRiskPending = alertas.filter(a => a.nivelRiesgo === 'ALTO' && a.estado === 'PENDIENTE');
      if (highRiskPending.length > 0) {
        setShowAlarm(true);
      } else {
        setShowAlarm(false);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkHighRiskAlerts);
  }, [alertas]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const alertasData = await alertaService.getAlertas();
      setAlertas(alertasData);
      
      // Calculate stats
      const calculatedStats: DashboardStats = {
        totalAlertas: alertasData.length,
        altoRiesgo: alertasData.filter(a => a.nivelRiesgo === 'ALTO').length,
        medioRiesgo: alertasData.filter(a => a.nivelRiesgo === 'MEDIO').length,
        bajoRiesgo: alertasData.filter(a => a.nivelRiesgo === 'BAJO').length,
        pendientes: alertasData.filter(a => a.estado === 'PENDIENTE').length,
        atendidas: alertasData.filter(a => a.estado === 'ATENDIDA').length,
        enSeguimiento: alertasData.filter(a => a.estado === 'EN_SEGUIMIENTO').length,
      };
      setStats(calculatedStats);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los datos del dashboard',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (nivel: string) => {
    switch (nivel) {
      case 'ALTO': return 'bg-red-500';
      case 'MEDIO': return 'bg-yellow-500';
      case 'BAJO': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE': return 'bg-red-100 text-red-700';
      case 'ATENDIDA': return 'bg-green-100 text-green-700';
      case 'EN_SEGUIMIENTO': return 'bg-yellow-100 text-yellow-700';
      case 'DERIVADA': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const recentAlertas = Array.isArray(alertas) ? alertas.slice(0, 5) : [];
  const highRiskAlertas = Array.isArray(alertas) ? alertas.filter(a => a.nivelRiesgo === 'ALTO' && a.estado === 'PENDIENTE').slice(0, 3) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner h-12 w-12"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* High Risk Alarm */}
      {showAlarm && (
        <div className="bg-red-600 text-white rounded-xl p-4 border-4 border-red-800 animate-pulse shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-8 w-8 animate-ring" />
              <div>
                <h3 className="text-xl font-bold">⚠️ ALERTA DE ALTO RIESGO ACTIVA</h3>
                <p className="text-red-100">Hay {alertas.filter(a => a.nivelRiesgo === 'ALTO' && a.estado === 'PENDIENTE').length} alerta(s) de alto riesgo pendiente(s) que requieren atención inmediata</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/alertas-psicologo')}
              className="bg-white text-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-50 transition-colors"
            >
              Revisar Alertas
            </button>
          </div>
        </div>
      )}

      {/* Welcome Header */}
      <div className="gradient-wellness rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Bienvenido, {user?.nombre || 'Psicólogo'} 👋
        </h1>
        <p className="text-white/90">
          Panel de monitoreo de bienestar estudiantil
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={AlertTriangle}
          label="Total Alertas"
          value={stats?.totalAlertas || 0}
          color="text-blue-500"
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={Shield}
          label="Alto Riesgo"
          value={stats?.altoRiesgo || 0}
          color="text-red-500"
          bgColor="bg-red-50"
        />
        <StatCard
          icon={AlertCircle}
          label="Medio Riesgo"
          value={stats?.medioRiesgo || 0}
          color="text-yellow-500"
          bgColor="bg-yellow-50"
        />
        <StatCard
          icon={CheckCircle}
          label="Bajo Riesgo"
          value={stats?.bajoRiesgo || 0}
          color="text-green-500"
          bgColor="bg-green-50"
        />
      </div>

      {/* Priority Alerts Panel */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* High Risk Alerts */}
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-500" />
              <span>Alertas de Alto Riesgo</span>
            </h2>
            <button
              onClick={() => navigate('/alertas-psicologo')}
              className="text-sm text-primary hover:text-primary/80"
            >
              Ver todas
            </button>
          </div>
          
          {highRiskAlertas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>No hay alertas de alto riesgo pendientes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {highRiskAlertas.map((alerta) => (
                <div
                  key={alerta.id}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                  onClick={() => navigate('/alertas-psicologo')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-white">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{alerta.estudiante.nombre}</p>
                        <p className="text-xs text-muted-foreground">{alerta.estudiante.grado}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-red-200 text-red-700 rounded-full">
                      {alerta.estado}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{alerta.evaluacion?.prediagnostico || 'Sin prediagnóstico'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Medium/Low Risk Alerts */}
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span>Alertas Medio/Bajo Riesgo</span>
            </h2>
            <button
              onClick={() => navigate('/alertas-psicologo')}
              className="text-sm text-primary hover:text-primary/80"
            >
              Ver todas
            </button>
          </div>
          
          {alertas.filter(a => a.nivelRiesgo !== 'ALTO').length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>No hay alertas de medio/bajo riesgo</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.isArray(alertas) && alertas
                .filter(a => a.nivelRiesgo !== 'ALTO')
                .slice(0, 5)
                .map((alerta) => (
                  <div
                    key={alerta.id}
                    className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors"
                    onClick={() => navigate('/alertas-psicologo')}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`h-8 w-8 rounded-full ${getRiskColor(alerta.nivelRiesgo)} flex items-center justify-center text-white`}>
                          <AlertCircle className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{alerta.estudiante.nombre}</p>
                          <p className="text-xs text-muted-foreground">{alerta.estudiante.grado}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getEstadoColor(alerta.estado)}`}>
                        {alerta.estado}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{alerta.evaluacion?.prediagnostico || 'Sin prediagnóstico'}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Overview */}
      <div className="bg-card rounded-xl p-6 border">
        <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
          <Activity className="h-5 w-5 text-primary" />
          <span>Estado General</span>
        </h2>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{stats?.pendientes || 0}</p>
            <p className="text-sm text-gray-600">Pendientes</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{stats?.enSeguimiento || 0}</p>
            <p className="text-sm text-gray-600">En Seguimiento</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats?.atendidas || 0}</p>
            <p className="text-sm text-gray-600">Atendidas</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/alertas-psicologo')}
          className="p-6 bg-card rounded-xl border hover:border-primary transition-colors text-left"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <span className="font-semibold">Gestionar Alertas</span>
          </div>
          <p className="text-sm text-muted-foreground">Ver y gestionar todas las alertas de riesgo</p>
        </button>

        <button
          onClick={() => navigate('/crear-cuestionario')}
          className="p-6 bg-card rounded-xl border hover:border-primary transition-colors text-left"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <span className="font-semibold">Crear Cuestionario</span>
          </div>
          <p className="text-sm text-muted-foreground">Diseñar nuevos cuestionarios de evaluación</p>
        </button>

        <button
          onClick={() => navigate('/chat-ia')}
          className="p-6 bg-card rounded-xl border hover:border-primary transition-colors text-left"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-500" />
            </div>
            <span className="font-semibold">Chat IA</span>
          </div>
          <p className="text-sm text-muted-foreground">Interactuar con el asistente de IA</p>
        </button>

        <button
          onClick={() => navigate('/test-gemini')}
          className="p-6 bg-card rounded-xl border hover:border-primary transition-colors text-left"
        >
          <div className="flex items-center space-x-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <Activity className="h-5 w-5 text-green-500" />
            </div>
            <span className="font-semibold">Probar Configuración Gemini</span>
          </div>
          <p className="text-sm text-muted-foreground">Verificar que la API key esté configurada correctamente</p>
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bgColor }: any) {
  return (
    <div className={`p-4 rounded-xl ${bgColor} border`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <Icon className={`h-8 w-8 ${color}`} />
      </div>
    </div>
  );
}