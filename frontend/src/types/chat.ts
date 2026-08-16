export interface ChatSession {
  id: number;
  usuarioId: number;
  fechaInicio: string;
  fechaUltimoMensaje?: string;
  activa: boolean;
}

export interface MensajeChat {
  id: number;
  chatSessionId: number;
  remitente: 'usuario' | 'ia';
  contenido: string;
  sentimiento?: number;
  fechaMensaje: string;
}

export interface ChatMessageDTO {
  contenido: string;
  chatSessionId?: number;
}

export interface ChatResponse {
  mensaje: MensajeChat;
  sentimientoUsuario: number;
  requiereAlerta: boolean;
}
