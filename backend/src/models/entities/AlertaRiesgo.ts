import { EstadoAlerta, NivelRiesgo } from '@prisma/client';

export interface AlertaRiesgo {
  id: number;
  usuarioId: number;
  tipo: string;
  nivelRiesgo: NivelRiesgo;
  timestamp: Date;
  extracto: string;
  estado: EstadoAlerta;
  notas?: string;
  resultadoId?: number;
  chatSessionId?: number;
  ipOrigen?: string;
  userAgent?: string;
}

export interface AuditoriaAlerta {
  id: number;
  alertaId: number;
  accion: string;
  timestamp: Date;
  ip?: string;
  userAgent?: string;
  detalles?: string;
}

export interface AlertaDTO {
  usuarioId: number;
  tipo: string;
  nivelRiesgo: NivelRiesgo;
  extracto: string;
  resultadoId?: number;
  chatSessionId?: number;
}
