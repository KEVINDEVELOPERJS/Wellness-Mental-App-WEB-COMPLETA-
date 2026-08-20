import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { useUIStore } from '../store/uiStore';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, setLoading } = useAuthStore();
  const { addToast } = useUIStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      setAuth(response.usuario, response.accessToken, response.refreshToken);
      
      addToast({
        type: 'success',
        title: 'Bienvenido',
        message: `Hola, ${response.usuario.nombre}`,
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error de inicio de sesión',
        message: error.response?.data?.error || 'Credenciales inválidas',
      });
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-wellness flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src="/images/wellness-icon.png" 
                alt="Wellness Mental Icon" 
                className="h-20 w-20 object-contain"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Wellness Mental</h1>
            <p className="text-gray-600 mt-2">Tu espacio para el bienestar emocional</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <span>Iniciar Sesión</span>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="text-center space-y-2">
            <Link
              to="/registro"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              ¿No tienes cuenta? Regístrate
            </Link>
            <div className="text-sm text-gray-600">
              <Link to="/forgot-password" className="hover:text-primary transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>


        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-white/80 text-sm">
          <p>© 2024 Wellness Mental. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}
