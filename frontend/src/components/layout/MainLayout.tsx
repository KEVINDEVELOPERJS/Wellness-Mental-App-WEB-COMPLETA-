import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { 
  Home, 
  Brain, 
  MessageSquare, 
  Heart, 
  Users, 
  Gamepad2, 
  User, 
  Bell,
  LogOut,
  Menu,
  X,
  Shield
} from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Evaluación', href: '/evaluacion', icon: Brain },
  { name: 'Chat IA', href: '/chat-ia', icon: MessageSquare },
  { name: 'Ejercicios', href: '/ejercicios', icon: Heart },
  { name: 'Comunidad', href: '/comunidad', icon: Users },
  { name: 'Juegos', href: '/juegos', icon: Gamepad2 },
  { name: 'Perfil', href: '/perfil', icon: User },
];

const psychologistNavigation = [
  { name: 'Alertas', href: '/alertas-psicologo', icon: Shield },
];

export default function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme, isMobileMenuOpen, setMobileMenuOpen } = useUIStore();

  const handleLogout = async () => {
    const { refreshToken } = useAuthStore.getState();
    if (refreshToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    logout();
    navigate('/login');
  };

  const isActiveRoute = (href: string) => location.pathname === href;

  const renderNavigation = () => (
    <nav className="space-y-1">
      {navigation.map((item) => (
        <button
          key={item.name}
          onClick={() => {
            navigate(item.href);
            setMobileMenuOpen(false);
          }}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            isActiveRoute(item.href)
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          <item.icon className="h-5 w-5" />
          <span>{item.name}</span>
        </button>
      ))}
      
      {user?.rol === 'PSICOLOGO' && (
        <>
          <div className="pt-4 pb-2">
            <p className="px-4 text-xs font-semibold text-muted-foreground uppercase">
              Psicólogo
            </p>
          </div>
          {psychologistNavigation.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.href);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActiveRoute(item.href)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </button>
          ))}
        </>
      )}
    </nav>
  );

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="flex h-screen bg-background">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 border-r bg-card">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-primary">Wellness Mental</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {user?.nombre}
            </p>
          </div>
          
          <div className="flex-1 px-4 overflow-y-auto">
            {renderNavigation()}
          </div>

          <div className="p-4 border-t">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
            >
              {theme === 'light' ? '🌙' : '☀️'}
              <span>{theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
            </button>
          </div>

          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </aside>

        {/* Mobile Header */}
        <div className="flex-1 flex flex-col md:hidden">
          <header className="flex items-center justify-between p-4 border-b bg-card">
            <div>
              <h1 className="text-xl font-bold text-primary">Wellness Mental</h1>
              <p className="text-sm text-muted-foreground">{user?.nombre}</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/notificaciones')}
                className="p-2 rounded-lg hover:bg-accent"
              >
                <Bell className="h-5 w-5" />
              </button>
              
              <button
                onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg hover:bg-accent"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </header>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 bg-background">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b flex items-center justify-between">
                  <h1 className="text-xl font-bold text-primary">Menú</h1>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-lg hover:bg-accent"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto">
                  {renderNavigation()}
                </div>

                <div className="p-4 border-t space-y-2">
                  <button
                    onClick={toggleTheme}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-accent"
                  >
                    {theme === 'light' ? '🌙' : '☀️'}
                    <span>{theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-4 py-2 rounded-lg text-destructive bg-destructive/10"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-4">
            {children}
          </main>
        </div>

        {/* Desktop Main Content */}
        <div className="hidden md:flex flex-1 flex-col">
          <header className="flex items-center justify-between p-6 border-b bg-card">
            <div>
              <h2 className="text-2xl font-bold">
                {navigation.find((item) => isActiveRoute(item.href))?.name || 'Dashboard'}
              </h2>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/notificaciones')}
                className="p-2 rounded-lg hover:bg-accent relative"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              </button>
              
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-accent"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                  {user?.nombre?.charAt(0) || 'U'}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
