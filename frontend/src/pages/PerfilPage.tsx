import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { gamificacionService } from '../services/gamificacionService';
import { perfilService } from '../services/perfilService';
import { useUIStore } from '../store/uiStore';
import { 
  Settings, 
  Shield, 
  Download,
  LogOut,
  Loader2,
  Camera,
  Calendar,
  Award,
  TrendingUp,
  Trash2,
  KeyRound,
  QrCode,
  UserPlus,
  X
} from 'lucide-react';

export default function PerfilPage() {
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const { addToast, theme, setTheme } = useUIStore();
  
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'estadisticas' | 'configuracion' | 'privacidad'>('estadisticas');
  const [isUpdating, setIsUpdating] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.avatar || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [notificationSettings, setNotificationSettings] = useState({
    chat: true,
    exercises: true,
    community: true,
    alerts: true,
  });
  const [language, setLanguage] = useState('es');

  // Modales de privacidad
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{ secret: string; qrCode: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
    loadPerfil();
  }, []);

  useEffect(() => {
    setProfilePhoto(user?.avatar || null);
  }, [user?.avatar]);

  const loadPerfil = async () => {
    try {
      const perfil = await perfilService.getPerfil();
      // Sincroniza el usuario (incluida la foto) desde el backend para que
      // persista en cualquier dispositivo donde inicie sesión.
      if (user) {
        setUser({ ...user, ...perfil });
      }
      if (perfil.avatar) setProfilePhoto(perfil.avatar);
    } catch (error) {
      // Silencioso: el backend puede no estar disponible en desarrollo.
      console.warn('No se pudo cargar el perfil desde el backend');
    }
  };

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

      // Create preview and update user
      const reader = new FileReader();
      reader.onloadend = async () => {
        const photoData = reader.result;
        if (typeof photoData === 'string') {
          setProfilePhoto(photoData);
          
          // Update user in store to persist the avatar
          if (user) {
            setUser({ ...user, avatar: photoData });
          }

          // Persistir en el backend para que se mantenga en cualquier dispositivo.
          try {
            await perfilService.guardarAvatar(photoData);
          } catch {
            console.warn('No se pudo sincronizar la foto con el backend');
          }
          
          addToast({
            type: 'success',
            title: 'Foto actualizada',
            message: 'Tu foto de perfil ha sido actualizada',
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = async () => {
    setProfilePhoto(null);
    if (user) {
      setUser({ ...user, avatar: undefined });
    }
    try {
      await perfilService.eliminarAvatar();
    } catch {
      console.warn('No se pudo eliminar la foto en el backend');
    }
    addToast({
      type: 'success',
      title: 'Foto eliminada',
      message: 'Tu foto de perfil ha sido eliminada',
    });
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleNotificationToggle = (setting: keyof typeof notificationSettings) => {
    const nuevo = {
      ...notificationSettings,
      [setting]: !notificationSettings[setting],
    };
    setNotificationSettings(nuevo);
    // Sincroniza con el backend (best-effort).
    void perfilService.actualizarNotificaciones({
      notificacionesChat: nuevo.chat,
      notificacionesEjercicios: nuevo.exercises,
      notificacionesComunidad: nuevo.community,
      notificacionesAlertas: nuevo.alerts,
    }).catch(() => undefined);
    addToast({
      type: 'success',
      title: 'Configuración actualizada',
      message: 'Tus preferencias de notificación han sido actualizadas',
    });
  };

  const handleDarkModeToggle = () => {
    const nuevoTema = theme === 'dark' ? 'light' : 'dark';
    setTheme(nuevoTema);
    void perfilService.actualizarNotificaciones({ temaOscuro: nuevoTema === 'dark' }).catch(() => undefined);
    addToast({
      type: 'success',
      title: 'Modo cambiado',
      message: nuevoTema === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado',
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

  // ── Cambio de contraseña ──
  const handlePasswordChange = async () => {
    if (!passwordActual || !passwordNueva) {
      addToast({ type: 'error', title: 'Error', message: 'Completa todos los campos' });
      return;
    }
    if (passwordNueva.length < 8) {
      addToast({ type: 'error', title: 'Error', message: 'La nueva contraseña debe tener al menos 8 caracteres' });
      return;
    }
    if (passwordNueva !== passwordConfirmar) {
      addToast({ type: 'error', title: 'Error', message: 'Las contraseñas no coinciden' });
      return;
    }
    setIsUpdating(true);
    try {
      await perfilService.cambiarPassword(passwordActual, passwordNueva);
      addToast({ type: 'success', title: 'Contraseña actualizada', message: 'Tu contraseña ha sido cambiada' });
      setShowPasswordModal(false);
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirmar('');
    } catch (error: any) {
      const msg = error?.response?.data?.error || 'No se pudo cambiar la contraseña';
      addToast({ type: 'error', title: 'Error', message: msg });
    } finally {
      setIsUpdating(false);
    }
  };

  // ── 2FA ──
  const handleTwoFactorAuth = async () => {
    setIsUpdating(true);
    try {
      const data = await perfilService.activar2FA();
      setTwoFactorData({ secret: data.secret, qrCode: data.qrCode });
      setShow2FAModal(true);
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudo iniciar la activación de 2FA' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirm2FA = async () => {
    if (!twoFactorData || !twoFactorCode) return;
    setIsUpdating(true);
    try {
      const { valido } = await perfilService.validar2FA(twoFactorCode, twoFactorData.secret);
      if (valido) {
        addToast({ type: 'success', title: '2FA activado', message: 'La autenticación en dos pasos está activa' });
        setShow2FAModal(false);
        setTwoFactorCode('');
        setTwoFactorData(null);
      } else {
        addToast({ type: 'error', title: 'Código inválido', message: 'Verifica el código e inténtalo de nuevo' });
      }
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudo validar el código 2FA' });
    } finally {
      setIsUpdating(false);
    }
  };

  // ── Código de invitación ──
  const handleGenerateInviteCode = async () => {
    setIsUpdating(true);
    try {
      const { codigo } = await perfilService.generarInvitacionPadre();
      setInviteCode(codigo);
      addToast({ type: 'success', title: 'Código generado', message: `Código de invitación: ${codigo}` });
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudo generar el código de invitación' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRevokeParentalAccess = async () => {
    setIsUpdating(true);
    try {
      await perfilService.revocarAccesoPadre();
      addToast({ type: 'success', title: 'Acceso revocado', message: 'El acceso parental ha sido revocado' });
    } catch {
      addToast({ type: 'error', title: 'Error', message: 'No se pudo revocar el acceso parental' });
    } finally {
      setIsUpdating(false);
    }
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
              title="Cambiar foto"
            >
              <Camera className="h-4 w-4" />
            </button>
            {profilePhoto && (
              <button
                onClick={handleRemovePhoto}
                className="absolute bottom-0 left-0 bg-white rounded-full p-2 text-destructive hover:bg-white/90 transition-colors"
                title="Eliminar foto"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
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
            <p className="text-white/80 text-sm">{user?.grado} • Usuario</p>
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
                    theme === 'dark' ? 'bg-primary' : 'bg-secondary'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
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
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-accent transition-colors"
              >
                <span className="flex items-center space-x-3">
                  <KeyRound className="h-5 w-5" />
                  <span>Cambiar contraseña</span>
                </span>
              </button>
              <button 
                onClick={handleTwoFactorAuth}
                disabled={isUpdating}
                className="w-full flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              >
                <span className="flex items-center space-x-3">
                  <QrCode className="h-5 w-5" />
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
                disabled={isUpdating}
                className="w-full flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
              >
                <span className="flex items-center space-x-3">
                  <UserPlus className="h-5 w-5" />
                  <span>Generar código de invitación</span>
                </span>
              </button>
              {inviteCode && (
                <div className="p-3 bg-primary/10 rounded-lg text-center">
                  <p className="text-xs text-muted-foreground mb-1">Código de invitación (válido 7 días)</p>
                  <p className="text-lg font-mono font-bold text-primary tracking-widest">{inviteCode}</p>
                </div>
              )}
              <button 
                onClick={handleRevokeParentalAccess}
                disabled={isUpdating}
                className="w-full flex items-center justify-between p-3 bg-secondary rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
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

      {/* ── Modal: Cambiar contraseña ── */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Cambiar contraseña</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Contraseña actual</label>
                <input
                  type="password"
                  value={passwordActual}
                  onChange={(e) => setPasswordActual(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nueva contraseña</label>
                <input
                  type="password"
                  value={passwordNueva}
                  onChange={(e) => setPasswordNueva(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  value={passwordConfirmar}
                  onChange={(e) => setPasswordConfirmar(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Repite la contraseña"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2 border rounded-lg hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePasswordChange}
                  disabled={isUpdating}
                  className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: 2FA ── */}
      {show2FAModal && twoFactorData && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl p-6 max-w-md w-full border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Activar 2FA</h3>
              <button onClick={() => setShow2FAModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Escanea este código con tu app de autenticación (Google Authenticator, Authy, etc.).
            </p>
            <div className="bg-secondary rounded-lg p-3 mb-3 break-all">
              <p className="text-xs text-muted-foreground mb-1">Secreto (introdúcelo manualmente si es necesario):</p>
              <p className="font-mono text-sm">{twoFactorData.secret}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Código de 6 dígitos</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 border rounded-lg text-center text-lg tracking-widest focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="000000"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShow2FAModal(false)}
                  className="flex-1 py-2 border rounded-lg hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm2FA}
                  disabled={isUpdating || twoFactorCode.length !== 6}
                  className="flex-1 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Verificar
                </button>
              </div>
            </div>
          </div>
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
