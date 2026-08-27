# Arquitectura MVC - Wellness Mental Web App

## 🏗️ Visión General

La aplicación sigue una arquitectura MVC (Model-View-Controller) clásica adaptada para aplicaciones web modernas con separación clara de responsabilidades.

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (VISTA)                        │
│  React SPA + TypeScript + Zustand + Tailwind CSS            │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/HTTPS + WebSockets
                              │
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (CONTROLADOR)                      │
│  Express + TypeScript + Middleware + Socket.io               │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Prisma ORM
                              │
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (MODELO)                         │
│  PostgreSQL + Redis + Entities + Repositories                │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Capa VISTA (Frontend)

### Responsabilidades
- Presentación de interfaz de usuario
- Gestión de estado local y global
- Validación de formularios en cliente
- Comunicación con API backend
- Soporte offline con IndexedDB
- PWA capabilities

### Componentes Principales

#### Pages (Rutas)
- `LoginPage.tsx` - Autenticación de usuarios
- `RegistroPage.tsx` - Registro de estudiantes
- `DashboardPage.tsx` - Panel principal
- `EvaluacionPage.tsx` - Cuestionarios psicológicos
- `ChatIAPage.tsx` - Chat con asistente IA
- `EjerciciosPage.tsx` - Ejercicios de respiración
- `ComunidadPage.tsx` - Foro comunitario
- `JuegosPage.tsx` - Gamificación
- `PerfilPage.tsx` - Gestión de perfil
- `NotificacionesPage.tsx` - Centro de notificaciones
- `InformePadresPage.tsx` - Informes para padres
- `AlertasPsicologoPage.tsx` - Panel de alertas

#### Components (UI)
- `layout/` - Layouts principales (MainLayout, Sidebar, Header)
- `evaluation/` - Componentes de evaluación (MoodTracker, RiskGauge)
- `exercise/` - Componentes de ejercicios (BreathingAnimation, CircularProgress)
- `community/` - Componentes de comunidad (PostCard, PostList)
- `chat/` - Componentes de chat (ChatBubble, ChatWindow)
- `dialogs/` - Modales y diálogos

#### Hooks (Controladores Frontend)
- `useAuth.ts` - Gestión de autenticación
- `useEvaluacion.ts` - Lógica de cuestionarios
- `useChatIA.ts` - Integración con API de IA
- `useEjercicio.ts` - Control de ejercicios
- `useComunidad.ts` - Posts y moderación
- `useGamificacion.ts` - Puntos y logros
- `useInforme.ts` - Generación de informes
- `useAlerta.ts` - Detección de alertas
- `usePerfil.ts` - Gestión de perfil
- `useSync.ts` - Sincronización offline/online
- `useNotification.ts` - Web Push API

#### Services (Clientes API)
- `apiClient.ts` - Axios instance con interceptores
- `authService.ts` - Endpoints de autenticación
- `evaluacionService.ts` - Endpoints de evaluación
- `chatService.ts` - Endpoints de chat
- `ejercicioService.ts` - Endpoints de ejercicios
- `comunidadService.ts` - Endpoints de comunidad
- `gamificacionService.ts` - Endpoints de gamificación
- `informeService.ts` - Endpoints de informes
- `alertaService.ts` - Endpoints de alertas

#### Store (Estado Global)
- `authStore.ts` - Estado de autenticación (Zustand)
- `uiStore.ts` - Estado de UI (tema, modales, toasts)
- `offlineStore.ts` - Estado offline + IndexedDB

## 🎮 Capa Controlador (Backend)

### Responsabilidades
- Recibir requests HTTP
- Validar y procesar datos
- Coordinar servicios de negocio
- Enviar respuestas HTTP
- Manejar errores y excepciones
- Implementar middleware de seguridad

### Componentes Principales

#### Controllers
- `AuthController.ts` - Gestión de autenticación
- `EvaluacionController.ts` - Lógica de cuestionarios
- `ChatIAController.ts` - Integración con IA
- `EjercicioController.ts` - Control de ejercicios
- `ComunidadController.ts` - Moderación de comunidad
- `GamificacionController.ts` - Sistema de puntos
- `InformeController.ts` - Generación de informes
- `AlertaController.ts` - Sistema de alertas
- `PerfilController.ts` - Gestión de perfil

#### Routes
- `auth.routes.ts` - Rutas de autenticación
- `evaluacion.routes.ts` - Rutas de evaluación
- `chat.routes.ts` - Rutas de chat
- `ejercicio.routes.ts` - Rutas de ejercicios
- `comunidad.routes.ts` - Rutas de comunidad
- `gamificacion.routes.ts` - Rutas de gamificación
- `informe.routes.ts` - Rutas de informes
- `alerta.routes.ts` - Rutas de alertas
- `perfil.routes.ts` - Rutas de perfil

#### Middleware
- `authMiddleware.ts` - Verificación JWT
- `validationMiddleware.ts` - Validación de inputs (Zod)
- `rateLimitMiddleware.ts` - Rate limiting
- `auditMiddleware.ts` - Logs de auditoría
- `errorHandler.ts` - Manejo centralizado de errores

## 🗄️ Capa Modelo (Backend)

### Responsabilidades
- Definición de entidades del dominio
- Lógica de negocio
- Acceso a datos
- Validaciones de negocio
- Encriptación de datos sensibles

