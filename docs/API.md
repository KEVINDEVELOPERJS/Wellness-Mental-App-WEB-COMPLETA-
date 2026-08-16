# API Documentation - Wellness Mental Web App

## 📡 Base URL

**Development:** `http://localhost:3001/api`
**Production:** `https://your-domain.com/api`

## 🔐 Autenticación

La mayoría de los endpoints requieren autenticación JWT. Incluye el token en el header:

```
Authorization: Bearer <access_token>
```

## 📋 Endpoints

### Autenticación

#### POST /auth/registro
Registra un nuevo usuario estudiante.

**Request Body:**
```json
{
  "nombre": "string (2-100 chars)",
  "email": "string (valid email)",
  "password": "string (min 8 chars, uppercase, lowercase, number)",
  "edad": "number (13-18)",
  "grado": "string",
  "telefono": "string (optional)"
}
```

**Response:** `200 OK`
```json
{
  "usuario": {
    "id": 1,
    "nombre": "string",
    "email": "string",
    "rol": "ESTUDIANTE"
  },
  "accessToken": "string",
  "refreshToken": "string"
}
```

#### POST /auth/login
Inicia sesión de usuario.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:** `200 OK`
```json
{
  "usuario": { ... },
  "accessToken": "string",
  "refreshToken": "string"
}
```

#### POST /auth/refresh-token
Refresca el access token.

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "string"
}
```

#### POST /auth/logout
Cierra sesión de usuario.

**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

#### GET /auth/me
Obtiene información del usuario autenticado.

**Response:** `200 OK`
```json
{
  "id": 1,
  "nombre": "string",
  "email": "string",
  "edad": 16,
  "grado": "string",
  "rol": "ESTUDIANTE"
}
```

### Evaluación

#### GET /evaluacion/cuestionarios
Obtiene lista de cuestionarios disponibles.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "titulo": "string",
    "descripcion": "string",
    "categoria": "string",
    "estado": "publicado"
  }
]
```

#### GET /evaluacion/cuestionarios/:id
Obtiene detalles de un cuestionario con preguntas.

**Response:** `200 OK`
```json
{
  "id": 1,
  "titulo": "string",
  "preguntas": [
    {
      "id": 1,
      "texto": "string",
      "tipoRespuesta": "likert",
      "peso": 1.0,
      "orden": 1,
      "opciones": "[...]"
    }
  ]
}
```

#### POST /evaluacion/guardar
Guarda respuestas de evaluación y genera resultado.

**Request Body:**
```json
{
  "cuestionarioId": 1,
  "respuestas": [
    {
      "preguntaId": 1,
      "valor": 2
    }
  ]
}
```

**Response:** `200 OK`
```json
{
  "resultado": {
    "id": 1,
    "puntaje": 14,
    "nivelRiesgo": "MEDIO",
    "prediagnostico": "string",
    "fechaEvaluacion": "2024-01-15T10:00:00Z"
  }
}
```

#### GET /evaluacion/resultados
Obtiene historial de evaluaciones del usuario.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "puntaje": 14,
    "nivelRiesgo": "MEDIO",
    "fechaEvaluacion": "2024-01-15T10:00:00Z",
    "cuestionario": { ... }
  }
]
```

### Chat

#### POST /chat/sesion
Inicia una nueva sesión de chat.

**Response:** `200 OK`
```json
{
  "id": 1,
  "usuarioId": 1,
  "fechaInicio": "2024-01-15T10:00:00Z",
  "activa": true
}
```

#### POST /chat/mensaje
Envía un mensaje al chat IA.

**Request Body:**
```json
{
  "contenido": "string",
  "chatSessionId": 1
}
```

**Response:** `200 OK`
```json
{
  "mensaje": {
    "id": 1,
    "contenido": "string",
    "remitente": "ia",
    "fechaMensaje": "2024-01-15T10:00:00Z"
  },
  "sentimientoUsuario": 0.5,
  "requiereAlerta": false
}
```

#### GET /chat/historial
Obtiene historial de sesiones de chat.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "fechaInicio": "2024-01-15T10:00:00Z",
    "mensajes": [ ... ]
  }
]
```

### Ejercicios

#### GET /ejercicios
Obtiene lista de ejercicios disponibles.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "titulo": "Respiración 4-7-8",
    "descripcion": "string",
    "tipo": "RESPIRACION",
    "duracionMinima": 3,
    "duracionMaxima": 10
  }
]
```

#### POST /ejercicios/progreso
Registra progreso de ejercicio completado.

**Request Body:**
```json
{
  "ejercicioId": 1,
  "duracionReal": 5,
  "completado": true,
  "satisfaccion": 5
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "ejercicioId": 1,
  "duracionReal": 5,
  "completado": true,
  "fechaCompletado": "2024-01-15T10:00:00Z"
}
```

#### GET /ejercicios/racha
Obtiene racha de días consecutivos.

**Response:** `200 OK`
```json
{
  "rachaDias": 7
}
```

### Comunidad

#### POST /comunidad/posts
Crea un nuevo post en la comunidad.

**Request Body:**
```json
{
  "titulo": "string (max 200 chars)",
  "contenido": "string (max 2000 chars)",
  "categoria": "string"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "titulo": "string",
  "contenido": "string",
  "categoria": "string",
  "fecha": "2024-01-15T10:00:00Z",
  "likes": 0
}
```

#### GET /comunidad/posts
Obtiene posts de la comunidad (paginado).

**Query Params:**
- `categoria` (optional): Filtrar por categoría
- `page` (default: 1): Número de página
- `limit` (default: 20): Items por página

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "titulo": "string",
    "contenido": "string",
    "usuario": { ... },
    "likes": 5,
    "comentarios": [ ... ]
  }
]
```

