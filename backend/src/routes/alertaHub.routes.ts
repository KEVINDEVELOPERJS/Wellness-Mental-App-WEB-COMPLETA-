import { Router } from 'express';
import { AlertaRiesgoRepository } from '../models/repositories/AlertaRiesgoRepository';
import { authenticate, authorize } from '../middleware/authMiddleware';
import { UsuarioRepository } from '../models/repositories/UsuarioRepository';

const router = Router();

// Middleware para autenticación por API key para Apps Script
const validateApiKey = (req: any, res: any, next: any) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  const validApiKey = process.env.APPS_SCRIPT_API_KEY || 'wellness-mental-apps-script-key';
  
  if (apiKey !== validApiKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
};

// Endpoint público para el Apps Script Hub - recibe alertas para ser enviadas por Gmail
router.get('/hub', validateApiKey, async (req, res) => {
  try {
    const { since } = req.query;
    const sinceDate = since ? new Date(since as string) : new Date(Date.now() - 5 * 60 * 1000); // Últimos 5 minutos por defecto

    // Obtener alertas de alto riesgo recientes
    const alertas = await AlertaRiesgoRepository.findAll({
      nivelRiesgo: 'ALTO',
      page: 1,
      limit: 50
    });

    // Filtrar alertas recientes
    const alertasRecientes = alertas.filter(alerta => 
      new Date(alerta.timestamp) >= sinceDate
    );

    res.json({
      alertas: alertasRecientes,
      timestamp: new Date().toISOString(),
      total: alertasRecientes.length
    });
  } catch (error) {
    console.error('Error en hub de alertas:', error);
    res.status(500).json({ error: 'Error al obtener alertas' });
  }
});

// Endpoint para obtener psicólogos registrados (para Apps Script)
router.get('/psychologists', validateApiKey, async (req, res) => {
  try {
    const psicologos = await UsuarioRepository.findByRole('PSICOLOGO');
    
    const psicologosActivos = psicologos
      .filter(p => p.estado === 'ACTIVO')
      .map(p => ({
        email: p.email,
        nombre: p.nombre
      }));

    res.json({
      psicologos: psicologosActivos,
      total: psicologosActivos.length
    });
  } catch (error) {
    console.error('Error obteniendo psicólogos:', error);
    res.status(500).json({ error: 'Error al obtener psicólogos' });
  }
});

// Endpoint para webhook del Apps Script
router.post('/webhook', async (req, res) => {
  try {
    const { alerta, action } = req.body;
    
    if (action === 'email_sent') {
      // Marcar alerta como enviada por email
      console.log('Alerta enviada por email:', alerta.id);
      // En producción, actualizar estado en base de datos
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error en webhook:', error);
    res.status(500).json({ error: 'Error en webhook' });
  }
});

export default router;