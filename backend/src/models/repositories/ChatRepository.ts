import prisma from '../../config/database';
import { ChatSession, MensajeChat, ChatMessageDTO } from '../entities/ChatSession';
import { EncryptionService } from '../../services/EncryptionService';

export class ChatRepository {
  static async createSession(usuarioId: number): Promise<ChatSession> {
    return prisma.chatSession.create({
      data: {
        usuarioId,
        activa: true,
      },
    });
  }

  static async getSessionById(id: number): Promise<ChatSession | null> {
    return prisma.chatSession.findUnique({
      where: { id },
    });
  }

  static async getActiveSessionByUsuario(usuarioId: number): Promise<ChatSession | null> {
    return prisma.chatSession.findFirst({
      where: {
        usuarioId,
        activa: true,
      },
      orderBy: { fechaInicio: 'desc' },
    });
  }

  static async closeSession(id: number): Promise<void> {
    await prisma.chatSession.update({
      where: { id },
      data: { activa: false },
    });
  }

  static async addMensaje(mensaje: ChatMessageDTO, remitente: string): Promise<MensajeChat> {
    const contenidoEncriptado = EncryptionService.encrypt(mensaje.contenido);
    
    const mensajeCreado = await prisma.mensajeChat.create({
      data: {
        chatSessionId: mensaje.chatSessionId || 0,
        remitente,
        contenido: contenidoEncriptado,
      },
    });

    // Update session last message time
    if (mensaje.chatSessionId) {
      await prisma.chatSession.update({
        where: { id: mensaje.chatSessionId },
        data: { fechaUltimoMensaje: new Date() },
      });
    }

    return mensajeCreado;
  }

  static async getMensajesBySession(chatSessionId: number, limit: number = 10): Promise<MensajeChat[]> {
    const mensajes = await prisma.mensajeChat.findMany({
      where: { chatSessionId },
      orderBy: { fechaMensaje: 'desc' },
      take: limit,
    });

    // Decrypt messages
    return mensajes.map(m => ({
      ...m,
      contenido: EncryptionService.decrypt(m.contenido),
    }));
  }

  static async getRecentMessages(usuarioId: number, limit: number = 10): Promise<MensajeChat[]> {
    const session = await this.getActiveSessionByUsuario(usuarioId);
    if (!session) return [];

    return this.getMensajesBySession(session.id, limit);
  }

  static async getChatHistory(usuarioId: number): Promise<ChatSession[]> {
    return prisma.chatSession.findMany({
      where: { usuarioId },
      include: {
        mensajes: {
          orderBy: { fechaMensaje: 'asc' },
          take: 50,
        },
      },
      orderBy: { fechaInicio: 'desc' },
    });
  }
}
