import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { cuestionarioService } from '../services/cuestionarioService';
import { Plus, Trash2, Save, ChevronUp, ChevronDown } from 'lucide-react';

interface Pregunta {
  id: number;
  texto: string;
  tipo: 'LIKERT' | 'ABIERTA' | 'OPCION_MULTIPLE';
  opciones?: string[];
  peso: number;
}

interface CuestionarioData {
  titulo: string;
  descripcion: string;
  categoria: string;
  preguntas: Pregunta[];
}

export default function CrearCuestionarioPage() {
  const navigate = useNavigate();
  const { addToast } = useUIStore();
  
  const [formData, setFormData] = useState<CuestionarioData>({
    titulo: '',
    descripcion: '',
    categoria: '',
    preguntas: [],
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [nuevaPregunta, setNuevaPregunta] = useState<Pregunta>({
    id: 0,
    texto: '',
    tipo: 'LIKERT',
    peso: 1,
  });

  const agregarPregunta = () => {
    if (!nuevaPregunta.texto.trim()) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'La pregunta no puede estar vacía',
      });
      return;
    }

    const preguntaConId = {
      ...nuevaPregunta,
      id: Date.now(),
    };

    setFormData(prev => ({
      ...prev,
      preguntas: [...prev.preguntas, preguntaConId],
    }));

    setNuevaPregunta({
      id: 0,
      texto: '',
      tipo: 'LIKERT',
      peso: 1,
    });
  };

  const eliminarPregunta = (id: number) => {
    setFormData(prev => ({
      ...prev,
      preguntas: prev.preguntas.filter(p => p.id !== id),
    }));
  };

  const moverPregunta = (index: number, direccion: 'arriba' | 'abajo') => {
    const preguntas = [...formData.preguntas];
    const newIndex = direccion === 'arriba' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= preguntas.length) return;
    
    [preguntas[index], preguntas[newIndex]] = [preguntas[newIndex], preguntas[index]];
    
    setFormData(prev => ({ ...prev, preguntas }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.preguntas.length === 0) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'El cuestionario debe tener al menos una pregunta',
      });
      return;
    }

    setIsLoading(true);

    try {
      await cuestionarioService.createCuestionario(formData);
      
      addToast({
        type: 'success',
        title: 'Cuestionario creado',
        message: 'El cuestionario ha sido creado exitosamente',
      });
      
      navigate('/dashboard-psicologo');
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'No se pudo crear el cuestionario',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Crear Cuestionario</h1>
        <p className="text-muted-foreground">
          Diseña un nuevo cuestionario de evaluación psicológica
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-card rounded-xl p-6 border space-y-4">
          <h2 className="text-xl font-semibold">Información Básica</h2>
          
          <div>
            <label htmlFor="titulo" className="block text-sm font-medium mb-2">
              Título del Cuestionario
            </label>
            <input
              id="titulo"
              type="text"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ej: Escala de Ansiedad GAD-7"
            />
          </div>

          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium mb-2">
              Descripción
            </label>
            <textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              required
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Describe el propósito y alcance del cuestionario"
            />
          </div>

          <div>
            <label htmlFor="categoria" className="block text-sm font-medium mb-2">
              Categoría
            </label>
            <select
              id="categoria"
              value={formData.categoria}
              onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="">Seleccionar categoría</option>
              <option value="ANSIEDAD">Ansiedad</option>
              <option value="DEPRESION">Depresión</option>
              <option value="ESTRES">Estrés</option>
              <option value="BIENESTAR">Bienestar General</option>
              <option value="AUTOESTIMA">Autoestima</option>
              <option value="SUEÑO">Sueño</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
        </div>

        {/* Add Question */}
        <div className="bg-card rounded-xl p-6 border space-y-4">
          <h2 className="text-xl font-semibold">Agregar Pregunta</h2>
          
          <div>
            <label htmlFor="preguntaTexto" className="block text-sm font-medium mb-2">
              Texto de la Pregunta
            </label>
            <input
              id="preguntaTexto"
              type="text"
              value={nuevaPregunta.texto}
              onChange={(e) => setNuevaPregunta(prev => ({ ...prev, texto: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Ej: ¿Con qué frecuencia te sientes nervioso/a?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="tipoPregunta" className="block text-sm font-medium mb-2">
                Tipo de Respuesta
              </label>
              <select
                id="tipoPregunta"
                value={nuevaPregunta.tipo}
                onChange={(e) => setNuevaPregunta(prev => ({ ...prev, tipo: e.target.value as any }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="LIKERT">Escala Likert (1-5)</option>
                <option value="ABIERTA">Respuesta Abierta</option>
                <option value="OPCION_MULTIPLE">Opción Múltiple</option>
              </select>
            </div>

            <div>
              <label htmlFor="peso" className="block text-sm font-medium mb-2">
                Peso en el cálculo
              </label>
              <input
                id="peso"
                type="number"
                min="1"
                max="10"
                value={nuevaPregunta.peso}
                onChange={(e) => setNuevaPregunta(prev => ({ ...prev, peso: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={agregarPregunta}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Agregar Pregunta</span>
          </button>
        </div>

        {/* Questions List */}
        {formData.preguntas.length > 0 && (
          <div className="bg-card rounded-xl p-6 border space-y-4">
            <h2 className="text-xl font-semibold">Preguntas ({formData.preguntas.length})</h2>
            
            <div className="space-y-3">
              {formData.preguntas.map((pregunta, index) => (
                <div key={pregunta.id} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                          {pregunta.tipo}
                        </span>
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                          Peso: {pregunta.peso}
                        </span>
                      </div>
                      <p className="font-medium">{pregunta.texto}</p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => moverPregunta(index, 'arriba')}
                        disabled={index === 0}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moverPregunta(index, 'abajo')}
                        disabled={index === formData.preguntas.length - 1}
                        className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminarPregunta(pregunta.id)}
                        className="p-1 hover:bg-red-100 text-red-600 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard-psicologo')}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || formData.preguntas.length === 0}
            className="flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            <span>{isLoading ? 'Guardando...' : 'Guardar Cuestionario'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}