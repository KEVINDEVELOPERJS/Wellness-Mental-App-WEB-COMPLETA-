# Google Apps Script Hub - Configuración

Este script de Google Apps Script actúa como intermediario para enviar correos de alerta a psicólogos usando Gmail.

## Problemas Resueltos

### 1. Error "No se encontró la función doGet"
**Solución**: Se agregó la función `doGet` para permitir acceso web al script.

### 2. Autenticación entre Apps Script y Backend
**Solución**: Se implementó autenticación por API key en lugar de JWT complejo.

### 3. Psicólogos hardcodeados
**Solución**: El script ahora obtiene la lista de psicólogos del backend dinámicamente.

## Configuración Paso a Paso

### 1. Crear el Proyecto en Google Apps Script

1. Ve a [script.google.com](https://script.google.com)
2. Crea un nuevo proyecto
3. Copia el contenido de `Code.gs` en tu proyecto

### 2. Configurar el Script

Ejecuta las siguientes funciones en orden:

```javascript
// 1. Configurar las propiedades
setupProperties()

// 2. Configurar el trigger automático
setupTrigger()
```

### 3. Desplegar como Web App

1. Ve a **Implementar** > **Nueva implementación**
2. Selecciona **Aplicación web**
3. Configuración:
   - **Descripción**: "Wellness Mental Alert Hub"
   - **Ejecutar como**: "Yo"
   - **Quién tiene acceso**: "Cualquier persona" (importante para que funcione el webhook)
4. Copia la URL generada

### 4. Configurar Variables de Entorno en Backend

Asegúrate de tener esta variable en tu `.env` del backend:

```env
APPS_SCRIPT_API_KEY="wellness-mental-apps-script-key"
```

### 5. Probar el Script

Accede a la URL de tu web app con:
- `?action=status` - Verificar estado
- `?action=test` - Enviar alerta de prueba

Ejemplo: `https://script.google.com/macros/s/TU_ID/exec?action=test`

## Funciones Disponibles

### Funciones Principales

- `doGet(e)` - Endpoint para acceso web y pruebas
- `doPost(e)` - Webhook para recibir alertas del backend
- `checkForAlerts()` - Verifica alertas nuevas del backend (ejecutado por trigger)
- `sendAlertEmail(alerta)` - Envía correo de alerta a psicólogos
- `getPsychologistEmails()` - Obtiene psicólogos del backend

### Funciones de Configuración

- `setupTrigger()` - Configura trigger automático cada 5 minutos
- `setupProperties()` - Configura propiedades del script
- `testAlert()` - Envía una alerta de prueba

## Flujo de Trabajo

1. **Trigger automático** (cada 5 minutos):
   - Ejecuta `checkForAlerts()`
   - Consulta `/api/alertas/hub` del backend
   - Procesa alertas nuevas
   - Envía correos a psicólogos

2. **Webhook alternativo**:
   - Backend puede enviar alertas directamente vía `doPost()`
   - URL: `https://script.google.com/macros/s/TU_ID/exec`

## URLs del Backend

El script se conecta a estos endpoints:

- `/api/alertas/hub?api_key=KEY` - Obtener alertas recientes
- `/api/alertas/psychologists?api_key=KEY` - Obtener psicólogos registrados

## Solución de Problemas

### El script no envía correos
- Verifica que el trigger esté configurado: `ScriptApp.getProjectTriggers()`
- Revisa los logs: Ver > Ejecuciones
- Prueba manualmente: `testAlert()`

### Error de autenticación
- Verifica que `APPS_SCRIPT_API_KEY` coincida en backend y script
- Ejecuta `setupProperties()` para actualizar la API key

### No obtiene psicólogos del backend
- Verifica que el endpoint `/api/alertas/psychologists` esté accesible
- Revisa los logs del script para ver errores de conexión
- El script usará la lista de respaldo si falla el backend

## URLs Actuales

- **Backend**: `https://wellness-mental-app-web-completa.onrender.com`
- **Frontend**: `https://wellness-mental-app-web-completa.vercel.app`
- **Apps Script Hub**: [Tu URL desplegada]

## Notas Importantes

- El script usa `MailApp.sendEmail()` para enviar correos desde tu cuenta de Gmail
- Asegúrate de que tu cuenta de Gmail tenga permisos para enviar correos
- La lista de psicólogos se obtiene dinámicamente del backend
- Hay una lista de respaldo por si el backend falla
- El trigger se ejecuta cada 5 minutos automáticamente