### Componentes Principales

#### Entities (Entidades)
- `Usuario.ts` - Usuario del sistema
- `Cuestionario.ts` - Cuestionarios psicológicos
- `Pregunta.ts` - Preguntas de cuestionarios
- `Respuesta.ts` - Respuestas de usuarios
- `Resultado.ts` - Resultados de evaluaciones
- `ChatSession.ts` - Sesiones de chat
- `MensajeChat.ts` - Mensajes del chat
- `Ejercicio.ts` - Ejercicios de bienestar
- `ProgresoEjercicio.ts` - Progreso de usuarios
- `PostComunidad.ts` - Posts de comunidad
- `Logro.ts` - Logros del sistema
- `UsuarioLogro.ts` - Logros desbloqueados
- `Informe.ts` - Informes para padres
- `AlertaRiesgo.ts` - Alertas de riesgo

#### Repositories (DAOs)
- `UsuarioRepository.ts` - CRUD de usuarios
- `CuestionarioRepository.ts` - Gestión de cuestionarios
- `ChatRepository.ts` - Gestión de chats
- `EjercicioRepository.ts` - Gestión de ejercicios
- `ComunidadRepository.ts` - Gestión de comunidad
- `LogroRepository.ts` - Gestión de logros
- `AlertaRiesgoRepository.ts` - Gestión de alertas

#### Services (Servicios de Negocio)
- `HashService.ts` - Hashing de contraseñas (bcrypt)
- `EncryptionService.ts` - Encriptación AES-256-GCM
- `JwtService.ts` - Gestión de tokens JWT
- `WebPushService.ts` - Web Push API
- `EmailService.ts` - Envío de correos (Nodemailer)
- `PdfService.ts` - Generación PDF (Puppeteer)
- `IAService.ts` - Integración con OpenAI
- `SocketService.ts` - Gestión de WebSockets

## 🔗 Flujo de Datos

### Ejemplo: Flujo de Autenticación

```
1. Usuario ingresa credenciales en LoginPage
2. useAuth hook llama a authService.login()
3. authService hace POST a /api/auth/login
4. AuthController valida credenciales
5. UsuarioRepository verifica usuario en DB
6. HashService compara password
7. JwtService genera tokens
8. Respuesta con tokens enviada al frontend
9. useAuth actualiza estado global
10. Usuario redirigido a Dashboard
```

### Ejemplo: Flujo de Evaluación

```
1. Usuario selecciona cuestionario
2. EvaluacionPage carga preguntas
3. Usuario responde preguntas
4. useEvaluacion valida respuestas completas
5. Al finalizar, llama a evaluacionService.guardarEvaluacion()
6. Backend calcula puntaje y clasifica riesgo
7. Si riesgo = ALTO, genera alerta
8. SocketService notifica a psicólogos
9. Resultado guardado en DB (encriptado)
10. Usuario redirigido a resultados
```

## 🔒 Seguridad por Capas

### Frontend
- Validación de formularios en cliente
- Sanitización de inputs con DOMPurify
- Token storage seguro (httpOnly cookies)
- CSP headers
- Autenticación de rutas

### Backend
- JWT con blacklist Redis
- Rate limiting por endpoint
- Validación de inputs con Zod
- Encriptación de datos sensibles
- Helmet.js headers
- CORS estricto

### Base de Datos
- Encriptación AES-256 en reposo
- Índices optimizados
- Transacciones ACID
- Prepared statements (Prisma)

## 📡 Comunicación en Tiempo Real

### Socket.io Events

**Cliente → Servidor:**
- `authenticate` - Autenticar usuario
- `chat_message` - Enviar mensaje de chat

**Servidor → Cliente:**
- `nueva_alerta` - Nueva alerta de riesgo
- `chat_response` - Respuesta de IA
- `notification` - Notificación push

## 🔄 Sincronización Offline

### Estrategia
- IndexedDB para cache de datos críticos
- Service Worker con sync events
- Cola de operaciones fallidas
- Reintento automático al reconectar
- Conflicto resolution (last-write-wins)

### Datos Offline
- Cuestionarios precargados
- Respuestas locales
- Historial de chat cacheado
- Estado de usuario persistente

## 🎨 Principios de Diseño

### Frontend
- Mobile-first responsive design
- Componentes reutilizables
- Custom hooks para lógica compartida
- Estado global con Zustand
- TypeScript estricto
- WCAG 2.1 AA accessibility

### Backend
- RESTful API design
- Separación de concerns
- Dependency injection
- Error handling centralizado
- Logging estructurado
- Middleware pattern

## 📈 Escalabilidad

### Horizontal Scaling
- Stateless API servers
- Redis para sesiones compartidas
- Load balancer con sticky sessions
- Database connection pooling

### Vertical Scaling
- Optimización de queries Prisma
- Caching con Redis
- CDN para assets estáticos
- Database indexing

## 🧪 Testing Strategy

### Unit Tests
- Servicios: lógica pura sin dependencias
- Hooks: comportamiento con mocks
- Utils: funciones puras

### Integration Tests
- Controllers: endpoints completos
- Repositories: con DB de prueba
- Services: con dependencias reales

### E2E Tests
- Flujos críticos de usuario
- Pruebas de UI con Playwright
- Cross-browser testing

---

**Esta arquitectura permite mantenimiento, escalabilidad y testabilidad del sistema.**
