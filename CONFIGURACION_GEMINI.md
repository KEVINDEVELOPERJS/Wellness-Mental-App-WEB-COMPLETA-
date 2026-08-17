# Configuración de API de Gemini para Chat Empático

Este documento explica cómo configurar la API de Google Gemini para que el chat empático funcione correctamente.

## Pasos para obtener la API Key de Gemini

1. **Crear una cuenta de Google** (si no tienes una)
   - Ve a https://accounts.google.com

2. **Acceder a Google AI Studio**
   - Ve a https://makersuite.google.com/app/apikey
   - Inicia sesión con tu cuenta de Google

3. **Crear un proyecto**
   - Si es tu primera vez, te pedirá crear un proyecto
   - Dale un nombre descriptivo (ej: "Wellness Mental App")

4. **Generar la API Key**
   - En la sección de API Keys, haz clic en "Create API Key"
   - Se generará una clave que se verá algo como: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`
   - **IMPORTANTE**: Copia esta clave y guárdala en un lugar seguro

5. **Configurar la aplicación**
   - Ve al archivo `.env` en la carpeta `backend`
   - Busca la línea: `GEMINI_API_KEY="your-gemini-api-key-here"`
   - Reemplaza el texto entre comillas con tu API key real
   - Ejemplo: `GEMINI_API_KEY="AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"`

6. **Reiniciar el servidor**
   - Detén el servidor backend (Ctrl+C)
   - Vuelve a iniciarlo con `npm run dev`

## Verificación de la configuración

Una vez configurado, el chat empático debería funcionar correctamente. Si sigues recibiendo el mensaje:

> "Lo siento, el servicio de IA no está configurado correctamente. Por favor, contacta al administrador para configurar la API key de Gemini."

Verifica lo siguiente:

1. **La API key está correctamente configurada en el archivo .env**
2. **El servidor backend se reinició después de los cambios**
3. **No hay espacios adicionales o comillas en la API key**
4. **La API key es válida y activa**

## Solución de problemas

### Error: "GEMINI_API_KEY is not configured"
- Verifica que la variable de entorno esté definida en el archivo `.env`
- Asegúrate de que el archivo `.env` esté en la carpeta correcta (`backend/`)

### Error: "Invalid API key"
- Verifica que la API key sea correcta
- Asegúrate de que la API key no haya expirado
- Verifica que la API key tenga los permisos necesarios

### Error: "Quota exceeded"
- La versión gratuita de Gemini tiene límites de uso
- Considera actualizar a un plan de pago si necesitas más uso
- Verifica tu uso en la consola de Google Cloud

## Seguridad

⚠️ **IMPORTANTE**: Nunca compartas tu API key públicamente o la subas a repositorios de código. El archivo `.env` está en `.gitignore` por esta razón.

## Recursos adicionales

- Documentación oficial de Gemini: https://ai.google.dev/docs
- Google AI Studio: https://makersuite.google.com
- Precios y límites: https://ai.google.dev/pricing