export interface AlertaRiesgo {
  id: number;
  estudianteId: number;
  estudiante?: {
    id: number;
    nombre: string;
    email: string;
  };
  tipo: string;
  nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO';
  timestamp: string;
  extracto: string;
  estado: 'PENDIENTE' | 'ATENDIDA' | 'EN_SEGUIMIENTO' | 'DERIVADA';
  notas?: string;
  resultadoId?: number;
  chatSessionId?: number;
  ipOrigen?: string;
  userAgent?: string;
  evaluacion?: {
    puntaje: number;
    prediagnostico?: string;
  };
  resultado?: {
    id: number;
    puntaje: number;
    prediagnostico: string;
    nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO';
    fechaEvaluacion: string;
    cuestionario?: {
      titulo: string;
    };
  };
}

export interface AuditoriaAlerta {
  id: number;
  alertaId: number;
  accion: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
  detalles?: string;
}

export type EstadoAlerta = 'PENDIENTE' | 'ATENDIDA' | 'EN_SEGUIMIENTO' | 'DERIVADA';
export type NivelRiesgo = 'BAJO' | 'MEDIO' | 'ALTO';
