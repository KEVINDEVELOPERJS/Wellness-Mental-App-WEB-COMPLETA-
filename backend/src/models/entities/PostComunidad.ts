import { EstadoModeracion } from '@prisma/client';

export interface PostComunidad {
  id: number;
  usuarioId: number;
  titulo: string;
  contenido: string;
  categoria: string;
  fecha: Date;
  estadoModeracion: EstadoModeracion;
  likes: number;
  reportado: boolean;
  reportadoCount: number;
}

export interface Comentario {
  id: number;
  postId: number;
  usuarioId: number;
  contenido: string;
  fecha: Date;
  parentId?: number;
}

export interface PostDTO {
  titulo: string;
  contenido: string;
  categoria: string;
}

export interface ComentarioDTO {
  postId: number;
  contenido: string;
  parentId?: number;
}
