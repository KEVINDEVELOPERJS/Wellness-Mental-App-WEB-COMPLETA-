import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;
  private static isConfigured = false;
  private static sendGridConfigured = false;
  private static useSendGrid = false;

  private static initializeTransporter() {
    if (this.isConfigured) return;

    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const smtpPort = process.env.SMTP_PORT || '587';

    console.log('🔧 Email Service Configuration Check:');
    console.log('   SMTP_HOST:', smtpHost ? '✅ Set' : '❌ Missing');
    console.log('   SMTP_PORT:', smtpPort);
    console.log('   SMTP_USER:', smtpUser ? '✅ Set' : '❌ Missing');
    console.log('   SMTP_PASSWORD:', smtpPassword ? '✅ Set' : '❌ Missing');

    // Check if SMTP is properly configured
    if (!smtpHost || !smtpUser || !smtpPassword) {
      console.warn('⚠️ Email service not configured: Missing SMTP credentials. Email sending will be disabled.');
      this.isConfigured = false;
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
        // Add timeout and connection settings for better reliability
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 5000, // 5 seconds
        socketTimeout: 10000, // 10 seconds
        tls: {
          rejectUnauthorized: false // Only for development, remove in production
        }
      });
      this.isConfigured = true;
      console.log('✅ Email service initialized successfully with host:', smtpHost, 'port:', smtpPort);
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  private static initializeSendGrid() {
    if (this.sendGridConfigured) return;

    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    const emailFrom = process.env.EMAIL_FROM;

    console.log('🔧 SendGrid Configuration Check:');
    console.log('   SENDGRID_API_KEY:', sendGridApiKey ? '✅ Set' : '❌ Missing');
    console.log('   EMAIL_FROM:', emailFrom || '❌ Missing (required for SendGrid)');

    if (!sendGridApiKey) {
      console.warn('⚠️ SendGrid not configured: Missing API key');
      this.sendGridConfigured = false;
      this.useSendGrid = false;
      return;
    }

    if (!emailFrom) {
      console.warn('⚠️ SendGrid not configured: Missing EMAIL_FROM (sender must be verified in SendGrid)');
      this.sendGridConfigured = false;
      this.useSendGrid = false;
      return;
    }

    try {
      sgMail.setApiKey(sendGridApiKey);
      this.sendGridConfigured = true;
      this.useSendGrid = true;
      console.log('✅ SendGrid initialized successfully');
      console.log('📧 Will send from:', emailFrom);
    } catch (error) {
      console.error('❌ Failed to initialize SendGrid:', error);
      this.sendGridConfigured = false;
      this.useSendGrid = false;
    }
  }

  private static ensureInitialized() {
    if (!this.isConfigured) {
      this.initializeTransporter();
    }
    if (!this.sendGridConfigured) {
      this.initializeSendGrid();
    }
  }

  static async sendVerificationEmail(email: string, verificationCode: string): Promise<void> {
    this.ensureInitialized();
    
    // Try SendGrid first if configured
    if (this.useSendGrid) {
      try {
        const msg = {
          to: email,
          from: process.env.EMAIL_FROM || 'noreply@example.com',
          subject: 'Verifica tu correo - Wellness Mental',
          html: `
            <h2>Bienvenido a Wellness Mental</h2>
            <p>Tu código de verificación es: <strong>${verificationCode}</strong></p>
            <p>Este código expirará en 24 horas.</p>
            <p>Si no solicitaste este correo, por favor ignóralo.</p>
          `,
        };
        await sgMail.send(msg);
        console.log('✅ Verification email sent successfully via SendGrid to:', email);
        return;
      } catch (error) {
        console.error('❌ SendGrid verification email failed for:', email, 'Error:', error);
        console.log('🔄 Falling back to SMTP...');
      }
    }
    
    if (!this.transporter) {
      console.warn('Email service not configured, skipping verification email');
      return;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@example.com',
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
      console.log('✅ Verification email sent successfully to:', email);
    } catch (error) {
      console.error('❌ Failed to send verification email to:', email, 'Error:', error);
      // Don't throw error to prevent blocking user registration
    }
  }

  static async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    this.ensureInitialized();
    
    // Try SendGrid first if configured
    if (this.useSendGrid) {
      try {
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const msg = {
          to: email,
          from: process.env.EMAIL_FROM || 'noreply@example.com',
          subject: 'Restablecer contraseña - Wellness Mental',
          html: `
            <h2>Restablecer tu contraseña</h2>
            <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
            <a href="${resetUrl}">${resetUrl}</a>
            <p>Este enlace expirará en 1 hora.</p>
            <p>Si no solicitaste este cambio, por favor ignóralo.</p>
          `,
        };
        await sgMail.send(msg);
        console.log('✅ Password reset email sent successfully via SendGrid to:', email);
        return;
      } catch (error) {
        console.error('❌ SendGrid password reset email failed for:', email, 'Error:', error);
        console.log('🔄 Falling back to SMTP...');
      }
    }
    
    if (!this.transporter) {
      console.warn('Email service not configured, skipping password reset email');
      return;
    }

    try {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@example.com',
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
      console.log('✅ Password reset email sent successfully to:', email);
    } catch (error) {
      console.error('❌ Failed to send password reset email to:', email, 'Error:', error);
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
    console.log('📧 EmailService.sendAlertEmail called for:', toEmail);
    this.ensureInitialized();
    
    // Try SendGrid first if configured
    if (this.useSendGrid) {
      console.log('🚀 Using SendGrid API for email to:', toEmail);
      try {
        await this.sendViaSendGrid(toEmail, alertData);
        console.log('✅ Email sent successfully via SendGrid to:', toEmail);
        return;
      } catch (error) {
        console.error('❌ SendGrid failed for:', toEmail, 'Error:', error);
        console.log('🔄 Falling back to SMTP...');
      }
    }
    
    // Fallback to SMTP
    if (!this.transporter) {
      console.warn('⚠️ Email service not configured, skipping alert email to:', toEmail);
      return;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@example.com',
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

      console.log('📤 Sending email via SMTP to:', toEmail);
      await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully via SMTP to:', toEmail);
    } catch (error) {
      console.error('❌ Failed to send alert email to:', toEmail, 'Error:', error);
      
      // Retry with different configuration if timeout
      if (error instanceof Error && error.message.includes('timeout')) {
        console.log('🔄 Retrying with different SMTP configuration...');
        try {
          await this.retryWithDifferentConfig(toEmail, alertData);
        } catch (retryError) {
          console.error('❌ Retry attempt failed:', retryError);
        }
      }
      
      // Don't throw error to prevent blocking alert system
    }
  }

  private static async sendViaSendGrid(toEmail: string, alertData: {
    studentName: string;
    riskLevel: string;
    type: string;
    timestamp: string;
    excerpt: string;
  }): Promise<void> {
    const msg = {
      to: toEmail,
      from: process.env.EMAIL_FROM || 'noreply@example.com',
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

    try {
      await sgMail.send(msg);
      console.log('✅ Email sent successfully via SendGrid to:', toEmail);
    } catch (error: any) {
      console.error('❌ SendGrid API Error Details:', {
        message: error.message,
        code: error.code,
        response: error.response?.body,
        statusCode: error.response?.statusCode
      });
      
      // Specific guidance for common errors
      if (error.code === 403) {
        console.error('🔧 SendGrid 403 Forbidden - Possible causes:');
        console.error('   1. EMAIL_FROM not verified in SendGrid');
        console.error('   2. API Key lacks "Mail Send" permissions');
        console.error('   3. API Key is invalid or expired');
        console.error('   Current EMAIL_FROM:', process.env.EMAIL_FROM);
      }
      
      throw error;
    }
  }

  private static async retryWithDifferentConfig(toEmail: string, alertData: any): Promise<void> {
    try {
      const alternativeTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: 25, // Try port 25 as fallback
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
        connectionTimeout: 5000,
        greetingTimeout: 3000,
        socketTimeout: 5000,
        tls: {
          rejectUnauthorized: false
        }
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@example.com',
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

      console.log('🔄 Retry attempt via port 25 to:', toEmail);
      await alternativeTransporter.sendMail(mailOptions);
      console.log('✅ Retry successful to:', toEmail);
    } catch (retryError) {
      console.error('❌ Retry also failed for:', toEmail, 'Error:', retryError);
    }
  }

  static async sendReportEmail(toEmail: string, reportUrl: string, studentName: string): Promise<void> {
    this.ensureInitialized();
    
    // Try SendGrid first if configured
    if (this.useSendGrid) {
      try {
        const msg = {
          to: toEmail,
          from: process.env.EMAIL_FROM || 'noreply@example.com',
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
        await sgMail.send(msg);
        console.log('✅ Report email sent successfully via SendGrid to:', toEmail);
        return;
      } catch (error) {
        console.error('❌ SendGrid report email failed for:', toEmail, 'Error:', error);
        console.log('🔄 Falling back to SMTP...');
      }
    }
    
    if (!this.transporter) {
      console.warn('Email service not configured, skipping report email');
      return;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@example.com',
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
      console.log('✅ Report email sent successfully to:', toEmail);
    } catch (error) {
      console.error('❌ Failed to send report email to:', toEmail, 'Error:', error);
      // Don't throw error to prevent blocking report generation
    }
  }
}
