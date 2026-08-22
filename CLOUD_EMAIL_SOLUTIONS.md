# 🔧 Soluciones para Email en Entornos Cloud (Render/Vercel)

## Problema Identificado

Los logs de Render muestran:
```
❌ Failed to send alert email: Error: Connection timeout
code: 'ETIMEDOUT', command: 'CONN'
```

**Causa**: Muchos servicios cloud (incluyendo Render) bloquean conexiones SMTP salientes por razones de seguridad.

## ✅ Soluciones Propuestas

### Solución 1: Usar SendGrid API (Recomendado)

En lugar de SMTP directo, usa la API de SendGrid que no está bloqueada:

1. **Instala el SDK de SendGrid**:
```bash
npm install @sendgrid/mail
```

2. **Crea un servicio alternativo**:
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendAlertViaSendGrid(toEmail: string, alertData: any) {
  const msg = {
    to: toEmail,
    from: process.env.EMAIL_FROM || 'noreply@wellness.com',
    subject: `ALERTA: ${alertData.riskLevel} - ${alertData.studentName}`,
    html: `...tu HTML...`
  };

  await sgMail.send(msg);
}
```

3. **Configura en Render**:
```
SENDGRID_API_KEY=SG.your-api-key-here
EMAIL_FROM=noreply@wellness.com
```

### Solución 2: Usar Mailgun API

Similar a SendGrid:

1. **Instala Mailgun SDK**:
```bash
npm install mailgun.js
```

2. **Configura en Render**:
```
MAILGUN_API_KEY=your-api-key
MAILGUN_DOMAIN=your-domain.com
```

### Solución 3: Usar Gmail con OAuth2

Para evitar problemas de autenticación:

1. **Usa OAuth2 en lugar de contraseñas**
2. **Configura Google Cloud Console**
3. **Usa tokens de acceso temporales**

### Solución 4: Configuración SMTP Alternativa (Temporal)

Ya implementado en el código actual:
- Timeout más cortos (10s en lugar de indefinido)
- Retry automático con puerto 25
- TLS más permisivo

## 🚀 Implementación Inmediata

### Paso 1: Configurar SendGrid (Opción más fácil)

1. **Crea cuenta en SendGrid** (gratis hasta 100 emails/día)
2. **Genera API Key** en Settings > API Keys
3. **Agrega variable en Render**:
   ```
   SENDGRID_API_KEY=SG.your-actual-api-key
   EMAIL_FROM=your-email@wellness.com
   ```

### Paso 2: Modificar EmailService para usar SendGrid

Puedo implementar esto si lo prefieres. El cambio sería:

```typescript
private static async sendViaSendGrid(toEmail: string, alertData: any) {
  if (process.env.SENDGRID_API_KEY) {
    // Usar SendGrid API
  } else {
    // Usar SMTP existente como fallback
  }
}
```

### Paso 3: Probar

1. Despliega los cambios
2. Prueba el endpoint `/api/test/send-test-email`
3. Verifica que los emails lleguen

## 📊 Comparación de Soluciones

| Solución | Ventajas | Desventajas | Costo |
|----------|-----------|-------------|-------|
| **SendGrid API** | No bloqueado, confiable | Requiere configuración inicial | Gratis hasta 100/día |
| **Mailgun API** | Similar a SendGrid | Requiere configuración | Gratis hasta 5,000/mes |
| **Gmail SMTP** | Ya configurado | Bloqueado en cloud | Gratis |
| **SMTP Alternativo** | Sin cambios adicionales | Puede seguir fallando | Gratis |

## 🔍 Diagnóstico Actual

Lo que funciona:
- ✅ Sistema de alertas genera alertas correctamente
- ✅ Encuentra psicólogos en base de datos
- ✅ Lógica de envío de emails funciona

Lo que falla:
- ❌ Conexión SMTP timeout (bloqueo de red)
- ❌ Puerto 587 no accesible desde Render

## 🎯 Recomendación

**Usar SendGrid API** porque:
1. No está bloqueado por servicios cloud
2. Más confiable que SMTP
3. Fácil de implementar
4. Plan gratuito generoso
5. Mejor deliverability

## ¿Quieres que implemente SendGrid API?

Puedo:
1. Agregar el SDK de SendGrid al proyecto
2. Modificar EmailService para usar SendGrid como primario
3. Mantener SMTP como fallback
4. Actualizar la documentación
5. Probar la implementación

Esto resolverá definitivamente el problema de emails en Render.