import { Request, Response } from 'express';
import { CuestionarioRepository } from '../models/repositories/CuestionarioRepository';
import { UsuarioRepository } from '../models/repositories/UsuarioRepository';
import { PdfService } from '../services/PdfService';
import { EmailService } from '../services/EmailService';
import { EncryptionService } from '../services/EncryptionService';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';
import prisma from '../config/database';
import speakeasy from 'speakeasy';

const informeSchema = z.object({
  resultadoId: z.number(),
  padreId: z.number().optional(),
});

const twoFactorSchema = z.object({
  codigo: z.string().length(6),
});

export class InformeController {
  static async generarInforme(req: Request, res: Response) {
    try {
      const { resultadoId, padreId } = informeSchema.parse(req.body);
      const userId = (req as any).user?.userId;

      const resultado = await CuestionarioRepository.getResultadoById(resultadoId);
      if (!resultado) {
        throw new AppError(404, 'Resultado not found');
      }

      const usuario = await UsuarioRepository.findById(resultado.usuarioId);
      if (!usuario) {
        throw new AppError(404, 'Usuario not found');
      }

      // Generate report data
      const reportData = {
        studentName: usuario.nombre,
        grade: usuario.grado,
        evaluationDate: resultado.fechaEvaluacion.toISOString().split('T')[0],
        riskLevel: resultado.nivelRiesgo,
        summary: resultado.prediagnostico,
        recommendations: this.generateRecommendations(resultado.nivelRiesgo),
        trends: [], // Would be calculated from historical data
        appUsage: await UsuarioRepository.getStatistics(resultado.usuarioId),
      };

      // Generate PDF
      const pdfBuffer = await PdfService.generateReport(reportData);

      // Create informe record
      const tokenAcceso = this.generateSecureToken();
      const hashSeguridad = EncryptionService.generateHash(JSON.stringify(reportData));

      const informe = await prisma.informe.create({
        data: {
          resultadoId,
          padreId,
          psicologoId: userId,
          resumen: EncryptionService.encrypt(reportData.summary),
          detalle: EncryptionService.encrypt(JSON.stringify(reportData)),
          recomendaciones: EncryptionService.encrypt(reportData.recommendations),
          nivelRiesgo: resultado.nivelRiesgo,
          hashSeguridad,
          tokenAcceso,
          expiracionToken: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      });

      // Send notification email to parent
      if (padreId) {
        const padre = await UsuarioRepository.findById(padreId);
        if (padre && padre.email) {
          const reportUrl = `${process.env.FRONTEND_URL}/informe/${tokenAcceso}`;
          await EmailService.sendReportEmail(padre.email, reportUrl, usuario.nombre);
        }
      }

      res.status(201).json({
        informeId: informe.id,
        tokenAcceso,
        expiracion: informe.expiracionToken,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  }

  static async getInforme(req: Request, res: Response) {
    try {
      const { token } = req.params;

      const informe = await prisma.informe.findUnique({
        where: { tokenAcceso: token },
        include: {
          resultado: {
            include: {
              cuestionario: true,
            },
          },
        },
      });

      if (!informe) {
        throw new AppError(404, 'Informe not found');
      }

      // Check expiration
      if (informe.expiracionToken && new Date() > informe.expiracionToken) {
        throw new AppError(400, 'Token has expired');
      }

      // Decrypt data
      const decryptedData = {
        id: informe.id,
        resumen: EncryptionService.decrypt(informe.resumen),
        detalle: JSON.parse(EncryptionService.decrypt(informe.detalle)),
        recomendaciones: EncryptionService.decrypt(informe.recomendaciones),
        nivelRiesgo: informe.nivelRiesgo,
        fechaEnvio: informe.fechaEnvio,
        estadoLectura: informe.estadoLectura,
      };

      res.json(decryptedData);
    } catch (error) {
      throw error;
    }
  }

  static async getInformePDF(req: Request, res: Response) {
    try {
      const { token } = req.params;

      const informe = await prisma.informe.findUnique({
        where: { tokenAcceso: token },
        include: {
          resultado: {
            include: {
              cuestionario: true,
            },
          },
        },
      });

      if (!informe) {
        throw new AppError(404, 'Informe not found');
      }

      // Check expiration
      if (informe.expiracionToken && new Date() > informe.expiracionToken) {
        throw new AppError(400, 'Token has expired');
      }

      // Generate PDF
      const reportData = JSON.parse(EncryptionService.decrypt(informe.detalle));
      const pdfBuffer = await PdfService.generateReport(reportData);

      // Update state to read
      await prisma.informe.update({
        where: { id: informe.id },
        data: { estadoLectura: 'LEIDO' },
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="informe-${informe.id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      throw error;
    }
  }

  static async validar2FA(req: Request, res: Response) {
    try {
      const { codigo } = twoFactorSchema.parse(req.body);
      const userId = (req as any).user?.userId;

      const usuario = await UsuarioRepository.findById(userId);
      if (!usuario) {
        throw new AppError(404, 'User not found');
      }

      // In a real implementation, you would store the TOTP secret per user
      // For now, we'll use a simple validation
      const isValid = codigo.length === 6 && !isNaN(parseInt(codigo));

      res.json({ valido: isValid });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation error', details: error.errors });
      }
      throw error;
    }
  }

  static async generar2FA(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      // Generate TOTP secret
      const secret = speakeasy.generateSecret({
        name: `Wellness Mental - User ${userId}`,
        issuer: 'Wellness Mental',
      });

      // In a real implementation, store this secret securely
      res.json({
        secret: secret.base32,
        qrCode: secret.otpauth_url,
      });
    } catch (error) {
      throw error;
    }
  }

  static async registrarAcceso(req: Request, res: Response) {
    try {
      const { token } = req.params;
      const ip = req.ip;
      const userAgent = req.get('user-agent') || 'unknown';

      const informe = await prisma.informe.findUnique({
        where: { tokenAcceso: token },
      });

      if (!informe) {
        throw new AppError(404, 'Informe not found');
      }

      // Log access (in a real implementation, this would go to a separate audit table)
      console.log(`Informe ${informe.id} accessed from ${ip} - ${userAgent}`);

      res.json({ message: 'Access logged' });
    } catch (error) {
      throw error;
    }
  }

  static async getInformesByPadre(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.userId;

      const informes = await prisma.informe.findMany({
        where: { padreId: userId },
        include: {
          resultado: {
            include: {
              usuario: {
                select: {
                  id: true,
                  nombre: true,
                  grado: true,
                },
              },
            },
          },
        },
        orderBy: { fechaEnvio: 'desc' },
      });

      res.json(informes);
    } catch (error) {
      throw error;
    }
  }

  private static generateRecommendations(riskLevel: string): string {
    const recommendations = {
      BAJO: `
        <ul>
          <li>Mantener hábitos saludables de sueño y alimentación</li>
          <li>Continuar con actividades de autocuidado y ejercicio regular</li>
          <li>Practicar técnicas de relajación cuando sea necesario</li>
          <li>Mantener comunicación abierta con familia y amigos</li>
        </ul>
      `,
      MEDIO: `
        <ul>
          <li>Considerar aumentar la frecuencia de ejercicios de respiración y meditación</li>
          <li>Establecer una rutina de sueño consistente</li>
          <li>Limitar el tiempo de pantallas antes de dormir</li>
          <li>Fomentar actividades que generen bienestar y alegría</li>
          <li>Considerar hablar con un consejero escolar si los síntomas persisten</li>
        </ul>
      `,
      ALTO: `
        <ul>
          <li>Se recomienda urgentemente consultar con un profesional de salud mental</li>
          <li>Establecer contacto con el psicólogo escolar lo antes posible</li>
          <li>Crear un ambiente de apoyo y comprensión en el hogar</li>
          <li>Monitorear de cerca el bienestar emocional del usuario</li>
          <li>Considerar terapia profesional y seguimiento continuo</li>
          <li>Mantener comunicación constante con la institución educativa</li>
        </ul>
      `,
    };

    return recommendations[riskLevel as keyof typeof recommendations] || recommendations.BAJO;
  }

  private static generateSecureToken(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }
}
