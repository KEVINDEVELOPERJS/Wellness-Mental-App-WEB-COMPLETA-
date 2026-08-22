// Google Apps Script Hub para Gestión de Alertas de Gmail
// Este script actúa como intermediario para recibir alertas del backend y enviar correos

// Configuración
const CONFIG = {
  // URL del backend para recibir alertas
  BACKEND_URL: 'https://wellness-mental-app-web-completa.onrender.com/api/alertas/hub',
  
  // URL del backend para obtener psicólogos
  PSYCHOLOGISTS_URL: 'https://wellness-mental-app-web-completa.onrender.com/api/alertas/psychologists',
  
  // Intervalo de verificación en milisegundos (5 minutos)
  CHECK_INTERVAL: 5 * 60 * 1000,
  
  // Email de origen para las alertas
  FROM_EMAIL: Session.getActiveUser().getEmail()
};

// Base de datos simulada de alertas pendientes (en producción usar Google Sheets)
let pendingAlerts = [];

/**
 * Configurar el trigger para verificación automática
 */
function setupTrigger() {
  // Eliminar triggers existentes
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Crear nuevo trigger
  ScriptApp.newTrigger('checkForAlerts')
    .timeBased()
    .everyMinutes(5)
    .create();
  
  Logger.log('Trigger configurado para verificar alertas cada 5 minutos');
}

/**
 * Verificar nuevas alertas del backend
 */
function checkForAlerts() {
  try {
    const apiKey = getAuthToken();
    const response = UrlFetchApp.fetch(CONFIG.BACKEND_URL + '?api_key=' + apiKey, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      
      if (data.alertas && data.alertas.length > 0) {
        processAlerts(data.alertas);
      }
    } else {
      Logger.log('Error fetching alerts: ' + response.getResponseCode() + ' - ' + response.getContentText());
    }
  } catch (error) {
    Logger.log('Error verificando alertas: ' + error.toString());
  }
}

/**
 * Procesar alertas recibidas del backend
 */
function processAlerts(alertas) {
  alertas.forEach(alerta => {
    if (!pendingAlerts.includes(alerta.id)) {
      sendAlertEmail(alerta);
      pendingAlerts.push(alerta.id);
    }
  });
}

/**
 * Enviar correo de alerta a psicólogos
 */
function sendAlertEmail(alerta) {
  const psicologos = getPsychologistEmails();
  
  psicologos.forEach(psicologo => {
    MailApp.sendEmail({
      to: psicologo.email,
      subject: `🚨 ALERTA DE ALTO RIESGO - ${alerta.nivelRiesgo}`,
      html: generateAlertEmail(alerta, psicologo.nombre),
      name: 'Sistema de Alertas Wellness Mental'
    });
  });
}

/**
 * Generar contenido HTML del correo de alerta
 */
function generateAlertEmail(alerta, psicologoNombre) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; text-align: center;">⚠️ ALERTA DE ALTO RIESGO</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; border: 1px solid #ddd;">
        <p>Estimado/a <strong>${psicologoNombre}</strong>,</p>
        
        <div style="background: #fee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0;">
          <h2 style="color: #c62828; margin-top: 0;">Detalles de la Alerta</h2>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Estudiante:</strong> ${alerta.estudiante.nombre}</li>
            <li><strong>Nivel de Riesgo:</strong> <span style="color: #c62828; font-weight: bold;">${alerta.nivelRiesgo}</span></li>
            <li><strong>Tipo:</strong> ${alerta.tipo}</li>
            <li><strong>Fecha:</strong> ${new Date(alerta.timestamp).toLocaleString('es-ES')}</li>
            <li><strong>Extracto:</strong> ${alerta.extracto}</li>
          </ul>
        </div>
        
        <p>Por favor revise esta alerta en el panel de administración del sistema.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://wellness-mental-app-web-completa.vercel.app/alertas-psicologo" 
             style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Revisar Alertas
          </a>
        </div>
        
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 30px;">
          Este es un mensaje automático del Sistema de Alertas Wellness Mental.<br>
          Por favor no responda a este correo.
        </p>
      </div>
    </div>
  `;
}

/**
 * Obtener lista de psicólogos registrados del backend
 */
function getPsychologistEmails() {
  try {
    const apiKey = getAuthToken();
    const response = UrlFetchApp.fetch(CONFIG.PSYCHOLOGISTS_URL + '?api_key=' + apiKey, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      if (data.psicologos && data.psicologos.length > 0) {
        return data.psicologos;
      }
    }
    
    // Fallback to hardcoded list if backend fails
    Logger.log('Using fallback psychologist list');
    return getFallbackPsychologists();
  } catch (error) {
    Logger.log('Error fetching psychologists from backend: ' + error.toString());
    return getFallbackPsychologists();
  }
}

/**
 * Lista de respaldo de psicólogos en caso de fallo del backend
 */
function getFallbackPsychologists() {
  return [
    { email: 'psicologo1@wellness.com', nombre: 'Dr. García' },
    { email: 'psicologo2@wellness.com', nombre: 'Dra. Martínez' },
    { email: 'psicologo3@wellness.com', nombre: 'Dr. Rodríguez' }
  ];
}

/**
 * Obtener token de autenticación del backend
 */
function getAuthToken() {
  // En producción, implementar autenticación JWT o API key
  const API_KEY = PropertiesService.getScriptProperties().getProperty('API_KEY');
  return API_KEY || 'default-api-key';
}

/**
 * Configurar propiedades del script
 */
function setupProperties() {
  PropertiesService.getScriptProperties()
    .setProperty('API_KEY', 'wellness-mental-apps-script-key')
    .setProperty('BACKEND_URL', CONFIG.BACKEND_URL)
    .setProperty('PSYCHOLOGISTS_URL', CONFIG.PSYCHOLOGISTS_URL);
  
  Logger.log('Properties configured successfully');
}

/**
 * Endpoint GET para verificar estado del script (acceso web)
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'status') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'active',
        timestamp: new Date().toISOString(),
        pendingAlerts: pendingAlerts.length,
        backendUrl: CONFIG.BACKEND_URL
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'test') {
      // Test email sending
      testAlert();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Test alert sent'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Default response
    return ContentService.createTextOutput(JSON.stringify({
      status: 'active',
      message: 'Wellness Mental Alert Hub is running',
      availableActions: ['status', 'test'],
      documentation: 'Use ?action=status or ?action=test'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Endpoint para recibir alertas directamente del backend (Webhook)
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.alerta) {
      sendAlertEmail(data.alerta);
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'No alert data' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Función de prueba para enviar una alerta de ejemplo
 */
function testAlert() {
  const testAlerta = {
    id: Date.now(),
    estudiante: { nombre: 'Juan Pérez' },
    nivelRiesgo: 'ALTO',
    tipo: 'evaluacion',
    timestamp: new Date().toISOString(),
    extracto: 'Evaluación PHQ-9 con puntaje alto indicando posible depresión'
  };
  
  sendAlertEmail(testAlerta);
  Logger.log('Alerta de prueba enviada');
}