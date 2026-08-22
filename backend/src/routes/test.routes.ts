import { Router } from 'express';
import { EmailService } from '../services/EmailService';
import { AlertaRiesgoRepository } from '../models/repositories/AlertaRiesgoRepository';
import { UsuarioRepository } from '../models/repositories/UsuarioRepository';
import { authenticate, authorize } from '../middleware/authMiddleware';
import prisma from '../config/database';

const router = Router();

// Diagnostic endpoint to check email configuration
router.get('/email-config', authenticate, authorize(['ADMIN', 'PSICOLOGO']), (req, res) => {
  const config = {
    smtpHost: process.env.SMTP_HOST ? '✅ Configured' : '❌ Missing',
    smtpUser: process.env.SMTP_USER ? '✅ Configured' : '❌ Missing',
    smtpPassword: process.env.SMTP_PASSWORD ? '✅ Configured' : '❌ Missing',
    smtpPort: process.env.SMTP_PORT || '587',
    emailFrom: process.env.EMAIL_FROM || 'noreply@wellness.com',
  };

  res.json({
    status: 'diagnostic',
    timestamp: new Date().toISOString(),
    emailConfiguration: config,
    message: 'Check if all SMTP fields show ✅ Configured'
  });
});

// Test email sending
router.post('/send-test-email', authenticate, authorize(['ADMIN', 'PSICOLOGO']), async (req, res) => {
  try {
    const { toEmail } = req.body;
    
    if (!toEmail) {
      return res.status(400).json({ error: 'toEmail is required' });
    }

    console.log('🧪 Sending test email to:', toEmail);
    
    await EmailService.sendAlertEmail(toEmail, {
      studentName: 'Estudiante de Prueba',
      riskLevel: 'ALTO',
      type: 'TEST',
      timestamp: new Date().toISOString(),
      excerpt: 'Este es un email de prueba del sistema de alertas Wellness Mental'
    });

    res.json({
      success: true,
      message: 'Test email sent to ' + toEmail,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test email failed:', error);
    res.status(500).json({ 
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Check psychologists in database
router.get('/psychologists', authenticate, authorize(['ADMIN', 'PSICOLOGO']), async (req, res) => {
  try {
    const allUsers = await prisma.usuario.findMany({
      where: { rol: 'PSICOLOGO' },
      select: { 
        id: true, 
        nombre: true, 
        email: true, 
        estado: true,
        fechaRegistro: true
      }
    });

    const activePsychologists = allUsers.filter(u => u.estado === 'ACTIVO');
    const inactivePsychologists = allUsers.filter(u => u.estado !== 'ACTIVO');

    res.json({
      status: 'diagnostic',
      timestamp: new Date().toISOString(),
      total: allUsers.length,
      active: activePsychologists.length,
      inactive: inactivePsychologists.length,
      activePsychologists: activePsychologists.map(p => ({
        nombre: p.nombre,
        email: p.email,
        id: p.id
      })),
      inactivePsychologists: inactivePsychologists.map(p => ({
        nombre: p.nombre,
        email: p.email,
        estado: p.estado
      }))
    });
  } catch (error) {
    console.error('❌ Error checking psychologists:', error);
    res.status(500).json({ 
      error: 'Failed to check psychologists',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test complete alert system
router.post('/test-alert-system', authenticate, authorize(['ADMIN', 'PSICOLOGO']), async (req, res) => {
  try {
    const { estudianteId } = req.body;
    
    if (!estudianteId) {
      return res.status(400).json({ error: 'estudianteId is required' });
    }

    console.log('🧪 Testing complete alert system for student:', estudianteId);

    // Get student info
    const estudiante = await prisma.usuario.findUnique({
      where: { id: estudianteId },
      select: { nombre: true, email: true }
    });

    if (!estudiante) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Get psychologists
    const psicologos = await prisma.usuario.findMany({
      where: { rol: 'PSICOLOGO', estado: 'ACTIVO' },
      select: { email: true, nombre: true }
    });

    console.log('👨‍⚕️ Found psychologists:', psicologos.length);

    // Send test alert emails
    const emailResults = [];
    for (const psicologo of psicologos) {
      try {
        console.log('📧 Sending test alert to:', psicologo.email);
        await EmailService.sendAlertEmail(psicologo.email, {
          studentName: estudiante.nombre,
          riskLevel: 'ALTO',
          type: 'TEST',
          timestamp: new Date().toISOString(),
          excerpt: 'PRUEBA DEL SISTEMA DE ALERTAS - Sistema de Wellness Mental'
        });
        emailResults.push({ email: psicologo.email, status: '✅ Sent' });
        console.log('✅ Test email sent to:', psicologo.email);
      } catch (error) {
        emailResults.push({ 
          email: psicologo.email, 
          status: '❌ Failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        console.error('❌ Failed to send test email to:', psicologo.email, error);
      }
    }

    res.json({
      success: true,
      message: 'Alert system test completed',
      timestamp: new Date().toISOString(),
      student: estudiante.nombre,
      psychologistsCount: psicologos.length,
      emailResults
    });
  } catch (error) {
    console.error('❌ Alert system test failed:', error);
    res.status(500).json({ 
      error: 'Alert system test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Check recent alerts
router.get('/recent-alerts', authenticate, authorize(['ADMIN', 'PSICOLOGO']), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const alertas = await AlertaRiesgoRepository.findAll({
      page: 1,
      limit
    });

    res.json({
      status: 'diagnostic',
      timestamp: new Date().toISOString(),
      total: alertas.length,
      alerts: alertas.map(a => ({
        id: a.id,
        estudianteId: a.estudianteId,
        nivelRiesgo: a.nivelRiesgo,
        tipo: a.tipo,
        extracto: a.extracto,
        timestamp: a.timestamp
      }))
    });
  } catch (error) {
    console.error('❌ Error checking recent alerts:', error);
    res.status(500).json({ 
      error: 'Failed to check recent alerts',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;