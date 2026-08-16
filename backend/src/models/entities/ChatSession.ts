export interface ChatSession {
  id: number;
  usuarioId: number;
  fechaInicio: Date;
  fechaUltimoMensaje?: Date;
  activa: boolean;
}

export interface MensajeChat {
  id: number;
  chatSessionId: number;
  remitente: string;
  contenido: string;
  sentimiento?: number;
  fechaMensaje: Date;
}

export interface ChatMessageDTO {
  contenido: string;
  chatSessionId?: number;
}

export interface SentimentScore {
  score: number;
  requiresAlert: boolean;
}
