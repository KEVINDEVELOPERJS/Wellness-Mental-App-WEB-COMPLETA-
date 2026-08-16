# Guía de Despliegue - Wellness Mental Web App

## 🚀 Despliegue en Vercel

### Prerrequisitos
- Cuenta en Vercel
- Repositorio conectado a Vercel
- Variables de entorno configuradas

### Pasos

1. **Preparar el Repositorio**
```bash
# Asegúrate de tener un .gitignore completo
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. **Configurar Proyecto en Vercel**
- Ve a vercel.com/dashboard
- Click "Add New Project"
- Importa tu repositorio de GitHub
- Selecciona el directorio raíz

3. **Configurar Build Settings**
Vercel detectará automáticamente la configuración. Asegúrate de que:

**Framework Preset:** Other
**Build Command:** (dejado en blanco para detección automática)
**Output Directory:** (dejado en blanco)

4. **Configurar Variables de Entorno**
En Vercel Dashboard → Settings → Environment Variables:

```
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_URL=redis://host:6379
JWT_SECRET=your-super-secret-jwt-key
REFRESH_TOKEN_SECRET=your-refresh-token-secret
ENCRYPTION_KEY=your-32-character-encryption-key
FRONTEND_URL=https://your-domain.vercel.app
CORS_ORIGIN=https://your-domain.vercel.app
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_EMAIL=mailto:your-email@example.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@your-domain.vercel.app
OPENAI_API_KEY=your-openai-api-key
```

5. **Desplegar**
- Click "Deploy"
- Vercel construirá y desplegará automáticamente
- El proceso toma 2-5 minutos

6. **Verificar Despliegue**
- Visita tu URL de Vercel
- Prueba las rutas principales
- Verifica que la API responda correctamente

## 🐳 Despliegue con Docker

### Prerrequisitos
- Docker y Docker Compose instalados
- Servidor con suficiente RAM (mínimo 2GB)

### Pasos

1. **Clonar el Repositorio**
```bash
git clone <repository-url>
cd wellness-mental-web
```

2. **Configurar Variables de Entorno**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edita ambos archivos .env con tus configuraciones
```

3. **Iniciar Servicios**
```bash
docker-compose up -d
```

Esto iniciará:
- PostgreSQL en puerto 5432
- Redis en puerto 6379
- Backend en puerto 3001
- Frontend en puerto 5173

4. **Ejecutar Migraciones**
```bash
docker-compose exec backend npx prisma migrate dev
docker-compose exec backend npx prisma seed
```

5. **Verificar Servicios**
```bash
# Verificar que los servicios estén corriendo
docker-compose ps

# Ver logs del backend
docker-compose logs -f backend

# Ver logs del frontend
docker-compose logs -f frontend
```

6. **Acceder a la Aplicación**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Comandos Útiles de Docker

```bash
# Detener servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v

# Reconstruir contenedores
docker-compose up -d --build

# Ver logs de todos los servicios
docker-compose logs

# Entrar en el contenedor backend
docker-compose exec backend sh

# Entrar en el contenedor frontend
docker-compose exec frontend sh
```

## ☁️ Despliegue en Servidor Propio

### Prerrequisitos
- Servidor Linux (Ubuntu 20.04+ recomendado)
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Nginx (como reverse proxy)
- Dominio configurado con SSL

### Pasos

1. **Configurar el Servidor**
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Instalar Redis
sudo apt install -y redis-server

# Instalar Nginx
sudo apt install -y nginx

# Instalar PM2 (process manager)
sudo npm install -g pm2
```

2. **Configurar PostgreSQL**
```bash
# Crear usuario y base de datos
sudo -u postgres psql
CREATE USER wellness WITH PASSWORD 'secure_password';
CREATE DATABASE wellness_mental OWNER wellness;
GRANT ALL PRIVILEGES ON DATABASE wellness_mental TO wellness;
\q
```

3. **Configurar Redis**
```bash
# Habilitar Redis al inicio
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

4. **Clonar y Configurar Aplicación**
```bash
# Clonar repositorio
cd /var/www
git clone <repository-url>
cd wellness-mental-web

# Configurar backend
cd backend
cp .env.example .env
# Editar .env con configuraciones de producción

# Instalar dependencias
npm install --production

# Ejecutar migraciones
npx prisma migrate deploy
npx prisma seed

# Configurar frontend
cd ../frontend
cp .env.example .env
# Editar .env con configuraciones de producción

# Instalar dependencias y construir
npm install --production
npm run build
```

5. **Configurar Nginx**
```bash
sudo nano /etc/nginx/sites-available/wellness-mental
```

Configuración de Nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activar sitio:
```bash
sudo ln -s /etc/nginx/sites-available/wellness-mental /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

6. **Configurar SSL con Let's Encrypt**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

7. **Configurar PM2**
```bash
# Backend
cd /var/www/wellness-mental-web/backend
pm2 start src/app.ts --name wellness-backend

# Frontend (servir estáticos con Nginx, pero puedes usar PM2 si prefieres)
# pm2 serve dist 5173 --name wellness-frontend

