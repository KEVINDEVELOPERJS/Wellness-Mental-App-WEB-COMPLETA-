import apiClient from './apiClient';
import { PostComunidad, Comentario, PostDTO, ComentarioDTO } from '../types/comunidad';

export const comunidadService = {
  async createPost(post: PostDTO): Promise<PostComunidad> {
    const response = await apiClient.post<PostComunidad>('/comunidad/posts', post);
    return response.data;
  },

  async getPosts(categoria?: string, page = 1, limit = 20): Promise<PostComunidad[]> {
    const params = new URLSearchParams();
    if (categoria) params.append('categoria', categoria);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await apiClient.get<PostComunidad[]>(`/comunidad/posts?${params.toString()}`);
    return response.data;
  },

  async getPost(id: number): Promise<PostComunidad> {
    const response = await apiClient.get<PostComunidad>(`/comunidad/posts/${id}`);
    return response.data;
  },

  async updatePost(id: number, post: Partial<PostDTO>): Promise<PostComunidad> {
    const response = await apiClient.patch<PostComunidad>(`/comunidad/posts/${id}`, post);
    return response.data;
  },

  async deletePost(id: number): Promise<void> {
    await apiClient.delete(`/comunidad/posts/${id}`);
  },

  async addLike(id: number): Promise<PostComunidad> {
    const response = await apiClient.post<PostComunidad>(`/comunidad/posts/${id}/like`);
    return response.data;
  },

  async removeLike(id: number): Promise<PostComunidad> {
    const response = await apiClient.delete<PostComunidad>(`/comunidad/posts/${id}/like`);
    return response.data;
  },

  async reportPost(id: number): Promise<void> {
    await apiClient.post(`/comunidad/posts/${id}/reportar`);
  },

  async moderatePost(id: number, estado: string): Promise<PostComunidad> {
    const response = await apiClient.patch<PostComunidad>(`/comunidad/posts/${id}/moderar`, { estado });
    return response.data;
  },

  async createComentario(comentario: ComentarioDTO): Promise<Comentario> {
    const response = await apiClient.post<Comentario>('/comunidad/comentarios', comentario);
    return response.data;
  },

  async deleteComentario(id: number): Promise<void> {
    await apiClient.delete(`/comunidad/comentarios/${id}`);
  },

  async sugerirCompaneros(): Promise<any[]> {
    const response = await apiClient.get<any[]>('/comunidad/sugerir-companeros');
    return response.data;
  },

  async getCategorias(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/comunidad/categorias');
    return response.data;
  },
};
