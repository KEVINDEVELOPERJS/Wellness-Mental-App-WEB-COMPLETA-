import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;
  private static isConfigured = false;

  private static initializeTransporter() {
    if (this.isConfigured) return;

    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;

    // Check if SMTP is properly configured
    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.warn('Email service not configured: Missing SMTP credentials. Email sending will be disabled.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });
      this.isConfigured = true;
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  private static ensureInitialized() {
    if (!this.isConfigured) {
      this.initializeTransporter();
    }
  }

  static async sendVerificationEmail(email: string, verificationCode: string): Promise<void> {
    this.ensureInitialized();
    
    if (!this.transporter) {
      console.warn('Email service not configured, skipping verification email');
      return;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@wellness.com',
        to: email,
        subject: 'Verifica tu correo - Wellness Mental',
        html: `
          <h2>Bienvenido a Wellness Mental</h2>
          <p>Tu código de verificación es: <strong>${verificationCode}</strong></p>
          <p>Este código expirará en 24 horas.</p>
          <p>Si no solicitaste este correo, por favor ignóralo.</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't throw error to prevent blocking user registration
    }
  }

  static async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    this.ensureInitialized();
    
    if (!this.transporter) {
      console.warn('Email service not configured, skipping password reset email');
      return;
    }

    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@wellness.com',
        to: email,
        subject: 'Restablecer contraseña - Wellness Mental',
        html: `
          <h2>Restablecer tu contraseña</h2>
          <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>Este enlace expirará en 1 hora.</p>
          <p>Si no solicitaste este cambio, por favor ignóralo.</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Don't throw error to prevent blocking password reset flow
    }
  }

  static async sendAlertEmail(toEmail: string, alertData: {
    studentName: string;
    riskLevel: string;
    type: string;
    timestamp: string;
    excerpt: string;
  }): Promise<void> {
    this.ensureInitialized();
    
    if (!this.transporter) {
      console.warn('Email service not configured, skipping alert email');
      return;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@wellness.com',
        to: toEmail,
        subject: `ALERTA: ${alertData.riskLevel} - ${alertData.studentName}`,
        html: `
          <h2 style="color: red;">⚠️ Alerta de Riesgo Detectada</h2>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
            <p><strong>Estudiante:</strong> ${alertData.studentName}</p>
            <p><strong>Nivel de Riesgo:</strong> ${alertData.riskLevel}</p>
            <p><strong>Tipo:</strong> ${alertData.type}</p>
            <p><strong>Fecha:</strong> ${alertData.timestamp}</p>
            <p><strong>Extracto:</strong> ${alertData.excerpt}</p>
          </div>
          <p>Por favor revisa esta alerta en el panel de administración.</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send alert email:', error);
      // Don't throw error to prevent blocking alert system
    }
  }

  static async sendReportEmail(toEmail: string, reportUrl: string, studentName: string): Promise<void> {
    this.ensureInitialized();
    
    if (!this.transporter) {
      console.warn('Email service not configured, skipping report email');
      return;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@wellness.com',
        to: toEmail,
        subject: `Informe disponible - ${studentName}`,
        html: `
          <h2>Informe de Bienestar Mental Disponible</h2>
          <p>Se ha generado un nuevo informe para ${studentName}.</p>
          <p>Para acceder al informe de forma segura, haz clic en el siguiente enlace:</p>
          <a href="${reportUrl}">${reportUrl}</a>
          <p>Este enlace expirará en 24 horas.</p>
          <p>Si tienes alguna pregunta, contacta al psicólogo escolar.</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send report email:', error);
      // Don't throw error to prevent blocking report generation
    }
  }
}
