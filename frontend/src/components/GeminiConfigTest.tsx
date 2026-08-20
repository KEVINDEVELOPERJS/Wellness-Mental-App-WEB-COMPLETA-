import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import apiClient from '../services/apiClient';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface ConfigStatus {
  configured: boolean;
  keyLength: number;
  keyPrefix: string;
  nodeEnv: string;
  allEnvVars: string[];
}

export default function GeminiConfigTest() {
  const { isAuthenticated } = useAuthStore();
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testConfig = async () => {
    if (!isAuthenticated) {
      setError('Debes iniciar sesión para probar la configuración');
      return;
    }

    setIsLoading(true);
    setError(null);
    setConfigStatus(null);

    try {
      const response = await apiClient.get<ConfigStatus>('/chat/test-gemini-config');
      setConfigStatus(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al probar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <p className="text-yellow-800">Debes iniciar sesión para probar la configuración de Gemini</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 border space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Prueba de Configuración Gemini</h3>
        <button
          onClick={testConfig}
          disabled={isLoading}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Probando...</span>
            </>
          ) : (
            <span>Probar Configuración</span>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {configStatus && (
        <div className="space-y-3">
          <div className={`flex items-center space-x-2 ${configStatus.configured ? 'text-green-600' : 'text-red-600'}`}>
            {configStatus.configured ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="font-medium">
              {configStatus.configured ? 'API Key Configurada' : 'API Key No Configurada'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Longitud de la key:</span>
              <span className="ml-2 font-medium">{configStatus.keyLength}</span>
            </div>
            <div>
              <span className="text-gray-600">Prefijo:</span>
              <span className="ml-2 font-medium">{configStatus.keyPrefix}</span>
            </div>
            <div>
              <span className="text-gray-600">Entorno:</span>
              <span className="ml-2 font-medium">{configStatus.nodeEnv}</span>
            </div>
            <div>
              <span className="text-gray-600">Variables API:</span>
              <span className="ml-2 font-medium">{configStatus.allEnvVars.length}</span>
            </div>
          </div>

          {!configStatus.configured && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Acción requerida:</strong> La API key de Gemini no está configurada en las variables de entorno.
                Por favor configura la variable <code className="bg-yellow-100 px-1 rounded">GEMINI_API_KEY</code> en Render.
              </p>
            </div>
          )}

          {configStatus.configured && configStatus.keyLength < 30 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Advertencia:</strong> La API key parece tener una longitud inusual. 
                Las API keys de Gemini normalmente tienen 39 caracteres.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}