# Guardar configuración PM2
pm2 save
pm2 startup
```

8. **Configurar Systemd para Auto-restart**
```bash
sudo nano /etc/systemd/system/wellness-backend.service
```

Contenido:
```ini
[Unit]
Description=Wellness Mental Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/wellness-mental-web/backend
ExecStart=/usr/bin/node /var/www/wellness-mental-web/backend/src/app.ts
Restart=always

[Install]
WantedBy=multi-user.target
```

Activar servicio:
```bash
sudo systemctl enable wellness-backend
sudo systemctl start wellness-backend
```

## 🔧 Configuración de Dominio

### DNS Configuration

1. **Configurar registros DNS:**
   - A record: `@` → IP del servidor
   - CNAME: `www` → `@` (o tu dominio principal)

2. **Verificar propagación:**
```bash
dig your-domain.com
```

### SSL/TLS

- Usar Let's Encrypt (gratis) o certificado comercial
- Configurar redirección HTTP → HTTPS
- Asegurar HSTS header

## 📊 Monitoreo y Logging

### Logging
- Configurar Winston o similar para logging estructurado
- Enviar logs a servicio centralizado (Sentry, LogRocket)
- Rotación de logs automática

### Monitoreo
- Uptime monitoring (UptimeRobot, Pingdom)
- Performance monitoring (New Relic, Datadog)
- Error tracking (Sentry)
- Database monitoring (PGAdmin cloud)

## 🔄 CI/CD con GitHub Actions

### Workflow de Deploy Automático

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
    
    - name: Install dependencies (backend)
      run: |
        cd backend
        npm ci
    
    - name: Run tests (backend)
      run: |
        cd backend
        npm test
    
    - name: Install dependencies (frontend)
      run: |
        cd frontend
        npm ci
    
    - name: Run tests (frontend)
      run: |
        cd frontend
        npm test
    
    - name: Build frontend
      run: |
        cd frontend
        npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## 🔐 Seguridad en Producción

### Checklist

- [ ] Cambiar todos los secrets por defecto
- [ ] Habilitar HTTPS con certificado SSL válido
- [ ] Configurar firewall (ufw)
- [ ] Deshabilitar acceso root SSH
- [ ] Usar SSH keys en lugar de passwords
- [ ] Mantener sistema actualizado
- [ ] Configurar backups automáticos de DB
- [ ] Habilitar rate limiting agresivo
- [ ] Monitorear logs de acceso sospechoso
- [ ] Usar variables de entorno para secrets
- [ ] Nunca commitear .env files
- [ ] Configurar CSP headers estrictos
- [ ] Habilitar CORS solo para dominios confiables

## 📱 Configuración PWA

### Manifest y Service Worker

El PWA está configurado automáticamente con Vite PWA plugin. Para producción:

1. **Generar íconos en múltiples tamaños:**
   - 192x192
   - 512x512
   - Format: PNG

2. **Configurar manifest.json:**
   - name: "Wellness Mental"
   - short_name: "Wellness"
   - display: "standalone"
   - orientation: "portrait"
   - background_color: "#ffffff"
   - theme_color: "#4CAF50"

3. **Service Worker:**
   - Cache strategy: Network First + Cache Fallback
   - Precaching de assets críticos
   - Background sync para operaciones offline

## 🐛 Troubleshooting

### Problemas Comunes

**Error: "Connection refused"**
- Verificar que PostgreSQL y Redis estén corriendo
- Verificar que los puertos no estén en uso
- Revisar firewall rules

**Error: "JWT invalid"**
- Verificar que JWT_SECRET sea el mismo en backend y frontend
- Verificar que el token no esté expirado
- Revisar hora del servidor sincronizada

**Error: "Database connection failed"**
- Verificar DATABASE_URL correcta
- Asegúrate de que PostgreSQL acepte conexiones remotas
- Revisar pg_hba.conf configuración

**Error: "CORS policy"**
- Verificar CORS_ORIGIN incluye tu dominio
- Asegúrate de que Vercel permite tu dominio
- Revisar headers de CORS en backend

### Logs y Debugging

```bash
# Backend logs
docker-compose logs backend

# Frontend logs
docker-compose logs frontend

# Database logs
docker-compose logs postgres

# Redis logs
docker-compose logs redis
```

## 📈 Optimización de Rendimiento

### Backend
- Usar connection pooling en Prisma
- Implementar caching en Redis
- Optimizar queries con índices
- Usar compresión gzip
- Implementar CDN para assets estáticos

### Frontend
- Code splitting por rutas
- Lazy loading de componentes
- Optimizar imágenes (WebP, compresión)
- Minificar CSS y JS
- Usar tree shaking

## 🔄 Actualizaciones

### Backend
```bash
cd backend
git pull origin main
npm install
npx prisma migrate deploy
pm2 restart wellness-backend
```

### Frontend
```bash
cd frontend
git pull origin main
npm install
npm run build
# Nginx servirá los nuevos archivos estáticos automáticamente
```

## 📞 Soporte

Para problemas de despliegue:
- Revisar documentación de Vercel
- Consultar logs de Vercel Dashboard
- Verificar estado de servicios en Docker
- Contactar al equipo de desarrollo

---

**La aplicación está diseñada para ser desplegada en múltiples plataformas según tus necesidades.**
