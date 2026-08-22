# 🔧 Corrección de Configuración SMTP en Render

## Problema Identificado

Los logs de Render muestran el error:
```
Error: getaddrinfo ENOTFOUND ssmtp.sendgrid.net
```

**Causa**: La variable `SMTP_HOST` está configurada como `ssmtp.sendgrid.net` (incorrecto) en lugar de `smtp.sendgrid.net` (correcto).

## Solución

### Paso 1: Corregir la variable en Render

1. Ve a tu dashboard de Render
2. Selecciona tu servicio backend
3. Ve a **Environment** (o **Environment Variables**)
4. Busca la variable `SMTP_HOST`
5. Cámbiala de `ssmtp.sendgrid.net` a `smtp.sendgrid.net`
6. Guarda los cambios
7. El servicio se reiniciará automáticamente

### Paso 2: Verificar otras variables SMTP

Asegúrate de que estas variables también estén configuradas correctamente:

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey  # Para SendGrid, usa "apikey"
SMTP_PASSWORD=tu-api-key-de-sendgrid  # Tu API Key real de SendGrid
EMAIL_FROM=noreply@wellness.com
```

### Paso 3: Obtener API Key de SendGrid (si no la tienes)

1. Ve a [SendGrid](https://sendgrid.com/)
2. Inicia sesión o crea una cuenta
3. Ve a **Settings** > **API Keys**
4. Crea una nueva API Key con permisos de "Mail Send"
5. Copia la API Key generada
6. Úsala como `SMTP_PASSWORD` en Render

### Paso 4: Prueba después del cambio

Una vez que Render reinicie el servicio:

1. Realiza una nueva evaluación con riesgo alto
2. Revisa los logs de Render
3. Verifica que ya no aparezca el error `ENOTFOUND ssmtp.sendgrid.net`
4. Verifica que recibes el email en `riverahoyoskevinfernando6@gmail.com`

## 📊 Análisis de los Logs Actuales

### ✅ Lo que funciona:
- Sistema de alertas genera alertas correctamente (ID: 70)
- Email enviado exitosamente a `psicologo@wellness.com`
- Sistema de notificaciones push funciona (aunque es placeholder)

### ❌ Lo que falla:
- Email a `riverahoyoskevinfernando6@gmail.com` falla por error DNS
- Configuración SMTP incorrecta (`ssmtp.sendgrid.net` vs `smtp.sendgrid.net`)

## 🔍 Diagnóstico Completo

El sistema está funcionando correctamente excepto por la configuración SMTP:

1. **Generación de alertas**: ✅ Funciona
2. **Búsqueda de psicólogos**: ✅ Funciona (encontró 2 psicólogos)
3. **Envío de emails**: ❌ Falla por configuración SMTP incorrecta
4. **Notificaciones Socket.io**: ✅ Funciona
5. **Notificaciones Push**: ⚠️ Placeholder (necesita implementación)

## 🎯 Próximos Pasos

1. **Inmediato**: Corregir `SMTP_HOST` en Render
2. **Verificar**: Probar envío de emails después del cambio
3. **Opcional**: Configurar API Key real de SendGrid si estás usando SendGrid
4. **Alternativa**: Si prefieres Gmail, configura SMTP de Gmail con App Password

## 📧 Alternativa: Usar Gmail en lugar de SendGrid

Si prefieres usar Gmail:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password  # Generado en: https://myaccount.google.com/apppasswords
EMAIL_FROM=tu-email@gmail.com
```

Para generar App Password de Gmail:
1. Ve a tu cuenta de Google
2. Habilita 2FA si no está activa
3. Ve a Seguridad > App Passwords
4. Genera una nueva app password
5. Úsala como `SMTP_PASSWORD`

## ✅ Verificación

Después de corregir la configuración, deberías ver en los logs:

```
✅ Email sent to: riverahoyoskevinfernando6@gmail.com
```

En lugar de:

```
❌ Failed to send alert email to: riverahoyoskevinfernando6@gmail.com Error: getaddrinfo ENOTFOUND ssmtp.sendgrid.net
```