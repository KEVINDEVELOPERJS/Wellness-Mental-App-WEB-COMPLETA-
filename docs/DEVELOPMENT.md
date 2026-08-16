# Guía de Desarrollo - Wellness Mental Web App

## 🛠️ Configuración del Entorno de Desarrollo

### Prerrequisitos

- Node.js 18+ 
- PostgreSQL 15+
- Redis 7+
- Git
- VS Code o editor similar

### Instalación de Herramientas

```bash
# Verificar Node.js
node --version

# Verificar PostgreSQL
psql --version

# Verificar Redis
redis-cli --version
```

## 📁 Estructura de Directorios

```bash
wellness-mental-web/
├── frontend/          # Frontend React + TypeScript
├── backend/           # Backend Node.js + Express
├── shared/            # Tipos compartidos
├── docs/              # Documentación
└── docker-compose.yml # Servicios Docker
```

## 🔧 Configuración Local

### 1. Clonar el Repositorio

```bash
git clone <repository-url>
cd wellness-mental-web
```

### 2. Configurar Backend

```bash
cd backend
cp .env.example .env
```

Editar `.env` con tus configuraciones:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/wellness_mental?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-dev-secret-key"
REFRESH_TOKEN_SECRET="your-dev-refresh-secret"
ENCRYPTION_KEY="your-32-character-dev-encryption-key"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
CORS_ORIGIN="http://localhost:5173"
```

### 3. Configurar Frontend

```bash
cd frontend
cp .env.example .env
```

Editar `.env`:
```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

### 4. Iniciar Servicios con Docker

```bash
# Desde el directorio raíz
docker-compose up -d
```

Esto iniciará PostgreSQL y Redis.

### 5. Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### 6. Migrar Base de Datos

```bash
cd backend
npx prisma migrate dev
npx prisma generate
npx prisma seed
```

### 7. Iniciar Servidores de Desarrollo

```bash
# Backend (terminal 1)
cd backend
npm run dev

# Frontend (terminal 2)
cd frontend
npm run dev
```

## 🧪 Desarrollo y Testing

### Ejecutar Tests

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend unit tests
cd frontend
npm test
npm run test:coverage

# Frontend E2E tests
cd frontend
npm run test:e2e
```

### Debugging

**Backend:**
- Usa `console.log` para debugging
- Usa `debugger` statements en VS Code
- Configura breakpoints en VS Code

**Frontend:**
- Usa React DevTools
- Usa Redux DevTools (para Zustand)
- Usa breakpoints en VS Code

## 📝 Convenciones de Código

### TypeScript

- Usar TypeScript estricto
- Tipar todas las funciones y variables
- Evitar `any` tanto como sea posible
- Usar interfaces para contratos de datos

### Nomenclatura

- **Archivos:** kebab-case (`auth-service.ts`)
- **Componentes:** PascalCase (`AuthPage.tsx`)
- **Funciones:** camelCase (`getUserById`)
- **Constantes:** UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Interfaces:** PascalCase (`Usuario`)

### Estructura de Componentes

```typescript
// Imports
import { useState, useEffect } from 'react';

// Types
interface Props {
  // ...
}

// Component
export default function ComponentName({ prop }: Props) {
  // Hooks
  const [state, setState] = useState(null);
  
  // Effects
  useEffect(() => {
    // ...
  }, []);
  
  // Handlers
  const handleClick = () => {
    // ...
  };
  
  // Render
  return (
    // JSX
  );
}
```

### Organización de Imports

```typescript
// 1. React y bibliotecas
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Componentes locales
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

// 3. Servicios y hooks
import { authService } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';

// 4. Tipos y utilidades
import { Usuario } from '@/types/usuario';
import { formatDate } from '@/utils/dateUtils';
```

## 🎨 Guía de Estilos

### Tailwind CSS

Usa las clases de utilidad de Tailwind CSS:

```tsx
// Espaciado
<div className="p-4">Content</div>

// Flexbox
<div className="flex items-center justify-between">
  <span>Left</span>
  <span>Right</span>
</div>

// Grid
<div className="grid grid-cols-2 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Responsivo
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div>Item</div>
</div>
```

### Componentes shadcn/ui

Usa los componentes predefinidos de shadcn/ui:

```tsx
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';

