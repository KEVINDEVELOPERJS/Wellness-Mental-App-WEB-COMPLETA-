export interface Ejercicio {
  id: number;
  titulo: string;
  descripcion: string;
  tipo: 'RESPIRACION' | 'MEDITACION' | 'RELAJACION';
  duracionMinima: number;
  duracionMaxima: number;
  instrucciones: string;
  audioUrl?: string;
  imagenUrl?: string;
}

export interface ProgresoEjercicio {
  id: number;
  ejercicioId: number;
  usuarioId: number;
  duracionReal: number;
  completado: boolean;
  satisfaccion: number;
  fechaCompletado: string;
}

export interface ProgresoDTO {
  ejercicioId: number;
  duracionReal: number;
  completado: boolean;
  satisfaccion: number;
}
