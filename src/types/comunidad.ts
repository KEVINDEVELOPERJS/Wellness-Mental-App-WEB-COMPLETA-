export interface PostComunidad {
  id: number;
  usuarioId: number;
  usuario?: {
    id: number;
    nombre: string;
    avatar?: string;
  };
  titulo: string;
  contenido: string;
  categoria: string;
  fecha: string;
  estadoModeracion: 'APROBADO' | 'PENDIENTE' | 'RECHAZADO';
  likes: number;
  reportado: boolean;
  reportadoCount: number;
  comentarios?: Comentario[];
}

export interface Comentario {
  id: number;
  postId: number;
  usuarioId: number;
  usuario?: {
    id: number;
    nombre: string;
    avatar?: string;
  };
  contenido: string;
  fecha: string;
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
