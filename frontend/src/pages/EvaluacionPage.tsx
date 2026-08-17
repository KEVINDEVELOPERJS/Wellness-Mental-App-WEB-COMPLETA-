import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { evaluacionService } from '../services/evaluacionService';
import { useUIStore } from '../store/uiStore';
import { Cuestionario, Pregunta, Respuesta } from '../types/cuestionario';
import { Brain, Loader2, ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

export default function EvaluacionPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  
  const [cuestionarios, setCuestionarios] = useState<Cuestionario[]>([]);
  const [selectedCuestionario, setSelectedCuestionario] = useState<Cuestionario | null>(null);
  const [currentPreguntaIndex, setCurrentPreguntaIndex] = useState(0);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedView, setSelectedView] = useState<'list' | 'taking'>('list');

  useEffect(() => {
    loadCuestionarios();
  }, []);

  const loadCuestionarios = async () => {
    try {
      console.log('Loading cuestionarios...');
      const data = await evaluacionService.getCuestionarios();
      console.log('Cuestionarios loaded:', data);
      setCuestionarios(data);
    } catch (error) {
      console.error('Error loading cuestionarios:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los cuestionarios. Por favor verifica tu conexión.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startCuestionario = async (cuestionario: Cuestionario) => {
    try {
      const cuestionarioCompleto = await evaluacionService.getCuestionario(cuestionario.id);
      setSelectedCuestionario(cuestionarioCompleto);
      setCurrentPreguntaIndex(0);
      setRespuestas([]);
      setSelectedView('taking');
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo cargar el cuestionario',
      });
    }
  };

  const handleRespuesta = (valor: number) => {
    if (!selectedCuestionario) return;

    const pregunta = selectedCuestionario.preguntas[currentPreguntaIndex];
    const existingIndex = respuestas.findIndex(r => r.preguntaId === pregunta.id);

    if (existingIndex >= 0) {
      const newRespuestas = [...respuestas];
      newRespuestas[existingIndex] = { preguntaId: pregunta.id, valor };
      setRespuestas(newRespuestas);
    } else {
      setRespuestas([...respuestas, { preguntaId: pregunta.id, valor }]);
    }
  };

  const nextPregunta = () => {
    if (selectedCuestionario && currentPreguntaIndex < selectedCuestionario.preguntas.length - 1) {
      setCurrentPreguntaIndex(currentPreguntaIndex + 1);
    }
  };

  const previousPregunta = () => {
    if (currentPreguntaIndex > 0) {
      setCurrentPreguntaIndex(currentPreguntaIndex - 1);
    }
  };

  const submitEvaluacion = async () => {
    if (!selectedCuestionario) return;

    setIsSubmitting(true);
    try {
      console.log('Submitting evaluation:', { cuestionarioId: selectedCuestionario.id, respuestas });
      const resultado = await evaluacionService.guardarEvaluacion(
        selectedCuestionario.id,
        respuestas
      );
      
      console.log('Evaluation result:', resultado);
      console.log('Result ID:', resultado.id, 'Type:', typeof resultado.id);
      
      addToast({
        type: 'success',
        title: 'Evaluación completada',
        message: 'Tus resultados han sido guardados',
      });
      
      if (resultado && resultado.id && typeof resultado.id === 'number' && !isNaN(resultado.id)) {
        console.log('Navigating to result:', resultado.id);
        navigate(`/evaluacion/resultado/${resultado.id}`);
      } else {
        console.error('Invalid result:', resultado);
        addToast({
          type: 'error',
          title: 'Error',
          message: 'No se recibió un ID de resultado válido. Por favor intenta nuevamente.',
        });
        // Navigate back to evaluation list instead of breaking
        setTimeout(() => navigate('/evaluacion'), 2000);
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo guardar la evaluación. Por favor intenta nuevamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const allAnswered = selectedCuestionario && 
    respuestas.length === selectedCuestionario.preguntas.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="spinner h-12 w-12"></div>
      </div>
    );
  }

  if (selectedView === 'list') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Evaluaciones Psicológicas</h1>
          <p className="text-muted-foreground">
            Completa estos cuestionarios para evaluar tu bienestar mental
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {cuestionarios.map((cuestionario) => (
            <div
              key={cuestionario.id}
              className="bg-card rounded-xl p-6 border hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="bg-primary/10 rounded-full p-3">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs bg-secondary px-2 py-1 rounded-full">
                  {cuestionario.categoria}
                </span>
              </div>
              
              <h3 className="text-xl font-semibold mb-2">{cuestionario.titulo}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {cuestionario.descripcion}
              </p>
              
              <button
                onClick={() => startCuestionario(cuestionario)}
                className="w-full bg-primary text-white py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Comenzar Evaluación
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedCuestionario) return null;

  const currentPregunta = selectedCuestionario.preguntas[currentPreguntaIndex];
  const currentRespuesta = respuestas.find(r => r.preguntaId === currentPregunta.id);
  const progress = ((currentPreguntaIndex + 1) / selectedCuestionario.preguntas.length) * 100;

  const opciones = currentPregunta.opciones ? JSON.parse(currentPregunta.opciones) : [
    'Nunca',
    'Varios días',
    'Más de la mitad de los días',
    'Casi todos los días',
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedView('list')}
          className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Volver</span>
        </button>
        <h1 className="text-xl font-semibold">{selectedCuestionario.titulo}</h1>
        <div className="w-20" />
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Pregunta {currentPreguntaIndex + 1} de {selectedCuestionario.preguntas.length}
          </span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-card rounded-xl p-6 border">
        <h2 className="text-lg font-semibold mb-6">{currentPregunta.texto}</h2>

        <div className="space-y-3">
          {opciones.map((opcion: string, index: number) => (
            <button
              key={index}
              onClick={() => handleRespuesta(index)}
              className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                currentRespuesta?.valor === index
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  currentRespuesta?.valor === index
                    ? 'border-primary bg-primary'
                    : 'border-border'
                }`}>
                  {currentRespuesta?.valor === index && (
                    <CheckCircle className="h-3 w-3 text-white" />
                  )}
                </div>
                <span className="font-medium">{opcion}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={previousPregunta}
          disabled={currentPreguntaIndex === 0}
          className="flex items-center space-x-2 px-6 py-3 rounded-lg border hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Anterior</span>
        </button>

        {currentPreguntaIndex === selectedCuestionario.preguntas.length - 1 ? (
          <button
            onClick={submitEvaluacion}
            disabled={!allAnswered || isSubmitting}
            className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Finalizar</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={nextPregunta}
            disabled={!currentRespuesta}
            className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Instrucciones:</strong> {selectedCuestionario.instrucciones}
        </p>
      </div>
    </div>
  );
}
