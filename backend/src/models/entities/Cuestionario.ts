import { NivelRiesgo } from '@prisma/client';

export interface Cuestionario {
  id: number;
  titulo: string;
  descripcion: string;
  instrucciones: string;
  categoria: string;
  estado: string;
  autorId?: number;
  fechaCreacion: Date;
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
  id: number;
  preguntaId: number;
  usuarioId: number;
  valor: number;
  texto?: string;
  fechaRespuesta: Date;
}

export interface Resultado {
  id: number;
  cuestionarioId: number;
  usuarioId: number;
  puntaje: number;
  nivelRiesgo: NivelRiesgo;
  prediagnostico: string;
  fechaEvaluacion: Date;
}

export interface RespuestaDTO {
  preguntaId: number;
  valor: number;
  texto?: string;
}

export interface CuestionarioCompleto extends Cuestionario {
  preguntas: Pregunta[];
}
