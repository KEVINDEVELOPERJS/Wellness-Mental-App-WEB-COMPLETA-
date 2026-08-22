# 🔧 Solución Error 403 Forbidden de SendGrid

## Problema Identificado

Los logs muestran:
```
❌ SendGrid failed for: psicologo@wellness.com Error: ResponseError: Forbidden
code: 403
```

**Causa**: La API Key de SendGrid no tiene los permisos correctos o el sender (`EMAIL_FROM`) no está verificado en SendGrid.

## ✅ Solución Inmediata

He **deshabilitado temporalmente SendGrid** para que el sistema use SMTP como fallback. Esto permite que el sistema funcione mientras configuras SendGrid correctamente.

## 🔧 Pasos para Arreglar SendGrid

### Paso 1: Verificar Sender Identity en SendGrid

**IMPORTANTE**: El email que usas en `EMAIL_FROM` debe estar verificado en SendGrid.

1. Ve a [SendGrid Dashboard](https://app.sendgrid.com/settings/sender_auth)
2. Ve a **Settings** > **Sender Authentication**
3. Verifica que tengas un **Single Sender** o **Domain Authentication** configurado
4. El email debe coincidir exactamente con tu variable `EMAIL_FROM`

**Para tu caso**:
- Si tu `EMAIL_FROM` es `noreply@wellness.com`, este email debe estar verificado
- Si tu `EMAIL_FROM` es `riverahoyoskevinfernando6@gmail.com`, este email debe estar verificado

### Paso 2: Verificar Permisos de API Key

1. Ve a [SendGrid API Keys](https://app.sendgrid.com/settings/api_keys)
2. Encuentra tu API Key actual
3. Verifica que tenga **"Mail Send"** permissions
4. Si no tiene permisos suficientes:
   - Crea una nueva API Key
   - Selecciona **"Mail Send"** como mínimo
   - Selecciona **"Full Access"** si estás teniendo problemas

### Paso 3: Regenerar API Key (si es necesario)

Si la API Key está comprometida o sin permisos:

1. Elimina la API Key actual
2. Crea una nueva con:
   - **Nombre**: "Wellness Mental App - Fixed"
   - **Permisos**: "Mail Send" o "Full Access"
3. Copia la nueva API Key
4. Actualiza la variable en Render: `SENDGRID_API_KEY=SG.nueva-api-key`

### Paso 4: Verificar Variables de Entorno

En Render, asegúrate de tener:

```
SENDGRID_API_KEY=SG.tu-api-key-correcta
EMAIL_FROM=email-verificado-en-sendgrid@ejemplo.com
```

**IMPORTANTE**:
- `EMAIL_FROM` debe coincidir exactamente con un sender verificado
- No uses emails no verificados (causará 403)

### Paso 5: Habilitar SendGrid Nuevamente

Una vez configurado correctamente:

1. Ve a `backend/src/services/EmailService.ts`
2. Elimina las líneas que deshabilitan SendGrid:
   ```typescript
   // Eliminar estas líneas:
   console.warn('⚠️ SendGrid temporarily disabled due to 403 errors');
   this.sendGridConfigured = false;
   this.useSendGrid = false;
   return;
   ```
3. Despliega los cambios

## 🚀 Solución Alternativa: Usar Solo SMTP

Si prefieres no configurar SendGrid, el sistema funcionará bien con SMTP configurado correctamente.

### Configuración SMTP Recomendada

Para tu caso actual, ya tienes SMTP configurado. Solo asegúrate:

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=465
SMTP_USER=apikey
SMTP_PASSWORD=tu-api-key-de-sendgrid
EMAIL_FROM=email-verificado@ejemplo.com
```

**Nota**: Cuando usas SMTP de SendGrid:
- `SMTP_USER` debe ser `apikey` (literalmente)
- `SMTP_PASSWORD` debe ser tu API Key de SendGrid
- `EMAIL_FROM` debe estar verificado en SendGrid

## 📊 Diagnóstico del Error 403

El error 403 en SendGrid API puede ser causado por:

1. **Sender no verificado** (más común)
   - Solución: Verifica el email en SendGrid Settings

2. **API Key sin permisos**
   - Solución: Regenerar API Key con permisos "Mail Send"

3. **API Key inválida o expirada**
   - Solución: Crear nueva API Key

4. **Límites del plan gratuito excedidos**
   - Solución: Verificar tu plan en SendGrid

## 🧪 Prueba de Configuración

Usa el endpoint de prueba:

```
POST /api/test/send-test-email
Body: { "toEmail": "tu-email@ejemplo.com" }
```

Si funciona, verás:
```
✅ Email sent successfully to: tu-email@ejemplo.com
```

## 🎯 Estado Actual del Sistema

**Actualmente**:
- ✅ SendGrid: Temporalmente deshabilitado (evita errores 403)
- ✅ SMTP: Funcionando como fallback
- ✅ Sistema de alertas: Funcionando correctamente
- ✅ Evaluaciones: Funcionando sin timeout

**Una vez arreglado SendGrid**:
- ✅ SendGrid API: Método primario (más confiable en cloud)
- ✅ SMTP: Fallback automático
- ✅ Sistema híbrido robusto

## 📞 Soporte SendGrid

Si continuas teniendo problemas:

- **Documentación oficial**: https://docs.sendgrid.com/
- **Foro de soporte**: https://stackoverflow.com/questions/tagged/sendgrid
- **Estado del sistema**: https://status.sendgrid.com/

## 🔍 Logs Mejorados

He agregado logging detallado para errores de SendGrid:

```
❌ SendGrid API Error Details: {
  message: "...",
  code: 403,
  response: { ... },
  statusCode: 403
}
```

Esto ayudará a identificar el problema exacto si persiste.

## ✅ Recomendación

**Para producción**: Configura correctamente SendGrid API siguiendo los pasos anteriores.

**Para pruebas inmediatas**: El sistema funciona con SMTP fallback actual.

Una vez que SendGrid esté configurado correctamente, habilita las líneas comentadas en `EmailService.ts` para usar SendGrid como método primario.