#### POST /comunidad/posts/:id/like
Da like a un post.

**Response:** `200 OK`
```json
{
  "id": 1,
  "likes": 6
}
```

#### POST /comunidad/comentarios
Agrega comentario a un post.

**Request Body:**
```json
{
  "postId": 1,
  "contenido": "string",
  "parentId": 1
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "postId": 1,
  "contenido": "string",
  "fecha": "2024-01-15T10:00:00Z"
}
```

### Gamificación

#### GET /gamificacion/logros
Obtiene lista de logros disponibles.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "nombre": "Primer Chat",
    "descripcion": "Inicia tu primera conversación",
    "puntos": 200,
    "icono": "💬"
  }
]
```

#### GET /gamificacion/logros/usuario
Obtiene logros desbloqueados por el usuario.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "logro": { ... },
    "fechaDesbloqueado": "2024-01-15T10:00:00Z"
  }
]
```

#### GET /gamificacion/nivel
Obtiene nivel actual del usuario.

**Response:** `200 OK`
```json
{
  "nivel": "Guardián",
  "puntosActuales": 750,
  "puntosSiguienteNivel": 1500,
  "progreso": 50
}
```

#### POST /gamificacion/puntos
Otorga puntos al usuario (trigger logro check).

**Request Body:**
```json
{
  "tipoActividad": "ejercicio",
  "cantidad": 50
}
```

**Response:** `200 OK`
```json
{
  "message": "Points awarded",
  "nuevosLogros": [ ... ]
}
```

### Informes

#### POST /informes/generar
Genera un informe para padres (solo psicólogos).

**Request Body:**
```json
{
  "resultadoId": 1,
  "padreId": 2
}
```

**Response:** `200 OK`
```json
{
  "informeId": 1,
  "tokenAcceso": "string",
  "expiracion": "2024-01-16T10:00:00Z"
}
```

#### GET /informe/:token
Obtiene informe usando token de acceso (público con token).

**Response:** `200 OK`
```json
{
  "resumen": "string",
  "detalle": { ... },
  "recomendaciones": "string",
  "nivelRiesgo": "MEDIO"
}
```

#### GET /informe/:token/pdf
Descarga informe en PDF.

**Response:** `200 OK` (PDF file)

### Alertas

#### GET /alertas/pendientes
Obtiene alertas pendientes (solo psicólogos).

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "estudiante": { ... },
    "tipo": "evaluacion",
    "nivelRiesgo": "ALTO",
    "timestamp": "2024-01-15T10:00:00Z",
    "estado": "PENDIENTE"
  }
]
```

#### PATCH /alertas/:id
Actualiza estado de alerta (solo psicólogos).

**Request Body:**
```json
{
  "estado": "ATENDIDA",
  "notas": "string"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "estado": "ATENDIDA",
  "notas": "string"
}
```

#### GET /alertas/:id/auditoria
Obtiene log de auditoría de alerta.

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "accion": "Estado cambiado a ATENDIDA",
    "timestamp": "2024-01-15T10:00:00Z",
    "ip": "string",
    "detalles": "string"
  }
]
```

### Perfil

#### GET /perfil/estadisticas
Obtiene estadísticas del usuario.

**Response:** `200 OK`
```json
{
  "ejerciciosCompletados": 10,
  "chatsRealizados": 5,
  "evaluacionesCompletadas": 3,
  "postsComunidad": 2,
  "puntos": 750,
  "nivel": "Guardián",
  "rachaDias": 7
}
```

#### PATCH /perfil
Actualiza perfil de usuario.

**Request Body:**
```json
{
  "nombre": "string",
  "telefono": "string",
  "avatar": "string"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "nombre": "string",
  "telefono": "string",
  "avatar": "string"
}
```

#### POST /perfil/password
Cambia contraseña del usuario.

**Request Body:**
```json
{
  "passwordActual": "string",
  "passwordNueva": "string"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password updated successfully"
}
```

#### POST /perfil/invitacion-padre
Genera código de invitación para padres.

**Response:** `200 OK`
```json
{
  "codigo": "ABC12345",
  "validoPor": "7 días"
}
```

#### GET /perfil/descargar-datos
Descarga datos personales del usuario (GDPR).

**Response:** `200 OK` (JSON file)

## ⚠️ Códigos de Error

| Código | Descripción |
|--------|-------------|
| 400 | Bad Request - Validación fallida |
| 401 | Unauthorized - Token inválido o expirado |
| 403 | Forbidden - Permisos insuficientes |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Recurso ya existe |
| 429 | Too Many Requests - Rate limit excedido |
| 500 | Internal Server Error - Error del servidor |

## 🔒 Seguridad

### Headers
- `Authorization`: Bearer token para endpoints protegidos
- `Content-Type`: application/json
- `X-Request-ID`: ID único para tracking

### Rate Limiting
- `/auth/*`: 5 requests por 15 minutos
- `/api/*`: 100 requests por 15 minutos
- `/alertas/*`: 5 requests por minuto

### Validación
- Todos los inputs validados con Zod schemas
- Sanitización de datos sensibles
- Encriptación de datos en reposo

## 📡 WebSockets

### Conexión
```
const socket = io('http://localhost:3001', {
  auth: { token: 'access_token' }
});
```

### Events

**Cliente → Servidor:**
- `authenticate` - Autenticar conexión
- `chat_message` - Enviar mensaje

**Servidor → Cliente:**
- `nueva_alerta` - Nueva alerta de riesgo
- `chat_response` - Respuesta de IA
- `notification` - Notificación push

---

**Para más información, contacta al equipo de desarrollo.**
