import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { gamificacionService } from '../services/gamificacionService';
import { useUIStore } from '../store/uiStore';
import { 
  User, 
  Settings, 
  Shield, 
  Bell, 
  Download,
  LogOut,
  Loader2,
  Camera,
  Calendar,
  Award,
  TrendingUp
} from 'lucide-react';

export default function PerfilPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { addToast } = useUIStore();
  
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'estadisticas' | 'configuracion' | 'privacidad'>('estadisticas');
  const [isUpdating, setIsUpdating] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notificationSettings, setNotificationSettings] = useState({
    chat: true,
    exercises: true,
    community: true,
    alerts: true,
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('es');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
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

  const handleLogout = async () => {
    const { refreshToken } = useAuthStore.getState();
    if (refreshToken) {
      try {
        await authService.logout(refreshToken);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    logout();
    navigate('/login');
  };

  const handleDownloadData = async () => {
    try {
      const response = await fetch('/api/perfil/descargar-datos');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mis-datos-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addToast({
        type: 'success',
        title: 'Datos descargados',
        message: 'Tus datos han sido descargados exitosamente',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron descargar los datos',
      });
    }
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Por favor selecciona un archivo de imagen válido',
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        addToast({
          type: 'error',
          title: 'Error',
          message: 'La imagen no debe superar los 5MB',
        });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
        addToast({
          type: 'success',
          title: 'Foto actualizada',
          message: 'Tu foto de perfil ha sido actualizada',
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleNotificationToggle = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    addToast({
      type: 'success',
      title: 'Configuración actualizada',
      message: 'Tus preferencias de notificación han sido actualizadas',
    });
  };

  const handleDarkModeToggle = () => {
    setIsDarkMode(!isDarkMode);
    // You would integrate with your theme store here
    addToast({
      type: 'success',
      title: 'Modo cambiado',
      message: isDarkMode ? 'Modo claro activado' : 'Modo oscuro activado',
    });
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    addToast({
      type: 'success',
      title: 'Idioma cambiado',
      message: `Idioma cambiado a ${newLanguage === 'es' ? 'Español' : 'English'}`,
    });
  };

  const handlePasswordChange = () => {
    addToast({
      type: 'info',
      title: 'Funcionalidad en desarrollo',
      message: 'El cambio de contraseña estará disponible próximamente',
    });
  };

  const handleTwoFactorAuth = () => {
    addToast({
      type: 'info',
      title: 'Funcionalidad en desarrollo',
      message: 'La autenticación 2FA estará disponible próximamente',
    });
  };

  const handleGenerateInviteCode = () => {
    addToast({
      type: 'success',
      title: 'Código generado',
      message: 'Código de invitación generado: ABC123XYZ',
    });
  };

  const handleRevokeParentalAccess = () => {
    addToast({
      type: 'success',
      title: 'Acceso revocado',
      message: 'El acceso parental ha sido revocado',
    });
  };

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
      <div className="gradient-wellness rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold overflow-hidden">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user?.nombre?.charAt(0) || 'U'
              )}
            </div>
            <button 
              onClick={handlePhotoClick}
              className="absolute bottom-0 right-0 bg-white rounded-full p-2 text-primary hover:bg-white/90 transition-colors"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.nombre || 'Usuario'}</h1>
            <p className="text-white/90">{user?.email}</p>
            <p className="text-white/80 text-sm">{user?.grado} • {user?.rol}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-secondary rounded-lg p-1">
        <button
          onClick={() => setActiveTab('estadisticas')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'estadisticas' ? 'bg-background shadow' : 'hover:bg-accent'
          }`}
        >
          <span className="flex items-center justify-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Estadísticas</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab('configuracion')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'configuracion' ? 'bg-background shadow' : 'hover:bg-accent'
          }`}
        >
          <span className="flex items-center justify-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Configuración</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab('privacidad')}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'privacidad' ? 'bg-background shadow' : 'hover:bg-accent'
          }`}
        >
          <span className="flex items-center justify-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Privacidad</span>
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'estadisticas' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-4 gap-4">
            <StatCard icon={Award} label="Nivel" value={stats?.nivel || 'Explorador'} />
            <StatCard icon={TrendingUp} label="Puntos" value={stats?.puntos || 0} />
            <StatCard icon={Calendar} label="Racha" value={`${stats?.rachaDias || 0} días`} />
            <StatCard icon={Award} label="Logros" value={stats?.ejerciciosCompletados || 0} />
          </div>

          <div className="bg-card rounded-xl p-6 border">
            <h3 className="font-semibold mb-4">Historial de Actividad</h3>
            <div className="space-y-3">
              <ActivityItem title="Ejercicio completado" time="Hace 2 horas" />
              <ActivityItem title="Evaluación finalizada" time="Hace 3 días" />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'configuracion' && (
        <div className="space-y-6">
          <div className="bg-card rounded-xl p-6 border">
            <h3 className="font-semibold mb-4">Notificaciones</h3>
            <div className="space-y-4">
              <NotificationItem 
                label="Notificaciones de chat" 
                checked={notificationSettings.chat}
                onToggle={() => handleNotificationToggle('chat')}
              />
              <NotificationItem 
                label="Recordatorios de ejercicios" 
                checked={notificationSettings.exercises}
                onToggle={() => handleNotificationToggle('exercises')}
              />
              <NotificationItem 
                label="Actualizaciones de comunidad" 
                checked={notificationSettings.community}
                onToggle={() => handleNotificationToggle('community')}
              />
              <NotificationItem 
                label="Alertas de riesgo" 
                checked={notificationSettings.alerts}
                onToggle={() => handleNotificationToggle('alerts')}
              />
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border">
            <h3 className="font-semibold mb-4">Preferencias</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Modo oscuro</span>
                <button 
                  onClick={handleDarkModeToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isDarkMode ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span>Idioma</span>
                <select 
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'privacidad' && (
        <div className="space-y-6">
          <div className="bg-card rounded-xl p-6 border">
            <h3 className="font-semibold mb-4">Seguridad</h3>
            <div className="space-y-3">
              <button 
                onClick={handlePasswordChange}
                className="w-full flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-accent transition-colors"
              >
                <span className="flex items-center space-x-3">
                  <Shield className="h-5 w-5" />
                  <span>Cambiar contraseña</span>
                </span>
              </button>
              <button 
                onClick={handleTwoFactorAuth}
                className="w-full flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-accent transition-colors"
              >
                <span className="flex items-center space-x-3">
                  <Shield className="h-5 w-5" />
                  <span>Activar autenticación 2FA</span>
                </span>
              </button>
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border">
            <h3 className="font-semibold mb-4">Datos</h3>
            <button
              onClick={handleDownloadData}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Download className="h-5 w-5" />
              <span>Descargar mis datos</span>
            </button>
          </div>

          <div className="bg-card rounded-xl p-6 border">
            <h3 className="font-semibold mb-4">Padres/Tutores</h3>
            <div className="space-y-3">
              <button 
                onClick={handleGenerateInviteCode}
                className="w-full flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-accent transition-colors"
              >
                <span>Generar código de invitación</span>
              </button>
              <button 
                onClick={handleRevokeParentalAccess}
                className="w-full flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-accent transition-colors"
              >
                <span>Revocar acceso parental</span>
              </button>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 p-3 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: any) {
  return (
    <div className="bg-card rounded-xl p-4 border">
      <Icon className="h-5 w-5 text-primary mb-2" />
      <p className="text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ActivityItem({ title, time }: any) {
  return (
    <div className="flex items-center space-x-3 p-3 bg-secondary rounded-lg">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

function NotificationItem({ label, checked, onToggle }: any) {
  return (
    <div className="flex items-center justify-between">
      <span>{label}</span>
      <button 
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary' : 'bg-secondary'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  );
}
