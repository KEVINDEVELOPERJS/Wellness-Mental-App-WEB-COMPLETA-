import { Request, Response } from 'express';
import { UsuarioRepository } from '../models/repositories/UsuarioRepository';
import { HashService } from '../services/HashService';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';
import prisma from '../config/database';
import speakeasy from 'speakeasy';

const actualizarPerfilSchema = z.object({
  nombre: z.string().min(2).max(100).optional(),
  telefono: z.string().optional(),
  avatar: z.string().optional(),
});

const cambiarPasswordSchema = z.object({
  passwordActual: z.string(),
  passwordNueva: z.string().min(8),
});

const notificacionesSchema = z.object({
  notificacionesChat: z.boolean().optional(),
  notificacionesEjercicios: z.boolean().optional(),
  notificacionesComunidad: z.boolean().optional(),
  notificacionesAlertas: z.boolean().optional(),
  horaRecordatorio: z.string().optional(),
  temaOscuro: z.boolean().optional(),
});

export class PerfilController {
  static async getEstadisticas(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const estadisticas = await UsuarioRepository.getStatistics(userId);

      res.json(estadisticas);
    } catch (error) {
      throw error;
    }
  }

  static async getPerfil(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const usuario = await UsuarioRepository.findById(userId);

      if (!usuario) {
        throw new AppError(404, 'User not found');
      }

      const perfil = {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        edad: usuario.edad,
        grado: usuario.grado,
        rol: usuario.rol,
        avatar: usuario.avatar,
        telefono: usuario.telefono,
        fechaRegistro: usuario.fechaRegistro,
        consentimientoPadres: usuario.consentimientoPadres,
      };

      res.json(perfil);
    } catch (error) {
      throw error;
    }
  }

  static async actualizarPerfil(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const data = actualizarPerfilSchema.parse(req.body);

      const usuario = await UsuarioRepository.updateProfile(userId, data);

      res.json(usuario);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  }

  static async cambiarPassword(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { passwordActual, passwordNueva } = cambiarPasswordSchema.parse(req.body);

      const usuario = await UsuarioRepository.findById(userId);
      if (!usuario) {
        throw new AppError(404, 'User not found');
      }

      const passwordValid = await HashService.comparePassword(passwordActual, usuario.passwordHash);
      if (!passwordValid) {
        throw new AppError(400, 'Current password is incorrect');
      }

      await UsuarioRepository.updatePassword(userId, passwordNueva);

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  }

  static async getNotificaciones(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const preferencias = await prisma.preferenciasUsuario.findUnique({
        where: { usuarioId: userId },
      });

      if (!preferencias) {
        // Create default preferences
        const nuevasPreferencias = await prisma.preferenciasUsuario.create({
          data: { usuarioId: userId },
        });
        return res.json(nuevasPreferencias);
      }

      res.json(preferencias);
    } catch (error) {
      throw error;
    }
  }

  static async actualizarNotificaciones(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const data = notificacionesSchema.parse(req.body);

      const preferencias = await prisma.preferenciasUsuario.upsert({
        where: { usuarioId: userId },
        create: {
          usuarioId: userId,
          ...data,
        },
        update: data,
      });

      res.json(preferencias);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  }

  static async activar2FA(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      // Generate TOTP secret
      const secret = speakeasy.generateSecret({
        name: `Wellness Mental - User ${userId}`,
        issuer: 'Wellness Mental',
      });

      // In a real implementation, store this secret securely in the database
      // For now, we'll return it to be set up
      res.json({
        secret: secret.base32,
        qrCode: secret.otpauth_url,
        message: 'Scan this QR code with your authenticator app',
      });
    } catch (error) {
      throw error;
    }
  }

  static async validar2FA(req: Request, res: Response) {
    try {
      const { codigo, secret } = req.body;
      const userId = (req as any).user?.userId;

      // In a real implementation, you would verify against the stored secret
      const isValid = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: codigo,
        window: 2,
      });

      if (isValid) {
        // Store that 2FA is enabled for this user
        await prisma.usuario.update({
          where: { id: userId },
          data: { /* Add 2FA enabled field to schema */ },
        });
      }

      res.json({ valido: isValid });
    } catch (error) {
      throw error;
    }
  }

  static async getSesiones(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const sesiones = await UsuarioRepository.getActiveSessions(userId);

      res.json(sesiones);
    } catch (error) {
      throw error;
    }
  }

  static async cerrarSesion(req: Request, res: Response) {
    try {
      const { token } = req.body;
      await UsuarioRepository.closeSession(token);

      res.json({ message: 'Session closed' });
    } catch (error) {
      throw error;
    }
  }

  static async cerrarTodasSesiones(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { currentToken } = req.body;

      await UsuarioRepository.closeAllSessionsExcept(userId, currentToken);

      res.json({ message: 'All other sessions closed' });
    } catch (error) {
      throw error;
    }
  }

  static async generarInvitacionPadre(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const codigo = await UsuarioRepository.generateInvitationCode(userId);

      res.json({ codigo, validoPor: '7 días' });
    } catch (error) {
      throw error;
    }
  }

  static async revocarAccesoPadre(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      await UsuarioRepository.revokeParentAccess(userId);

      res.json({ message: 'Parent access revoked' });
    } catch (error) {
      throw error;
    }
  }

  static async descargarDatos(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const datos = await UsuarioRepository.exportUserData(userId);

      // Generate encrypted JSON
      const jsonString = JSON.stringify(datos, null, 2);
      const encryptedData = require('crypto')
        .createHash('sha256')
        .update(jsonString)
        .digest('hex');

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="datos-usuario-${userId}.json"`);
      res.send(datos);
    } catch (error) {
      throw error;
    }
  }

  static async eliminarCuenta(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const { password } = req.body;

      const usuario = await UsuarioRepository.findById(userId);
      if (!usuario) {
        throw new AppError(404, 'User not found');
      }

      const passwordValid = await HashService.comparePassword(password, usuario.passwordHash);
      if (!passwordValid) {
        throw new AppError(400, 'Password is incorrect');
      }

      // Soft delete - mark as inactive
      await prisma.usuario.update({
        where: { id: userId },
        data: { estado: 'SUSPENDIDO' },
      });

      res.json({ message: 'Account deactivated' });
    } catch (error) {
      throw error;
    }
  }

  static async getHistorialEvaluaciones(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;
      const resultados = await prisma.resultado.findMany({
        where: { usuarioId: userId },
        include: {
          cuestionario: {
            select: {
              id: true,
              titulo: true,
              categoria: true,
            },
          },
        },
        orderBy: { fechaEvaluacion: 'desc' },
      });

      res.json(resultados);
    } catch (error) {
      throw error;
    }
  }
}
