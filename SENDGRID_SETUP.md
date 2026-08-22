# 🚀 Configuración de SendGrid para Wellness Mental App

## ¿Por qué SendGrid?

SendGrid API es la solución recomendada para envío de emails en entornos cloud como Render y Vercel porque:

- ✅ **No está bloqueado** por servicios cloud (a diferencia de SMTP)
- ✅ **Más confiable** que conexiones SMTP directas
- ✅ **Plan gratuito** hasta 100 emails/día
- ✅ **Mejor deliverability** (menos emails marcados como spam)
- ✅ **Fácil implementación** con SDK oficial
- ✅ **Analytics y tracking** incluidos

## 📋 Paso 1: Crear Cuenta en SendGrid

1. Ve a [SendGrid.com](https://sendgrid.com/)
2. Haz clic en **"Start for Free"** o **"Sign Up"**
3. Completa el registro con tu email
4. Verifica tu email cuando recibas el correo de confirmación

## 🔑 Paso 2: Generar API Key

1. Inicia sesión en tu cuenta de SendGrid
2. Ve a **Settings** > **API Keys** en el menú lateral
3. Haz clic en **"Create API Key"**
4. **Nombre**: "Wellness Mental App" (o el nombre que prefieras)
5. **Permisos**: Selecciona **"Mail Send"** como mínimo
6. Haz clic en **"Create & View"**
7. **IMPORTANTE**: Copia la API Key generada (empieza con `SG.`)
   - ⚠️ Solo se muestra una vez, guárdala en lugar seguro

## 📧 Paso 3: Configurar Sender Identity

Para poder enviar emails, necesitas configurar un remitente verificado:

### Opción A: Usar tu email personal (Recomendado para pruebas)

1. Ve a **Settings** > **Sender Authentication**
2. Haz clic en **"Verify Single Sender"**
3. Completa el formulario:
   - **From Email**: tu email real (ej: `riverahoyoskevinfernando6@gmail.com`)
   - **From Name**: "Wellness Mental"
   - **Reply To**: tu email
   - **Address**: tu información física (puede ser la de tu casa)
4. Haz clic en **"Create"**
5. Verifica tu email haciendo clic en el enlace de confirmación que recibirás

### Opción B: Usar un dominio personal (Para producción)

1. Ve a **Settings** > **Sender Authentication**
2. Haz clic en **"Authenticate Your Domain"**
3. Sigue las instrucciones para configurar registros DNS
4. Esto permite enviar desde cualquier email de tu dominio

## 🔧 Paso 4: Configurar Variables de Entorno en Render

1. Ve a tu dashboard de [Render](https://dashboard.render.com/)
2. Selecciona tu servicio backend
3. Ve a **Environment** (o **Environment Variables**)
4. Agrega las siguientes variables:

```
SENDGRID_API_KEY=SG.your-actual-api-key-here
EMAIL_FROM=riverahoyoskevinfernando6@gmail.com
```

**IMPORTANTE**:
- `SENDGRID_API_KEY`: Reemplaza con tu API Key real de SendGrid
- `EMAIL_FROM`: Debe ser el mismo email que verificaste en SendGrid

## 🧪 Paso 5: Probar la Configuración

### Prueba con Endpoint de Diagnóstico

1. Despliega los cambios en Render
2. Usa el endpoint de prueba:
   ```
   POST /api/test/send-test-email
   Body: { "toEmail": "riverahoyoskevinfernando6@gmail.com" }
   ```
3. Verifica que recibes el email de prueba

### Prueba con Alerta Real

1. Realiza una evaluación con riesgo alto en la app
2. Revisa los logs de Render - deberías ver:
   ```
   🚀 Using SendGrid API for email to: riverahoyoskevinfernando6@gmail.com
   ✅ Email sent successfully via SendGrid to: riverahoyoskevinfernando6@gmail.com
   ```
3. Verifica que recibes el email de alerta

## 📊 Paso 6: Monitorear con SendGrid Dashboard

SendGrid ofrece analytics detallados:

1. Ve a **Activity** en el dashboard de SendGrid
2. Verás todos los emails enviados
3. Puedes ver:
   - Emails entregados
   - Emails abiertos
   - Clics en enlaces
   - Emails rebotados
   - Spam reports

## 🔒 Seguridad Best Practices

1. **Nunca commits** API Keys en el código
2. **Usa variables de entorno** siempre
3. **Limita permisos** de API Keys (solo "Mail Send" necesario)
4. **Usa API Keys separadas** para desarrollo y producción
5. **Monitorea Activity** regularmente para detectar uso anormal

## 🎯 Configuración SMTP Fallback

El sistema usa SendGrid API como primario, pero mantiene SMTP como fallback:

```typescript
// El flujo es:
1. Intenta SendGrid API (funciona en cloud)
2. Si falla, usa SMTP como fallback
3. Si SMTP falla, intenta puerto 25
4. Si todo falla, log error pero no bloquea el sistema
```

**Variables SMTP opcionales** (si quieres mantener fallback):
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASSWORD=tu-app-password
```

## 📈 Planes y Límites de SendGrid

**Plan Free**:
- 100 emails/día
- Hasta 2,000 emails/mes
- API completo
- Analytics básico

**Plan Pro** (si necesitas más):
- $15/mes para 40,000 emails
- Analytics avanzado
- Soporte prioritario

Para tu app de Wellness Mental, el plan free debería ser suficiente inicialmente.

## 🐛 Solución de Problemas

### Email no llega:

1. **Verifica API Key**: Confirma que sea correcta y no haya expirado
2. **Verifica Sender**: El email `EMAIL_FROM` debe estar verificado en SendGrid
3. **Revisa logs de SendGrid**: Activity en dashboard muestra detalles
4. **Revisa spam folder**: A veces emails van a spam

### Error de autenticación:

1. Verifica que la API Key tenga permisos "Mail Send"
2. Regenera la API Key si sospechas que está comprometida

### Rate limiting:

- Plan free: 100 emails/día
- Si excedes, recibirás error 429
- Considera upgrade si necesitas más volumen

## ✅ Checklist de Configuración

- [ ] Cuenta de SendGrid creada
- [ ] API Key generada y guardada
- [ ] Sender identity verificada
- [ ] Variables de entorno configuradas en Render
- [ ] Email de prueba enviado exitosamente
- [ ] Alerta real probada y recibida
- [ ] Logs de SendGrid revisados
- [ ] Plan de monitoreo establecido

## 🎉 ¡Listo!

Una vez completada esta configuración, tu sistema de emails funcionará de manera confiable en Render y otras plataformas cloud.

Los psicólogos recibirán alertas de riesgo alto automáticamente, y el sistema tendrá un fallback robusto en caso de problemas.

## 📞 Soporte

- **Documentación SendGrid**: https://docs.sendgrid.com/
- **Foro SendGrid**: https://stackoverflow.com/questions/tagged/sendgrid
- **Soporte Render**: https://render.com/docs