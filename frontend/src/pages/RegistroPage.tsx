import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { useUIStore } from '../store/uiStore';
import { Brain, Loader2, Check, X } from 'lucide-react';

export default function RegistroPage() {
  const navigate = useNavigate();
  const { setAuth, setLoading } = useAuthStore();
  const { addToast } = useUIStore();
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    edad: '',
    grado: '',
    telefono: '',
    rol: 'ESTUDIANTE',
    codigoVerificacion: '',
  });
  
  const [validations, setValidations] = useState({
    emailValid: null as boolean | null,
    ageValid: null as boolean | null,
    passwordStrong: false,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [consentimiento, setConsentimiento] = useState(false);
  const [showPsicologoFields, setShowPsicologoFields] = useState(false);

  const validateEmail = async (email: string) => {
    if (email.length < 3) return;
    
    try {
      const result = await authService.validateEmail(email);
      setValidations(prev => ({ ...prev, emailValid: result.unico }));
    } catch (error) {
      setValidations(prev => ({ ...prev, emailValid: false }));
    }
  };

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasMinLength = password.length >= 8;
    
    const isStrong = hasUpperCase && hasLowerCase && hasNumber && hasMinLength;
    setValidations(prev => ({ ...prev, passwordStrong: isStrong }));
    
    return isStrong;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      addToast({
        type: 'error',
        title: 'Error de validación',
        message: 'Las contraseñas no coinciden',
      });
      return;
    }

    if (!validatePassword(formData.password)) {
      addToast({
        type: 'error',
        title: 'Contraseña débil',
        message: 'La contraseña debe tener mayúsculas, minúsculas y números',
      });
      return;
    }

    if (validations.emailValid === false) {
      addToast({
        type: 'error',
        title: 'Email no disponible',
        message: 'Este correo ya está registrado',
      });
      return;
    }

    // Validación específica para psicólogos
    if (formData.rol === 'PSICOLOGO') {
      if (formData.codigoVerificacion !== 'Wellness-Psicologo') {
        addToast({
          type: 'error',
          title: 'Código de verificación incorrecto',
          message: 'El código de verificación para psicólogos no es válido. Usa: Wellness-Psicologo',
        });
        return;
      }
    } else {
      // Validaciones para estudiantes
      const edad = parseInt(formData.edad);
      if (edad < 13 || edad > 18) {
        addToast({
          type: 'error',
          title: 'Edad no válida',
          message: 'Debes tener entre 13 y 18 años',
        });
        return;
      }

      if (edad < 16 && !consentimiento) {
        addToast({
          type: 'error',
          title: 'Consentimiento requerido',
          message: 'Se requiere consentimiento parental para menores de 16 años',
        });
        return;
      }
    }

    setIsLoading(true);
    setLoading(true);

    try {
      const response = await authService.register({
        nombre: formData.nombre,
        email: formData.email,
        password: formData.password,
        edad: formData.rol === 'PSICOLOGO' ? 25 : parseInt(formData.edad), // Edad diferente para psicólogos
        grado: formData.rol === 'PSICOLOGO' ? 'PROFESIONAL' : formData.grado,
        telefono: formData.telefono || undefined,
        rol: formData.rol as 'ESTUDIANTE' | 'PSICOLOGO',
        codigoVerificacion: formData.codigoVerificacion,
      });
      
      setAuth(response.usuario, response.accessToken, response.refreshToken);
      
      addToast({
        type: 'success',
        title: 'Registro exitoso',
        message: `Bienvenido, ${response.usuario.nombre}`,
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error de registro',
        message: error.response?.data?.error || 'No se pudo completar el registro',
      });
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'email') {
      validateEmail(value);
    }
    
    if (name === 'password') {
      validatePassword(value);
    }
  };

  return (
    <div className="min-h-screen gradient-wellness flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary rounded-full p-4">
                <Brain className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Crear Cuenta</h1>
            <p className="text-gray-600 mt-2">Únete a Wellness Mental</p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Rol Selection */}
            <div>
              <label htmlFor="rol" className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Registro
              </label>
              <select
                id="rol"
                name="rol"
                value={formData.rol}
                onChange={(e) => {
                  handleChange(e);
                  setShowPsicologoFields(e.target.value === 'PSICOLOGO');
                }}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors bg-white"
              >
                <option value="ESTUDIANTE">👨‍🎓 Estudiante (13-18 años)</option>
                <option value="PSICOLOGO">👨‍⚕️ Psicólogo (Profesional)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.rol === 'PSICOLOGO' 
                  ? 'Registro para profesionales de la salud mental' 
                  : 'Registro para estudiantes de secundaria'}
              </p>
            </div>

            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={formData.nombre}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="Tu nombre"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={(e) => validateEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors pr-10"
                  placeholder="tu@email.com"
                />
                {validations.emailValid !== null && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {validations.emailValid ? (
                      <Check className="h-5 w-5 text-green-500" />
                    ) : (
                      <X className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                )}
              </div>
              {validations.emailValid === false && (
                <p className="text-sm text-red-600 mt-1">Este correo ya está registrado</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="••••••••"
              />
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-600">La contraseña debe contener:</p>
                <div className="flex items-center space-x-2 text-xs">
                  <span className={formData.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                    {formData.password.length >= 8 ? '✓' : '○'} Mínimo 8 caracteres
                  </span>
                  <span className={/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                    {/[A-Z]/.test(formData.password) ? '✓' : '○'} Mayúscula
                  </span>
                  <span className={/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                    {/[a-z]/.test(formData.password) ? '✓' : '○'} Minúscula
                  </span>
                  <span className={/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}>
                    {/\d/.test(formData.password) ? '✓' : '○'} Número
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="••••••••"
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">Las contraseñas no coinciden</p>
              )}
            </div>

            {/* Campos específicos para estudiantes */}
            {formData.rol === 'ESTUDIANTE' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edad" className="block text-sm font-medium text-gray-700 mb-2">
                    Edad
                  </label>
                  <input
                    id="edad"
                    name="edad"
                    type="number"
                    min="13"
                    max="18"
                    value={formData.edad}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                    placeholder="13-18"
                  />
                </div>

                <div>
                  <label htmlFor="grado" className="block text-sm font-medium text-gray-700 mb-2">
                    Grado
                  </label>
                  <select
                    id="grado"
                    name="grado"
                    value={formData.grado}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  >
                    <option value="">Seleccionar</option>
                    <option value="1° Secundaria">1° Secundaria</option>
                    <option value="2° Secundaria">2° Secundaria</option>
                    <option value="3° Secundaria">3° Secundaria</option>
                    <option value="4° Secundaria">4° Secundaria</option>
                    <option value="5° Secundaria">5° Secundaria</option>
                    <option value="6° Secundaria">6° Secundaria</option>
                  </select>
                </div>
              </div>
            )}

            {/* Campos específicos para psicólogos */}
            {showPsicologoFields && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div>
                  <label htmlFor="codigoVerificacion" className="block text-sm font-medium text-gray-700 mb-2">
                    🔐 Código de Verificación del Personal
                  </label>
                  <input
                    id="codigoVerificacion"
                    name="codigoVerificacion"
                    type="password"
                    value={formData.codigoVerificacion}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
                    placeholder="Ingresa el código de verificación"
                  />
                  <p className="text-xs text-blue-600 mt-1">
                    💡 Código requerido: <strong>Wellness-Psicologo</strong>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Este código verifica que eres un profesional de la salud mental autorizado
                  </p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono (opcional)
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                value={formData.telefono}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="+54 11 1234-5678"
              />
            </div>

            {parseInt(formData.edad) < 16 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={consentimiento}
                    onChange={(e) => setConsentimiento(e.target.checked)}
                    required
                    className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <span className="text-sm text-yellow-800">
                    Confirmo que tengo el consentimiento de mis padres/tutores para usar esta aplicación.
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || validations.emailValid === false}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <span>Crear Cuenta</span>
              )}
            </button>
          </form>

          {/* Links */}
          <div className="text-center">
            <Link
              to="/login"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              ¿Ya tienes cuenta? Inicia Sesión
            </Link>
          </div>

          {/* Privacy Notice */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">
              <strong>Privacidad:</strong> Tu información está protegida. Solo compartiremos datos con
              profesionales de salud mental cuando sea necesario para tu bienestar.
            </p>
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
