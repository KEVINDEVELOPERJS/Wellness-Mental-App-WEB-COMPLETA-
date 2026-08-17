# Guía de Solución de Problemas - CORS y Despliegue

## Problemas Actuales
Los errores de CORS persisten entre el frontend (Vercel) y el backend (Render).

## Cambios Realizados

### Backend (Render)
1. **Middleware de Rate Limiting**: Modificado para saltar solicitudes OPTIONS (preflight)
2. **Error Handlers**: Agregados headers CORS a todas las respuestas de error
3. **Configuración CORS**: Mejorada con configuración específica para Vercel
4. **Auth Middleware**: Headers CORS agregados a respuestas de autenticación

### Frontend (Vercel)
1. **API URL**: Configurada correctamente a la URL de Render
2. **Response Structure**: Corregida para manejar estructura de respuesta del backend
3. **Error Handling**: Mejorado con logging extensivo
4. **ID Validation**: Agregada validación para IDs inválidos (NaN)

## Pasos de Solución de Problemas

### 1. Verificar Despliegue de Render
- Ve al dashboard de Render
- Verifica que el último commit (962d1482) esté desplegado
- Revisa los logs de Render para errores

### 2. Configurar Variables de Entorno en Render
En el dashboard de Render:
1. Ve a tu servicio → Settings → Environment Variables
2. Asegúrate de que estas variables estén configuradas:
   - `NODE_ENV`: `production`
   - `PORT`: `3001`
   - `CORS_ORIGIN`: `https://wellness-mental-app-web-completa.vercel.app`
3. Si faltan, agrégalas manualmente
4. Redespliega el servicio

### 3. Verificar Configuración de Vercel
1. Ve al dashboard de Vercel
2. Verifica que el frontend esté desplegado con los últimos cambios
3. Revisa las variables de entorno del frontend si las hay

### 4. Probar Manualmente los Endpoints
Usa curl o Postman para probar directamente:

```bash
# Test health endpoint
curl https://wellness-mental-app-web-completa.onrender.com/health

# Test CORS preflight
curl -X OPTIONS https://wellness-mental-app-web-completa.onrender.com/api/evaluacion/cuestionarios \
  -H "Origin: https://wellness-mental-app-web-completa.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -v
```

### 5. Verificar Logs del Navegador
1. Abre la aplicación en Vercel
2. Abre las herramientas de desarrollador (F12)
3. Ve a la pestaña Console
4. Intenta usar las funciones de evaluación y chat
5. Busca mensajes de error específicos
6. Revisa la pestaña Network para ver las solicitudes fallidas

### 6. Verificar Headers de Respuesta
En las herramientas de desarrollador:
1. Ve a la pestaña Network
2. Filtra por las solicitudes fallidas
3. Haz clic en cada solicitud fallida
4. Revisa los Response Headers
5. Deberías ver:
   - `Access-Control-Allow-Origin: https://wellness-mental-app-web-completa.vercel.app`
   - `Access-Control-Allow-Credentials: true`

## Soluciones Alternativas

### Opción 1: Usar Proxy en Vercel
Si los problemas de CORS persisten, considera usar un proxy en Vercel:

```typescript
// vercel.json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://wellness-mental-app-web-completa.onrender.com/api/:path*"
    }
  ]
}
```

### Opción 2: Mover Todo a un Solo Proveedor
Considera desplegar tanto el frontend como el backend en el mismo proveedor:
- Todo en Vercel (usando Vercel Functions para el backend)
- Todo en Render (usando Render Static Sites para el frontend)

### Opción 3: Configurar CORS de Forma Más Permisiva
Como solución temporal, puedes configurar CORS para permitir todos los orígenes:

```typescript
app.use(cors({
  origin: '*', // Permitir todos los orígenes (no recomendado para producción)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
```

## Verificación Post-Solución

Después de implementar una solución:

1. **Limpia el caché del navegador**
2. **Prueba la evaluación**: Completa un cuestionario y verifica que funcione
3. **Prueba el chat**: Envía un mensaje al asistente IA
4. **Verifica los logs**: Revisa que no haya errores en la consola
5. **Prueba en diferentes navegadores**: Chrome, Firefox, Safari

## Logs Importantes a Monitorear

### Backend (Render)
- "CORS request from:" - Para ver qué orígenes están solicitando
- Errores de rate limiting
- Errores de autenticación
- Errores de base de datos

### Frontend (Navegador)
- "Network/CORS Error:" - Errores de red/CORS
- "Error in [función]:" - Errores específicos de servicios
- Respuestas con status 401, 403, 404, 500

## Contacto para Soporte

Si los problemas persisten después de seguir estos pasos:
1. Documenta los pasos que has intentado
2. Captura screenshots de los errores
3. Comparte los logs relevantes
4. Proporciona información sobre:
   - Navegador y versión
   - Sistema operativo
   - Timestamp del problema
   - Funcionalidad específica que falla