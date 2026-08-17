export interface Cuestionario {
  id: number;
  titulo: string;
  descripcion: string;
  instrucciones: string;
  categoria: string;
  estado: string;
  autorId?: number;
  fechaCreacion: string;
}

export interface Pregunta {
  id: number;
  cuestionarioId: number;
  texto: string;
  tipoRespuesta: string;
  peso: number;
  orden: number;
  opciones?: string;
}

export interface Respuesta {
  preguntaId: number;
  valor: number;
  texto?: string;
}

export interface Resultado {
  id: number;
  cuestionarioId: number;
  usuarioId: number;
  puntaje: number;
  nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO';
  prediagnostico: string;
  fechaEvaluacion: string;
}

export type NivelRiesgo = 'BAJO' | 'MEDIO' | 'ALTO';
