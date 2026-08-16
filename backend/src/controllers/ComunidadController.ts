import { Request, Response } from 'express';
import { ComunidadRepository } from '../models/repositories/ComunidadRepository';
import { LogroRepository } from '../models/repositories/LogroRepository';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const postSchema = z.object({
  titulo: z.string().min(1).max(200),
  contenido: z.string().min(1).max(2000),
  categoria: z.string(),
});

const comentarioSchema = z.object({
  postId: z.number(),
  contenido: z.string().min(1).max(500),
  parentId: z.number().optional(),
});

export class ComunidadController {
  static async createPost(req: Request, res: Response) {
    try {
      const postData = postSchema.parse(req.body);
      const userId = (req as any).user?.userId;

      // Filter inappropriate content
      const toxicityScore = await ComunidadRepository.filterInappropriateContent(postData.contenido);
      if (toxicityScore > 0.6) {
        throw new AppError(400, 'Content contains inappropriate language');
      }

      const post = await ComunidadRepository.createPost(userId, postData);

      // Award points
      await LogroRepository.otorgarPuntos(userId, 'post', 20);

      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  }

  static async getPosts(req: Request, res: Response) {
    try {
      const { categoria, page = '1', limit = '20' } = req.query;

      const posts = await ComunidadRepository.findAll(
        categoria as string,
        parseInt(page as string),
        parseInt(limit as string)
      );

      res.json(posts);
    } catch (error) {
      throw error;
    }
  }

  static async getPost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const post = await ComunidadRepository.findById(parseInt(id));

      if (!post) {
        throw new AppError(404, 'Post not found');
      }

      res.json(post);
    } catch (error) {
      throw error;
    }
  }

  static async updatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;
      const postData = postSchema.partial().parse(req.body);

      const post = await ComunidadRepository.updatePost(parseInt(id), userId, postData);

      res.json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  }

  static async deletePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      await ComunidadRepository.deletePost(parseInt(id), userId);

      res.json({ message: 'Post deleted' });
    } catch (error) {
      throw error;
    }
  }

  static async addLike(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const post = await ComunidadRepository.addLike(parseInt(id));

      res.json(post);
    } catch (error) {
      throw error;
    }
  }

  static async removeLike(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const post = await ComunidadRepository.removeLike(parseInt(id));

      res.json(post);
    } catch (error) {
      throw error;
    }
  }

  static async reportPost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      await ComunidadRepository.reportPost(parseInt(id), userId);

      res.json({ message: 'Post reported' });
    } catch (error) {
      throw error;
    }
  }

  static async moderatePost(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const post = await ComunidadRepository.moderatePost(parseInt(id), estado);

      res.json(post);
    } catch (error) {
      throw error;
    }
  }

  static async createComentario(req: Request, res: Response) {
    try {
      const comentarioData = comentarioSchema.parse(req.body);
      const userId = (req as any).user?.userId;

      const comentario = await ComunidadRepository.createComentario(userId, comentarioData);

      res.status(201).json(comentario);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  }

  static async deleteComentario(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.userId;

      await ComunidadRepository.deleteComentario(parseInt(id), userId);

      res.json({ message: 'Comment deleted' });
    } catch (error) {
      throw error;
    }
  }

  static async sugerirCompaneros(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const companeros = await ComunidadRepository.suggestCompaneros(userId);

      res.json(companeros);
    } catch (error) {
      throw error;
    }
  }

  static async getCategorias(req: Request, res: Response) {
    try {
      const categorias = [
        'estrés',
        'ansiedad social',
        'familia',
        'relajación',
        'motivación',
        'autoestima',
        'académico',
      ];

      res.json(categorias);
    } catch (error) {
      throw error;
    }
  }
}