<Button variant="default">Click me</Button>
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
>
```

## 🔧 Git Workflow

### Branch Strategy

```
main          → Producción
develop       → Desarrollo
feature/*     → Features individuales
bugfix/*      → Correcciones de bugs
```

### Commit Message Format

```
tipo(scope): descripción concisa

cuerpo del commit con más detalles si es necesario

Co-Authored-By: Devin <158243242+devin-ai-integration[bot]@users.noreply.github.com>
```

**Tipos:**
- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato/código
- `refactor`: Refactorización de código
- `test`: Agregar o modificar tests
- `chore`: Cambios en mantenimiento

### Ejemplos

```bash
feat(auth): agregar soporte para 2FA en login

fix(chat): corregir error en sincronización de mensajes en tiempo real

docs(api): actualizar documentación de endpoints de evaluación

refactor(ejercicios): optimizar cálculo de racha de días
```

## 🐛 Debugging Común

### Backend

**Problema: Database connection failed**
```bash
# Verificar que PostgreSQL esté corriendo
docker-compose ps postgres

# Verificar logs
docker-compose logs postgres

# Testear conexión
cd backend
npx prisma db push
```

**Problema: Port already in use**
```bash
# Encontrar proceso usando el puerto
lsof -i :3001

# Matar proceso
kill -9 <PID>
```

### Frontend

**Problema: Module not found**
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

**Problema: Hooks can only be called inside function components**
- Asegúrate de no usar hooks fuera de componentes funcionales
- Verifica que no haya llamadas a hooks en condicionales

**Problema: State updates causing re-renders**
- Usa `useCallback` para funciones memoizadas
- Usa `useMemo` para valores calculados
- Revisa dependencias de arrays en `useEffect`

## 🧰 Desarrollo de Nuevas Features

### Pasos para Agregar Nueva Funcionalidad

1. **Definir Historia de Usuario**
   - Especificar criterios de aceptación
   - Definir flujo de usuario

2. **Crear Entity Types**
   - Definir interfaces TypeScript
   - Agregar a `shared/types/`

3. **Actualizar Database Schema**
   - Modificar `prisma/schema.prisma`
   - Crear migración: `npx prisma migrate dev --name feature_name`

4. **Crear Repository**
   - Implementar CRUD operations
   - Agregar validaciones de negocio

5. **Crear Service**
   - Implementar lógica de negocio
   - Integrar con servicios externos si es necesario

6. **Crear Controller**
   - Implementar endpoints API
   - Agregar middleware de autenticación

7. **Crear Frontend Service**
   - Implementar cliente API
   - Agregar tipado TypeScript

8. **Crear Hook**
   - Implementar lógica de UI
   - Manejar estado local

9. **Crear Page/Component**
   - Implementar interfaz de usuario
   - Agregar validaciones en cliente

10. **Actualizar Rutas**
    - Agregar ruta en React Router
    - Agregar ruta en Express Router

11. **Actualizar Navigation**
    - Agregar enlace en sidebar/header
    - Actualizar breadcrumbs

12. **Escribir Tests**
    - Unit tests para lógica
    - Integration tests para API
    - E2E tests para flujo crítico

13. **Actualizar Documentación**
    - Actualizar README
    - Actualizar API docs
    - Agregar notas en ARCHITECTURA.md

## 📱 Testing Features

### Unit Tests

**Backend:**
```typescript
describe('AuthService', () => {
  it('should register a new user', async () => {
    const result = await authService.register(userData);
    expect(result.usuario).toBeDefined();
    expect(result.accessToken).toBeDefined();
  });
});
```

**Frontend:**
```typescript
describe('useAuth', () => {
  it('should authenticate user', () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.setAuth(mockUser, 'token', 'refresh');
    });
    expect(result.current.isAuthenticated).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('Auth API', () => {
  it('should register and login user', async () => {
    // Register
    const registerResponse = await request(app)
      .post('/api/auth/registro')
      .send(mockUser);
    
    expect(registerResponse.status).toBe(201);
    
    // Login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: mockUser.email, password: mockUser.password });
    
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.accessToken).toBeDefined();
  });
});
```

### E2E Tests

```typescript
test('should complete evaluation flow', async ({ page }) => {
  await page.goto('/evaluacion');
  await page.click('text=Comenzar Evaluación');
  
  // Responder preguntas
  for (let i = 0; i < 7; i++) {
    await page.click('button:has-text("Siguiente")');
  }
  
  // Finalizar
  await page.click('text=Finalizar');
  
  // Verificar resultado
  await expect(page.locator('text=Nivel de Riesgo')).toBeVisible();
});
```

## 🔄 Code Review Checklist

### Para cada PR:

- [ ] Código sigue convenciones de estilo
- [ ] TypeScript sin errores
- [ ] Tests agregados/actualizados
- [ ] Documentación actualizada
- [ ] No secrets commiteados
- [ ] Eslint no muestra errores
- [ ] Build pasa exitosamente
- [ ] No console.log en producción
- [ ] Accessibility considerations
- [ ] Responsive design verificado

## 🚀 Performance Best Practices

### Frontend

- **Code Splitting:** Usar `React.lazy` para rutas
- **Memoization:** Usar `React.memo` para componentes puros
- **Virtualization:** Para listas largas
- **Image Optimization:** Usar WebP, lazy loading
- **Bundle Size:** Analizar con `npm run build`

### Backend

- **Query Optimization:** Usar `select` en Prisma
- **Connection Pooling:** Configurar pool size
- **Caching:** Usar Redis para datos frecuentes
- **Indexing:** Agregar índices a DB queries frecuentes
- **Compression:** Habilitar gzip en Express

## 🔐 Security Best Practices

### Desarrollo

- Nunca commitear `.env` files
- Usar secrets seguros para desarrollo
- Validar todos los inputs
- Sanitizar datos de usuario
- Usar parámetros preparados en SQL

### Commit

- Revisar diff antes de commitear
- No commitear datos sensibles
- Verificar que no haya secrets en código
- Usar branch protection rules

## 📖 Recursos de Aprendizaje

### Documentación Oficial

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Tutoriales

- [React Testing Library](https://testing-library.com/)
- [Jest Documentation](https://jestjs.io/)
- [Playwright Guide](https://playwright.dev/)
- [Docker Documentation](https://docs.docker.com/)

## 🆘 Soporte y Colaboración

### Comunicación

- Usar Discord/Slack para comunicación del equipo
- Crear issues en GitHub para bugs y features
- Usar pull requests para code review
- Documentar decisiones importantes

### Code Review

- Revisar código por funcionalidad, no solo estilo
- Proponer mejoras constructivas
- Ser respetuoso con feedback
- Justificar cambios sugeridos

---

**Happy Coding! 🚀**
