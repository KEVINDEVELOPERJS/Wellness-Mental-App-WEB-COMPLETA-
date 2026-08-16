import prisma from '../../config/database';
import { PostComunidad, Comentario, PostDTO, ComentarioDTO } from '../entities/PostComunidad';
import { EstadoModeracion } from '@prisma/client';

export class ComunidadRepository {
  static async createPost(usuarioId: number, postDTO: PostDTO): Promise<PostComunidad> {
    return prisma.postComunidad.create({
      data: {
        usuarioId,
        titulo: postDTO.titulo,
        contenido: postDTO.contenido,
        categoria: postDTO.categoria,
        estadoModeracion: 'APROBADO',
      },
    });
  }

  static async findAll(categoria?: string, page: number = 1, limit: number = 20): Promise<PostComunidad[]> {
    const skip = (page - 1) * limit;

    return prisma.postComunidad.findMany({
      where: {
        categoria: categoria || undefined,
        estadoModeracion: 'APROBADO',
        reportado: false,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            avatar: true,
          },
        },
        comentarios: {
          take: 3,
          orderBy: { fecha: 'desc' },
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { fecha: 'desc' },
      skip,
      take: limit,
    });
  }

  static async findById(id: number): Promise<PostComunidad | null> {
    return prisma.postComunidad.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            avatar: true,
          },
        },
        comentarios: {
          orderBy: { fecha: 'asc' },
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  static async updatePost(id: number, usuarioId: number, data: Partial<PostDTO>): Promise<PostComunidad> {
    const post = await this.findById(id);
    if (!post) throw new Error('Post not found');
    if (post.usuarioId !== usuarioId) throw new Error('Unauthorized');

    // Check if within 24 hours
    const hoursSinceCreation = (Date.now() - post.fecha.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) throw new Error('Cannot edit post after 24 hours');

    return prisma.postComunidad.update({
      where: { id },
      data,
    });
  }

  static async deletePost(id: number, usuarioId: number): Promise<void> {
    const post = await this.findById(id);
    if (!post) throw new Error('Post not found');
    if (post.usuarioId !== usuarioId) throw new Error('Unauthorized');

    await prisma.postComunidad.delete({
      where: { id },
    });
  }

  static async addLike(id: number): Promise<PostComunidad> {
    return prisma.postComunidad.update({
      where: { id },
      data: { likes: { increment: 1 } },
    });
  }

  static async removeLike(id: number): Promise<PostComunidad> {
    return prisma.postComunidad.update({
      where: { id },
      data: { likes: { decrement: 1 } },
    });
  }

  static async reportPost(id: number, usuarioId: number): Promise<void> {
    const post = await this.findById(id);
    if (!post) throw new Error('Post not found');

    const updatedPost = await prisma.postComunidad.update({
      where: { id },
      data: {
        reportado: true,
        reportadoCount: { increment: 1 },
      },
    });

    // Hide post if reported 3+ times
    if (updatedPost.reportadoCount >= 3) {
      await prisma.postComunidad.update({
        where: { id },
        data: { estadoModeracion: 'PENDIENTE' },
      });
    }
  }

  static async moderatePost(id: number, estado: EstadoModeracion): Promise<PostComunidad> {
    return prisma.postComunidad.update({
      where: { id },
      data: { estadoModeracion: estado },
    });
  }

  static async createComentario(usuarioId: number, comentarioDTO: ComentarioDTO): Promise<Comentario> {
    return prisma.comentario.create({
      data: {
        postId: comentarioDTO.postId,
        usuarioId,
        contenido: comentarioDTO.contenido,
        parentId: comentarioDTO.parentId,
      },
    });
  }

  static async deleteComentario(id: number, usuarioId: number): Promise<void> {
    const comentario = await prisma.comentario.findUnique({
      where: { id },
    });

    if (!comentario) throw new Error('Comment not found');
    if (comentario.usuarioId !== usuarioId) throw new Error('Unauthorized');

    await prisma.comentario.delete({
      where: { id },
    });
  }

  static async suggestCompaneros(usuarioId: number): Promise<any[]> {
    // Simple algorithm: suggest users with similar post categories
    const userPosts = await prisma.postComunidad.findMany({
      where: { usuarioId },
      select: { categoria: true },
    });

    const categories = [...new Set(userPosts.map(p => p.categoria))];

    const otherUsers = await prisma.postComunidad.findMany({
      where: {
        usuarioId: { not: usuarioId },
        categoria: { in: categories },
        estadoModeracion: 'APROBADO',
      },
      select: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            avatar: true,
            grado: true,
          },
        },
      },
      take: 10,
    });

    // Remove duplicates and limit to 3
    const uniqueUsers = new Map();
    otherUsers.forEach(post => {
      if (!uniqueUsers.has(post.usuario.id)) {
        uniqueUsers.set(post.usuario.id, post.usuario);
      }
    });

    return Array.from(uniqueUsers.values()).slice(0, 3);
  }

  static async filterInappropriateContent(contenido: string): Promise<number> {
    // Simple toxic content detection (0.0 = safe, 1.0 = toxic)
    // In production, integrate with Perspective API
    const toxicWords = ['estúpido', 'idiota', 'odio', 'matar', 'muerte', 'estúpida'];
    const lowerContent = contenido.toLowerCase();

    let toxicCount = 0;
    toxicWords.forEach(word => {
      if (lowerContent.includes(word)) toxicCount++;
    });

    return Math.min(toxicCount * 0.3, 1.0);
  }
}
