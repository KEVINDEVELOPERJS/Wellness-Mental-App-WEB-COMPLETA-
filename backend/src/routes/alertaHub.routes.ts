import { Router } from 'express';
import { AlertaRiesgoRepository } from '../models/repositories/AlertaRiesgoRepository';
import { authenticate, authorize } from '../middleware/authMiddleware';

const router = Router();

// Endpoint para el Apps Script Hub - recibe alertas para ser enviadas por Gmail
router.get('/hub', authenticate, authorize(['PSICOLOGO', 'ADMIN']), async (req, res) => {
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