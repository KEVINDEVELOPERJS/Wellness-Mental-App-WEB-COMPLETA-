import { Request, Response } from 'express';
import { UsuarioRepository } from '../models/repositories/UsuarioRepository';
import { HashService } from '../services/HashService';
import { JwtService } from '../services/JwtService';
import { EmailService } from '../services/EmailService';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';
import prisma from '../config/database';

const registroSchema = z.object({
  nombre: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  edad: z.number().min(13).max(100),
  grado: z.string().min(1).max(50),
  telefono: z.string().optional(),
  rol: z.enum(['ESTUDIANTE', 'PSICOLOGO']).default('ESTUDIANTE'),
  codigoVerificacion: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export class AuthController {
  static async registrar(req: Request, res: Response) {
    try {
      const data = registroSchema.parse(req.body) as any;

      // Validate email uniqueness
      const emailUnico = await UsuarioRepository.validateEmailUnique(data.email);
      if (!emailUnico) {
        throw new AppError(400, 'Email already registered');
      }

      // Validate psychologist verification code
      if (data.rol === 'PSICOLOGO') {
        if (data.codigoVerificacion !== 'Wellness-Psicologo') {
          throw new AppError(403, 'Invalid verification code for psychologist registration');
        }
      } else {
        // Validate age for students
        const edadValida = await UsuarioRepository.validateAge(data.edad, data.rol);
        if (!edadValida) {
          throw new AppError(400, 'Age must be between 13 and 18 for students');
        }
      }

      // Create user
      const usuario = await UsuarioRepository.create(data as any);

      // Generate tokens
      const tokenPayload = JwtService.generateTokenPayload(usuario);
      const accessToken = JwtService.generateAccessToken(tokenPayload);
      const refreshToken = JwtService.generateRefreshToken(tokenPayload);

      // Store session
      await prisma.sesionActiva.create({
        data: {
          usuarioId: usuario.id,
          token: refreshToken,
          ip: req.ip || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
        },
      } as any);

      // Send verification email if under 16 (for students only)
      if (data.rol === 'ESTUDIANTE' && data.edad < 16) {
        const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await EmailService.sendVerificationEmail(data.email, verificationCode);
      }

      res.status(201).json({
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const usuario = await UsuarioRepository.findByEmail(email);
      if (!usuario) {
        throw new AppError(401, 'Invalid credentials');
      }

      const passwordValid = await HashService.comparePassword(password, usuario.passwordHash);
      if (!passwordValid) {
        throw new AppError(401, 'Invalid credentials');
      }

      if (usuario.estado !== 'ACTIVO') {
        throw new AppError(403, 'Account is not active');
      }

      // Generate tokens
      const tokenPayload = JwtService.generateTokenPayload(usuario);
      const accessToken = JwtService.generateAccessToken(tokenPayload);
      const refreshToken = JwtService.generateRefreshToken(tokenPayload);

      // Store session
      await prisma.sesionActiva.create({
        data: {
          usuarioId: usuario.id,
          token: refreshToken,
          ip: req.ip || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
        },
      } as any);

      res.json({
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError(400, 'Refresh token is required');
      }

      const payload = JwtService.verifyRefreshToken(refreshToken);

      // Check if session exists
      const session = await prisma.sesionActiva.findUnique({
        where: { token: refreshToken },
      });

      if (!session) {
        throw new AppError(401, 'Invalid refresh token');
      }

      // Fetch user to get fresh data
      const usuario = await UsuarioRepository.findById(payload.userId);
      if (!usuario) {
        throw new AppError(404, 'User not found');
      }

      // Generate new access token with fresh payload (without exp property)
      const freshTokenPayload = JwtService.generateTokenPayload(usuario);
      const newAccessToken = JwtService.generateAccessToken(freshTokenPayload);

      res.json({ accessToken: newAccessToken });
    } catch (error) {
      throw error;
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const userId = (req as any).user?.userId;

      if (refreshToken) {
        // Invalidate refresh token
        await prisma.sesionActiva.deleteMany({
          where: { token: refreshToken },
        });
      }

      if (userId) {
        // Invalidate access token (add to blacklist)
        const authHeader = req.headers.authorization;
        if (authHeader) {
          const accessToken = authHeader.substring(7);
          await JwtService.invalidateToken(accessToken);
        }
      }

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      throw error;
    }
  }

  static async validarEmail(req: Request, res: Response) {
    try {
      const { email } = req.params;
      const unico = await UsuarioRepository.validateEmailUnique(email);
      res.json({ unico });
    } catch (error) {
      throw error;
    }
  }

  static async validarEdad(req: Request, res: Response) {
    try {
      const { edad } = req.body;
      const valida = await UsuarioRepository.validateAge(edad);
      res.json({ valida, requiereConsentimiento: edad < 16 });
    } catch (error) {
      throw error;
    }
  }

  static async me(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const usuario = await UsuarioRepository.findById(userId);

      if (!usuario) {
        throw new AppError(404, 'User not found');
      }

      res.json({
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        edad: usuario.edad,
        grado: usuario.grado,
        rol: usuario.rol,
        avatar: usuario.avatar,
        telefono: usuario.telefono,
        fechaRegistro: usuario.fechaRegistro,
      });
    } catch (error) {
      throw error;
    }
  }
}
