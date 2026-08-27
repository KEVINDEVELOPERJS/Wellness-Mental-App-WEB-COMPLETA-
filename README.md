# Wellness Mental Web App 🧠

Aplicación web progresiva (PWA) para el bienestar mental de usuarios adolescentes (13-18 años). Implementada como una Single Page Application (SPA) con arquitectura MVC completa.

## 📋 Descripción del Proyecto

Wellness Mental es una plataforma integral de bienestar mental diseñada específicamente para usuarios adolescentes. La aplicación proporciona herramientas de evaluación psicológica, chat con IA asistente empática, ejercicios de respiración guiada, comunidad de apoyo, gamificación y sistema de alertas de riesgo para psicólogos.

## 🏗️ Arquitectura

### Stack Tecnológico

**Frontend:**
- React 18+ con TypeScript
- React Router v6 para navegación
- Zustand para estado global
- Axios para comunicación API
- Tailwind CSS + shadcn/ui para estilos
- Recharts para gráficos
- Socket.io-client para comunicación en tiempo real
- Dexie.js para IndexedDB (soporte offline)
- PWA con Service Worker

**Backend:**
- Node.js con Express
- TypeScript
- Prisma ORM
- PostgreSQL 15+ (producción)
- Redis (sesiones/cache)
- Socket.io para WebSockets
- JWT para autenticación
- AES-256-GCM para encriptación
- Puppeteer para generación PDF
- Web Push API para notificaciones

### Estructura del Proyecto

```
wellness-mental-web/
├── frontend/                          # CAPA VISTA - Cliente Web
│   ├── public/                       # Assets estáticos
│   ├── src/
│   │   ├── pages/                    # Páginas/Rutas
│   │   ├── components/             # Componentes reutilizables
│   │   ├── hooks/                    # Controladores de Frontend
│   │   ├── services/                 # Clientes API
│   │   ├── store/                    # Estado global (Zustand)
│   │   ├── types/                    # Entidades TypeScript
│   │   ├── workers/                  # Web Workers
│   │   └── utils/                    # Utilidades frontend
│   └── package.json
│
├── backend/                           # CAPA MODELO + CONTROLADOR
│   ├── src/
│   │   ├── models/                    # Entidades Prisma + lógica
│   │   │   ├── entities/              # Interfaces TypeScript
│   │   │   └── repositories/          # DAOs (Prisma Client)
│   │   ├── controllers/               # Controladores API REST
│   │   ├── routes/                    # Definición de rutas Express
│   │   ├── middleware/                # Middleware Express
│   │   ├── services/                  # Servicios de negocio
│   │   ├── config/                    # Configuración
│   │   └── utils/                     # Utilidades backend
│   ├── prisma/
│   │   ├── schema.prisma              # Schema de base de datos
│   │   └── seed.ts                    # Datos iniciales
│   └── package.json
│
├── shared/                            # Tipos y utilidades compartidas
│   └── types/
│       └── index.ts                   # DTOs y enums compartidos
│
└── docker-compose.yml                 # PostgreSQL + Redis
```

## 🚀 Funcionalidades Principales

### Historias de Usuario Implementadas

**HU-01: Registro de Usuario** ✅
- Formulario de registro con validación en tiempo real
- Validación de edad (13-18 años)
- Consentimiento parental para menores de 16
- Sistema de autenticación JWT
- Gestión de sesiones con blacklist

**HU-02: Chat Empático con IA** ✅
- Chat en tiempo real con Socket.io
- Asistente IA con OpenAI API
- Análisis de sentimiento en tiempo real
- Detección automática de riesgo
- Encriptación E2EE de mensajes
- Historial de conversaciones

**HU-03: Evaluación Psicológica** ✅
- Cuestionarios predefinidos (GAD-7, PHQ-9, PSS-10)
- Sistema de evaluación con escala Likert
- Cálculo automático de puntajes
- Clasificación de niveles de riesgo
- Generación de prediagnósticos
- Alertas automáticas para riesgo alto

**HU-04: Ejercicios de Respiración** ✅
- Técnicas de respiración guiada (4-7-8, caja, coherente)
- Animaciones visuales sincronizadas
- Registro de progreso y rachas
- Límite diario de 30 minutos
- Notificaciones programables
- Sistema de satisfacción

**HU-05: Informes para Padres** ✅
- Generación de informes PDF con Puppeteer
- Autenticación de dos factores (2FA)
- Encriptación AES-256 de datos sensibles
- Tokens de acceso temporal (24h)
- Gráficos de tendencias 3 meses
- Sistema de auditoría completo

