import { useState } from 'react';
import { informeService } from '../services/informeService';
import { useUIStore } from '../store/uiStore';
import { 
  FileText, 
  Download, 
  Shield, 
  Lock, 
  Loader2,
  CheckCircle,
  XCircle,
  Mail
} from 'lucide-react';

export default function InformePadresPage() {
  const { addToast } = useUIStore();
  const [token, setToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [informe, setInforme] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [show2FA, setShow2FA] = useState(false);

  const verifyToken = async () => {
    if (!token.trim()) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Ingresa el token de acceso',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const data = await informeService.getInforme(token);
      setInforme(data);
      setIsVerified(true);
      
      addToast({
        type: 'success',
        title: 'Token verificado',
        message: 'Informe cargado exitosamente',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Token inválido o expirado',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const validate2FA = async () => {
    if (twoFactorCode.length !== 6) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Ingresa el código de 6 dígitos',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await informeService.validar2FA(twoFactorCode);
      if (result.valido) {
        setShow2FA(false);
        addToast({
          type: 'success',
          title: '2FA validado',
          message: 'Puedes acceder al informe',
        });
      } else {
        addToast({
          type: 'error',
          title: 'Error',
          message: 'Código inválido',
        });
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo validar el código',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const blob = await informeService.getInformePDF(token);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `informe-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      addToast({
        type: 'success',
        title: 'PDF descargado',
        message: 'El informe ha sido descargado exitosamente',
      });
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo descargar el PDF',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const contactPsychologist = () => {
    const subject = encodeURIComponent('Consulta sobre informe de bienestar');
    const body = encodeURIComponent(
      'Hola, me gustaría consultar sobre el informe de bienestar de mi hijo/a.'
    );
    window.location.href = `mailto:psicologo@wellness.com?subject=${subject}&body=${body}`;
  };

  if (!isVerified) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center">
          <FileText className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Informe de Bienestar</h1>
          <p className="text-muted-foreground">
            Ingresa el token de acceso proporcionado por el psicólogo
          </p>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Token de Acceso</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Ingresa el token de 64 caracteres"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
              />
            </div>

            <button
              onClick={verifyToken}
              disabled={isVerifying}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  <span>Verificar Token</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Lock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800">
                <strong>Seguridad:</strong> Este informe contiene información sensible. 
                El token de acceso es válido por 24 horas y requiere autenticación de dos factores.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (show2FA) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Autenticación de Dos Factores</h1>
          <p className="text-muted-foreground">
            Ingresa el código de tu aplicación autenticadora
          </p>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Código de 6 dígitos</label>
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
                maxLength={6}
                placeholder="000000"
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-center text-2xl tracking-widest"
              />
            </div>

            <button
              onClick={validate2FA}
              disabled={isLoading}
              className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Validando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>Validar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Informe de Bienestar</h1>
          <p className="text-muted-foreground">
            Generado el {new Date(informe?.fechaEnvio).toLocaleDateString('es-ES')}
          </p>
        </div>
        <button
          onClick={downloadPDF}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Download className="h-5 w-5" />
          )}
          <span>Descargar PDF</span>
        </button>
      </div>

      {/* Risk Level */}
      <div className={`rounded-2xl p-6 text-white ${
        informe?.nivelRiesgo === 'ALTO' ? 'bg-red-500' :
        informe?.nivelRiesgo === 'MEDIO' ? 'bg-yellow-500' : 'bg-green-500'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Nivel de Riesgo: {informe?.nivelRiesgo}</h2>
            <p className="text-white/90 mt-1">Evaluación de bienestar estudiantil</p>
          </div>
          <div className="text-4xl">
            {informe?.nivelRiesgo === 'ALTO' ? '🔴' :
             informe?.nivelRiesgo === 'MEDIO' ? '🟡' : '🟢'}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-card rounded-xl p-6 border">
        <h3 className="text-lg font-semibold mb-4">Resumen</h3>
        <p className="text-muted-foreground leading-relaxed">{informe?.resumen}</p>
      </div>

      {/* Recommendations */}
      <div className="bg-card rounded-xl p-6 border">
        <h3 className="text-lg font-semibold mb-4">Recomendaciones</h3>
        <div className="prose prose-sm max-w-none text-muted-foreground">
          {informe?.recomendaciones}
        </div>
      </div>

      {/* Trends */}
      <div className="bg-card rounded-xl p-6 border">
        <h3 className="text-lg font-semibold mb-4">Tendencias (Últimos 3 Meses)</h3>
        <div className="h-64 bg-secondary rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">Gráfico de tendencias aparecería aquí</p>
        </div>
      </div>

      {/* App Usage */}
      <div className="bg-card rounded-xl p-6 border">
        <h3 className="text-lg font-semibold mb-4">Uso de la Aplicación</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <UsageStat label="Ejercicios" value={informe?.appUsage?.exercises || 0} />
          <UsageStat label="Chats" value={informe?.appUsage?.chats || 0} />
          <UsageStat label="Evaluaciones" value={informe?.appUsage?.evaluations || 0} />
          <UsageStat label="Días activos" value={informe?.appUsage?.activeDays || 0} />
        </div>
      </div>

      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={contactPsychologist}
          className="flex items-center justify-center space-x-2 p-4 bg-card rounded-xl border hover:shadow-lg transition-all"
        >
          <Mail className="h-5 w-5 text-primary" />
          <span className="font-medium">Contactar Psicólogo</span>
        </button>
        
        <button
          onClick={() => setShow2FA(true)}
          className="flex items-center justify-center space-x-2 p-4 bg-card rounded-xl border hover:shadow-lg transition-all"
        >
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-medium">Verificar 2FA</span>
        </button>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs text-gray-600">
          <strong>Aviso:</strong> Este informe es confidencial y está destinado exclusivamente para los padres/tutores del estudiante. 
          La información presentada no constituye un diagnóstico médico y debe ser utilizada como referencia para discusiones con profesionales de salud mental.
        </p>
      </div>
    </div>
  );
}

function UsageStat({ label, value }: any) {
  return (
    <div className="text-center p-4 bg-secondary rounded-lg">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
