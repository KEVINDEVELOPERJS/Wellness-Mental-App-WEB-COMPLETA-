# Configuración de API Key de Gemini en Render

## Problema: El chat IA sigue mostrando "servicio no configurado" en Render

Este problema ocurre cuando la variable de entorno `GEMINI_API_KEY` no está correctamente configurada en el panel de Render.

## Pasos para configurar en Render

### 1. Obtener tu API Key de Gemini
1. Ve a https://makersuite.google.com/app/apikey
2. Inicia sesión con tu cuenta de Google
3. Crea un nuevo proyecto o selecciona uno existente
4. Haz clic en "Create API Key"
5. Copia la API key generada (comienza con `AIzaSy...`)

### 2. Configurar en Render
1. Ve a tu dashboard de Render: https://dashboard.render.com
2. Selecciona tu servicio backend
3. Ve a la sección "Environment" (o "Environment Variables")
4. Agrega una nueva variable de entorno:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: Tu API key de Gemini (pega la clave que copiaste)
5. Haz clic en "Save Changes"
6. **IMPORTANTE**: Reinicia el servicio (deploy) para que los cambios surtan efecto

### 3. Verificar la configuración
Después de reiniciar el servicio, verifica los logs en Render:
1. Ve a la sección "Logs" de tu servicio
2. Busca mensajes que contengan "GEMINI API"
3. Deberías ver mensajes como:
   - `=== GEMINI API CALL ===`
   - `API Key configured: true`
   - `API Key length: 39`

Si ves `API Key configured: false`, significa que la variable no está configurada correctamente.

## Solución de problemas comunes

### Error: "API KEY INVALID"
- **Causa**: La API key es incorrecta o ha expirado
- **Solución**: Verifica que la API key sea correcta y esté activa en Google AI Studio

### Error: "RATE LIMIT EXCEEDED"
- **Causa**: Se ha excedido el límite de uso de la API gratuita
- **Solución**: Considera actualizar a un plan de pago o reducir el uso

### Error: "NETWORK ERROR"
- **Causa**: Problemas de conexión entre Render y Google
- **Solución**: Verifica que el servicio tenga acceso a internet

### La variable no aparece en los logs
- **Causa**: La variable no se guardó correctamente en Render
- **Solución**: 
  1. Borra la variable y agrégala nuevamente
  2. Asegúrate de hacer clic en "Save Changes"
  3. Reinicia el servicio manualmente

## Verificación local vs producción

### Local (funciona correctamente)
En local, el archivo `.env` debe contener:
```
GEMINI_API_KEY=tu-api-key-aqui
```

### Producción (Render)
En Render, la variable debe estar configurada en el panel de Environment:
- Key: `GEMINI_API_KEY`
- Value: `tu-api-key-aqui`

## Logs de depuración mejorados

El código ahora incluye logs detallados para ayudar a identificar el problema:

```
=== GEMINI API KEY CONFIGURATION ERROR ===
GEMINI_API_KEY is not configured in environment variables
All environment variables: [...]
API-related env vars: [...]
NODE_ENV: production
=====================================
```

O si está configurada correctamente:

```
=== GEMINI API CALL ===
Calling Gemini API with message: Hola
API Key configured: true
API Key length: 39
API Key prefix: AIzaSyXXXX...
=======================
```

## Soporte

Si después de seguir estos pasos el problema persiste:
1. Verifica los logs de Render en busca de errores específicos
2. Asegúrate de que tu API key de Gemini esté activa y tenga los permisos necesarios
3. Verifica que el servicio de Render tenga acceso a internet
4. Considera contactar al soporte de Render si hay problemas con las variables de entorno