**HU-07: Comunidad de Usuarios** ✅
- Foros categorizados por temas
- Sistema de posts y comentarios
- Filtro de lenguaje inapropiado
- Sistema de reportes y moderación
- Emparejamiento por intereses
- Edición/eliminación dentro de 24h

**HU-08: Gamificación** ✅
- Sistema de puntos y niveles
- Logros desbloqueables
- 4 mini-juegos interactivos
- Sistema de rachas
- Celebraciones con animaciones
- Niveles: Explorador, Guardián, Maestro, Líder

**HU-09: Alertas de Riesgo** ✅
- Generación automática de alertas
- Panel en tiempo real para psicólogos
- Canales: Web Push, Email, Panel interno
- Sistema de estados y seguimiento
- Log de auditoría inmutable
- Rate limiting para prevención de spam

**HU-10: Gestión de Perfil** ✅
- Edición de perfil y avatar
- Configuración de notificaciones
- Gestión de sesiones activas
- Autenticación 2FA
- Códigos de invitación para padres
- Exportación de datos (GDPR)
- Cierre de sesión remoto

## 🔒 Seguridad

- **Encriptación:** AES-256-GCM para datos sensibles
- **Hashing:** bcrypt con 12 rondas para contraseñas
- **Autenticación:** JWT con tokens de acceso y refresh
- **Headers de seguridad:** Helmet.js (CSP, HSTS, X-Frame-Options)
- **Rate Limiting:** Protección contra ataques de fuerza bruta
- **CORS:** Configuración estricta de orígenes
- **Input Sanitization:** DOMPurify (frontend) y validator.js (backend)
- **TLS 1.3:** Encriptación en tránsito

## 📱 PWA Features

- Service Worker con estrategia "Network First + Cache Fallback"
- Manifest.json para instalación en dispositivos móviles
- Soporte offline con IndexedDB
- Sincronización automática al reconectar
- Notificaciones push programables
- Add to Home Screen en iOS/Android

## 🧪 Testing

**Frontend:**
- Vitest para unit tests
- React Testing Library para componentes
- Playwright para E2E tests

**Backend:**
- Jest para unit tests
- Supertest para integración API
- Coverage reports con lcov

## 🚀 Instalación y Ejecución

### Prerrequisitos

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- npm o yarn

### Configuración Local

1. **Clonar el repositorio:**
```bash
git clone <repository-url>
cd wellness-mental-web
```

2. **Configurar variables de entorno:**

Backend:
```bash
cd backend
cp .env.example .env
# Editar .env con tus configuraciones
```

Frontend:
```bash
cd frontend
cp .env.example .env
# Editar .env con tus configuraciones
```

3. **Iniciar servicios con Docker:**
```bash
docker-compose up -d
```

4. **Instalar dependencias:**
```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

5. **Migrar base de datos:**
```bash
cd backend
npx prisma migrate dev
npx prisma seed
```

6. **Iniciar servidores:**
```bash
# Backend (terminal 1)
cd backend
npm run dev

# Frontend (terminal 2)
cd frontend
npm run dev
```

7. **Acceder a la aplicación:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Ejecutar Tests

```bash
# Backend tests
cd backend
npm test

# Frontend unit tests
cd frontend
npm test

# Frontend E2E tests
cd frontend
npm run test:e2e
```

## 📦 Deployment

### Vercel

1. Conectar repositorio a Vercel
2. Configurar variables de entorno en Vercel
3. Deploy automático con cada push

### Variables de Entorno Requeridas

- `DATABASE_URL`: URL de PostgreSQL
- `REDIS_URL`: URL de Redis
- `JWT_SECRET`: Secret para tokens JWT
- `ENCRYPTION_KEY`: Clave de encriptación 32 caracteres
- `OPENAI_API_KEY`: API key de OpenAI
- `VAPID_PUBLIC_KEY`: Clave pública para Web Push
- `VAPID_PRIVATE_KEY`: Clave privada para Web Push
- `SMTP_*`: Configuración de email

## 📖 Documentación

Para documentación detallada de cada componente, revisa los archivos en `/docs/`:

- [Arquitectura MVC](./docs/ARQUITECTURA.md)
- [Guía de API](./docs/API.md)
- [Guía de Despliegue](./docs/DEPLOYMENT.md)
- [Guía de Desarrollo](./docs/DEVELOPMENT.md)

## 🤝 Contribución

1. Fork el repositorio
2. Crear rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Autores

- Desarrollo de Software IV Semestre
- Universidad [Nombre de la Universidad]

## 🙏 Agradecimientos

- OpenAI por la API de GPT
- Prisma por el ORM excelente
- Vercel por la plataforma de hosting
- Comunidad de código abierto

---

**Desarrollado con ❤️ para el bienestar de usuarios**
