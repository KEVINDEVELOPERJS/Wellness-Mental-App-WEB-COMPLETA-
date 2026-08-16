import { Server as SocketIOServer, Socket } from 'socket.io';

export class SocketService {
  private static io: SocketIOServer;
  private static connectedUsers: Map<number, Socket> = new Map();
  private static connectedPsychologists: Set<Socket> = new Set();

  static initialize(io: SocketIOServer): void {
    this.io = io;

    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected:', socket.id);

      socket.on('authenticate', (data: { userId: number; role: string }) => {
        if (data.role === 'PSICOLOGO') {
          this.connectedPsychologists.add(socket);
        } else {
          this.connectedUsers.set(data.userId, socket);
        }
        socket.join(`user-${data.userId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        this.connectedPsychologists.delete(socket);
        
        // Remove from connected users
        for (const [userId, userSocket] of this.connectedUsers.entries()) {
          if (userSocket.id === socket.id) {
            this.connectedUsers.delete(userId);
            break;
          }
        }
      });
    });
  }

  static sendToUser(userId: number, event: string, data: any): void {
    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  static sendToPsychologists(event: string, data: any): void {
    this.connectedPsychologists.forEach(socket => {
      socket.emit(event, data);
    });
  }

  static broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }

  static getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  static getConnectedPsychologistsCount(): number {
    return this.connectedPsychologists.size;
  }
}
