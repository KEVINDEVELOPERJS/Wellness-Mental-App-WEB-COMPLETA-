import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { evaluacionService } from '../services/evaluacionService';
import { useUIStore } from '../store/uiStore';
import { Resultado } from '../types/cuestionario';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Share2, 
  Download,
  ArrowLeft,
  Calendar,
  TrendingUp
} from 'lucide-react';

export default function ResultadoEvaluacionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadResultado(parseInt(id));
    }
  }, [id]);

  const loadResultado = async (resultadoId: number) => {
    try {
      const data = await evaluacionService.getResultado(resultadoId);
      setResultado(data);
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo cargar el resultado',
      });
      navigate('/evaluacion');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (nivel: string) => {
    switch (nivel) {
      case 'BAJO': return 'bg-green-500';
      case 'MEDIO': return 'bg-yellow-500';
      case 'ALTO': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getRiskIcon = (nivel: string) => {
    switch (nivel) {
      case 'BAJO': return CheckCircle;
      case 'MEDIO': return AlertTriangle;
      case 'ALTO': return XCircle;
      default: return AlertTriangle;
    }
  };

  const getRiskText = (nivel: string) => {
    switch (nivel) {
      case 'BAJO': return 'Nivel de Riesgo Bajo';
      case 'MEDIO': return 'Nivel de Riesgo Medio';
      case 'ALTO': return 'Nivel de Riesgo Alto';
      default: return 'Nivel de Riesgo Desconocido';
    }
  };

  const getRecommendations = (nivel: string) => {
    switch (nivel) {
      case 'BAJO':
        return [
          'Continúa con tus hábitos saludables actuales',
          'Mantén una rutina regular de ejercicio',
          'Practica técnicas de relajación cuando lo necesites',
          'Mantén comunicación con familia y amigos',
        ];
      case 'MEDIO':
        return [
          'Considera aumentar la frecuencia de ejercicios de respiración',
          'Establece una rutina de sueño consistente',
          'Limita el tiempo de pantallas antes de dormir',
          'Practica mindfulness regularmente',
          'Considera hablar con un consejero si los síntomas persisten',
        ];
      case 'ALTO':
        return [
          'Se recomienda consultar con un profesional de salud mental',
          'Contacta al psicólogo escolar lo antes posible',
          'Crea un ambiente de apoyo en el hogar',
          'No dudes en pedir ayuda a adultos de confianza',
          'Considera terapia profesional',
        ];
      default:
        return [];
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner h-12 w-12"></div>
      </div>
    );
  }

  if (!resultado) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No se encontró el resultado</p>
        <button
          onClick={() => navigate('/evaluacion')}
          className="mt-4 text-primary hover:underline"
        >
          Volver a evaluaciones
        </button>
      </div>
    );
  }

  const RiskIcon = getRiskIcon(resultado.nivelRiesgo);
  const riskColor = getRiskColor(resultado.nivelRiesgo);
  const recommendations = getRecommendations(resultado.nivelRiesgo);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/evaluacion')}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Resultados de Evaluación</h1>
          <p className="text-muted-foreground">
            Completada el {new Date(resultado.fechaEvaluacion).toLocaleDateString('es-ES')}
          </p>
        </div>
      </div>

      {/* Risk Level Card */}
      <div className={`${riskColor} rounded-2xl p-8 text-white text-center`}>
        <div className="flex justify-center mb-4">
          <div className="bg-white/20 rounded-full p-4">
            <RiskIcon className="h-16 w-16" />
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-2">{getRiskText(resultado.nivelRiesgo)}</h2>
        <p className="text-white/90 text-lg">
          Puntaje: {resultado.puntaje}
        </p>
      </div>

      {/* Diagnosis */}
      <div className="bg-card rounded-xl p-6 border">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <span>Prediagnóstico</span>
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          {resultado.prediagnostico}
        </p>
      </div>

      {/* Recommendations */}
      <div className="bg-card rounded-xl p-6 border">
        <h3 className="text-lg font-semibold mb-4">Recomendaciones</h3>
        <ul className="space-y-3">
          {recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/ejercicios')}
          className="flex items-center justify-center space-x-2 p-4 bg-card rounded-xl border hover:shadow-lg transition-all"
        >
          <TrendingUp className="h-5 w-5 text-primary" />
          <span className="font-medium">Ver Ejercicios</span>
        </button>
        
        <button
          onClick={() => navigate('/chat-ia')}
          className="flex items-center justify-center space-x-2 p-4 bg-card rounded-xl border hover:shadow-lg transition-all"
        >
          <Share2 className="h-5 w-5 text-primary" />
          <span className="font-medium">Hablar con Asistente</span>
        </button>
      </div>

      {/* Important Notice */}
      {resultado.nivelRiesgo === 'ALTO' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-red-100 rounded-full p-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h4 className="font-semibold text-red-900 mb-2">Importante</h4>
              <p className="text-sm text-red-800">
                Estos resultados indican que podrías beneficiarte de apoyo profesional. 
                No estás solo/a - hay recursos disponibles para ayudarte. 
                Por favor considera hablar con un consejero escolar, psicólogo, o adulto de confianza.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs text-gray-600">
          <strong>Aviso:</strong> Esta evaluación es solo para fines informativos y no constituye un diagnóstico médico. 
          Si estás experimentando dificultades significativas, por favor consulta con un profesional de salud mental calificado.
        </p>
      </div>
    </div>
  );
}
