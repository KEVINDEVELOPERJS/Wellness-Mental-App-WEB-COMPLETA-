import { NivelRiesgo, EstadoInforme } from '@prisma/client';

export interface Informe {
  id: number;
  resultadoId: number;
  padreId?: number;
  psicologoId?: number;
  resumen: string;
  detalle: string;
  recomendaciones: string;
  nivelRiesgo: NivelRiesgo;
  fechaEnvio: Date;
  estadoLectura: EstadoInforme;
  hashSeguridad: string;
  tokenAcceso: string;
  expiracionToken?: Date;
}

export interface InformeDTO {
  resultadoId: number;
  padreId?: number;
  psicologoId?: number;
}
