import prisma from '../../config/database';
import { Usuario, UsuarioDTO } from '../entities/Usuario';
import { HashService } from '../../services/HashService';
import { EncryptionService } from '../../services/EncryptionService';

export class UsuarioRepository {
  static async create(usuarioDTO: UsuarioDTO): Promise<Usuario> {
    const passwordHash = await HashService.hashPassword(usuarioDTO.password);
    
    return prisma.usuario.create({
      data: {
        nombre: usuarioDTO.nombre,
        email: usuarioDTO.email,
        passwordHash,
        edad: usuarioDTO.edad,
        grado: usuarioDTO.grado,
        telefono: usuarioDTO.telefono,
        rol: usuarioDTO.rol || 'ESTUDIANTE',
        estado: 'ACTIVO',
        consentimientoPadres: usuarioDTO.rol === 'ESTUDIANTE' && usuarioDTO.edad < 16,
      },
    });
  }

  static async findById(id: number): Promise<Usuario | null> {
    return prisma.usuario.findUnique({
      where: { id },
    });
  }

  static async findByEmail(email: string): Promise<Usuario | null> {
    return prisma.usuario.findUnique({
      where: { email },
    });
  }

  static async validateEmailUnique(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user === null;
  }

  static async validateAge(edad: number, rol: string = 'ESTUDIANTE'): Promise<boolean> {
    if (rol === 'PSICOLOGO') {
      return edad >= 21 && edad <= 100; // Psicólogos adultos
    }
    return edad >= 13 && edad <= 18; // Estudiantes adolescentes
  }

  static async updatePassword(id: number, newPassword: string): Promise<void> {
    const passwordHash = await HashService.hashPassword(newPassword);
    await prisma.usuario.update({
      where: { id },
      data: { passwordHash },
    });
  }

  static async updateProfile(id: number, data: Partial<Usuario>): Promise<Usuario> {
    return prisma.usuario.update({
      where: { id },
      data,
    });
  }

  static async generateInvitationCode(id: number): Promise<string> {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    await prisma.usuario.update({
      where: { id },
      data: { codigoInvitacionPadre: code },
    });
    return code;
  }

  static async revokeParentAccess(id: number): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: { codigoInvitacionPadre: null },
    });
  }

  static async getActiveSessions(id: number): Promise<any[]> {
    return prisma.sesionActiva.findMany({
      where: { usuarioId: id },
      orderBy: { fechaUltimaActividad: 'desc' },
    });
  }

  static async closeSession(token: string): Promise<void> {
    await prisma.sesionActiva.deleteMany({
      where: { token },
    });
  }

  static async closeAllSessionsExcept(id: number, currentToken: string): Promise<void> {
    await prisma.sesionActiva.deleteMany({
      where: {
        usuarioId: id,
        token: { not: currentToken },
      },
    });
  }

  static async getStatistics(id: number): Promise<any> {
    const [ejercicios, chats, evaluaciones, posts, logros] = await Promise.all([
      prisma.progresoEjercicio.count({ where: { usuarioId: id, completado: true } }),
      prisma.chatSession.count({ where: { usuarioId: id } }),
      prisma.resultado.count({ where: { usuarioId: id } }),
      prisma.postComunidad.count({ where: { usuarioId: id } }),
      prisma.usuarioLogro.findMany({ where: { usuarioId: id }, include: { logro: true } }),
    ]);

    const puntos = logros.reduce((sum, ul) => sum + ul.logro.puntos, 0);
    
    // Calculate streak
    const progress = await prisma.progresoEjercicio.findMany({
      where: { usuarioId: id, completado: true },
      orderBy: { fechaCompletado: 'desc' },
      take: 30,
    });

    let racha = 0;
    let currentDate = new Date();
    for (const prog of progress) {
      const diffDays = Math.floor((currentDate.getTime() - prog.fechaCompletado.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 1) {
        racha++;
        currentDate = prog.fechaCompletado;
      } else {
        break;
      }
    }

    return {
      ejerciciosCompletados: ejercicios,
      chatsRealizados: chats,
      evaluacionesCompletadas: evaluaciones,
      postsComunidad: posts,
      puntos,
      nivel: this.calculateLevel(puntos),
      rachaDias: racha,
    };
  }

  private static calculateLevel(puntos: number): string {
    if (puntos >= 3000) return 'Líder';
    if (puntos >= 1500) return 'Maestro';
    if (puntos >= 500) return 'Guardián';
    return 'Explorador Mental';
  }

  static async exportUserData(id: number): Promise<any> {
    const user = await this.findById(id);
    if (!user) throw new Error('User not found');

    const [respuestas, resultados, chatSessions, ejercicios, posts] = await Promise.all([
      prisma.respuesta.findMany({ where: { usuarioId: id } }),
      prisma.resultado.findMany({ where: { usuarioId: id } }),
      prisma.chatSession.findMany({ 
        where: { usuarioId: id },
        include: { mensajes: true }
      }),
      prisma.progresoEjercicio.findMany({ where: { usuarioId: id } }),
      prisma.postComunidad.findMany({ where: { usuarioId: id } }),
    ]);

    return {
      usuario: {
        nombre: user.nombre,
        email: user.email,
        edad: user.edad,
        grado: user.grado,
        fechaRegistro: user.fechaRegistro,
      },
      respuestas,
      resultados,
      chatSessions,
      ejercicios,
      posts,
    };
  }
}
