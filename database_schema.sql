-- Wellness Mental App - PostgreSQL Database Schema for Render
-- Generated from Prisma schema

-- Drop existing tables and enums (for clean setup)
DROP TABLE IF EXISTS "AuditoriaAlerta" CASCADE;
DROP TABLE IF EXISTS "PreferenciasUsuario" CASCADE;
DROP TABLE IF EXISTS "SesionActiva" CASCADE;
DROP TABLE IF EXISTS "Informe" CASCADE;
DROP TABLE IF EXISTS "AlertaRiesgo" CASCADE;
DROP TABLE IF EXISTS "UsuarioLogro" CASCADE;
DROP TABLE IF EXISTS "Logro" CASCADE;
DROP TABLE IF EXISTS "Comentario" CASCADE;
DROP TABLE IF EXISTS "PostComunidad" CASCADE;
DROP TABLE IF EXISTS "ProgresoEjercicio" CASCADE;
DROP TABLE IF EXISTS "Ejercicio" CASCADE;
DROP TABLE IF EXISTS "MensajeChat" CASCADE;
DROP TABLE IF EXISTS "ChatSession" CASCADE;
DROP TABLE IF EXISTS "Resultado" CASCADE;
DROP TABLE IF EXISTS "Respuesta" CASCADE;
DROP TABLE IF EXISTS "Pregunta" CASCADE;
DROP TABLE IF EXISTS "Cuestionario" CASCADE;
DROP TABLE IF EXISTS "Usuario" CASCADE;

DROP TYPE IF EXISTS "Rol";
DROP TYPE IF EXISTS "EstadoUsuario";
DROP TYPE IF EXISTS "EstadoAlerta";
DROP TYPE IF EXISTS "NivelRiesgo";
DROP TYPE IF EXISTS "EstadoInforme";
DROP TYPE IF EXISTS "EstadoModeracion";
DROP TYPE IF EXISTS "TipoEjercicio";

-- Create Enums
CREATE TYPE "Rol" AS ENUM ('ESTUDIANTE', 'PSICOLOGO', 'PADRE', 'ADMIN');

CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'PENDIENTE', 'SUSPENDIDO');

CREATE TYPE "EstadoAlerta" AS ENUM ('PENDIENTE', 'ATENDIDA', 'EN_SEGUIMIENTO', 'DERIVADA');

CREATE TYPE "NivelRiesgo" AS ENUM ('BAJO', 'MEDIO', 'ALTO');

CREATE TYPE "EstadoInforme" AS ENUM ('GENERADO', 'ENVIADO', 'LEIDO');

CREATE TYPE "EstadoModeracion" AS ENUM ('APROBADO', 'PENDIENTE', 'RECHAZADO');

CREATE TYPE "TipoEjercicio" AS ENUM ('RESPIRACION', 'MEDITACION', 'RELAJACION');

-- Create Tables

-- Usuario table
CREATE TABLE "Usuario" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "edad" INTEGER NOT NULL,
    "grado" VARCHAR(50) NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'ESTUDIANTE',
    "fechaRegistro" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'ACTIVO',
    "consentimientoPadres" BOOLEAN NOT NULL DEFAULT false,
    "codigoInvitacionPadre" VARCHAR(255) UNIQUE,
    "avatar" VARCHAR(255),
    "telefono" VARCHAR(50)
);

-- Indexes for Usuario
CREATE INDEX "Usuario_email_idx" ON "Usuario"("email");
CREATE INDEX "Usuario_rol_idx" ON "Usuario"("rol");
CREATE INDEX "Usuario_estado_idx" ON "Usuario"("estado");

-- Cuestionario table
CREATE TABLE "Cuestionario" (
    "id" SERIAL PRIMARY KEY,
    "titulo" VARCHAR(255) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "instrucciones" TEXT NOT NULL,
    "categoria" VARCHAR(100) NOT NULL,
    "estado" VARCHAR(50) NOT NULL DEFAULT 'publicado',
    "fechaCreacion" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Cuestionario
CREATE INDEX "Cuestionario_estado_idx" ON "Cuestionario"("estado");
CREATE INDEX "Cuestionario_categoria_idx" ON "Cuestionario"("categoria");

-- Pregunta table
CREATE TABLE "Pregunta" (
    "id" SERIAL PRIMARY KEY,
    "cuestionarioId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "tipoRespuesta" VARCHAR(50) NOT NULL DEFAULT 'likert',
    "peso" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "orden" INTEGER NOT NULL,
    "opciones" TEXT,
    CONSTRAINT "Pregunta_cuestionarioId_fkey" FOREIGN KEY ("cuestionarioId") REFERENCES "Cuestionario"("id") ON DELETE CASCADE
);

-- Indexes for Pregunta
CREATE INDEX "Pregunta_cuestionarioId_idx" ON "Pregunta"("cuestionarioId");

-- Respuesta table
CREATE TABLE "Respuesta" (
    "id" SERIAL PRIMARY KEY,
    "preguntaId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "valor" INTEGER NOT NULL,
    "texto" TEXT,
    "fechaRespuesta" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Respuesta_preguntaId_fkey" FOREIGN KEY ("preguntaId") REFERENCES "Pregunta"("id") ON DELETE CASCADE,
    CONSTRAINT "Respuesta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
);

-- Indexes for Respuesta
CREATE INDEX "Respuesta_preguntaId_idx" ON "Respuesta"("preguntaId");
CREATE INDEX "Respuesta_usuarioId_idx" ON "Respuesta"("usuarioId");

-- Resultado table
CREATE TABLE "Resultado" (
    "id" SERIAL PRIMARY KEY,
    "cuestionarioId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "puntaje" INTEGER NOT NULL,
    "nivelRiesgo" "NivelRiesgo" NOT NULL,
    "prediagnostico" TEXT NOT NULL,
    "fechaEvaluacion" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Resultado_cuestionarioId_fkey" FOREIGN KEY ("cuestionarioId") REFERENCES "Cuestionario"("id"),
    CONSTRAINT "Resultado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
);

-- Indexes for Resultado
CREATE INDEX "Resultado_usuarioId_idx" ON "Resultado"("usuarioId");
CREATE INDEX "Resultado_nivelRiesgo_idx" ON "Resultado"("nivelRiesgo");
CREATE INDEX "Resultado_fechaEvaluacion_idx" ON "Resultado"("fechaEvaluacion");

-- ChatSession table
CREATE TABLE "ChatSession" (
    "id" SERIAL PRIMARY KEY,
    "usuarioId" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaUltimoMensaje" TIMESTAMP,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ChatSession_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
);

-- Indexes for ChatSession
CREATE INDEX "ChatSession_usuarioId_idx" ON "ChatSession"("usuarioId");
CREATE INDEX "ChatSession_activa_idx" ON "ChatSession"("activa");

-- MensajeChat table
CREATE TABLE "MensajeChat" (
    "id" SERIAL PRIMARY KEY,
    "chatSessionId" INTEGER NOT NULL,
    "remitente" VARCHAR(50) NOT NULL,
    "contenido" TEXT NOT NULL,
    "sentimiento" DOUBLE PRECISION,
    "fechaMensaje" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MensajeChat_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE
);

-- Indexes for MensajeChat
CREATE INDEX "MensajeChat_chatSessionId_idx" ON "MensajeChat"("chatSessionId");
CREATE INDEX "MensajeChat_fechaMensaje_idx" ON "MensajeChat"("fechaMensaje");

-- Ejercicio table
CREATE TABLE "Ejercicio" (
    "id" SERIAL PRIMARY KEY,
    "titulo" VARCHAR(255) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoEjercicio" NOT NULL,
    "duracionMinima" INTEGER NOT NULL DEFAULT 3,
    "duracionMaxima" INTEGER NOT NULL DEFAULT 10,
    "instrucciones" TEXT NOT NULL,
    "audioUrl" VARCHAR(255),
    "imagenUrl" VARCHAR(255)
);

-- Indexes for Ejercicio
CREATE INDEX "Ejercicio_tipo_idx" ON "Ejercicio"("tipo");

-- ProgresoEjercicio table
CREATE TABLE "ProgresoEjercicio" (
    "id" SERIAL PRIMARY KEY,
    "ejercicioId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "duracionReal" INTEGER NOT NULL,
    "completado" BOOLEAN NOT NULL DEFAULT false,
    "satisfaccion" INTEGER NOT NULL DEFAULT 0,
    "fechaCompletado" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgresoEjercicio_ejercicioId_fkey" FOREIGN KEY ("ejercicioId") REFERENCES "Ejercicio"("id"),
    CONSTRAINT "ProgresoEjercicio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
);

-- Indexes for ProgresoEjercicio
CREATE INDEX "ProgresoEjercicio_usuarioId_idx" ON "ProgresoEjercicio"("usuarioId");
CREATE INDEX "ProgresoEjercicio_ejercicioId_idx" ON "ProgresoEjercicio"("ejercicioId");
CREATE INDEX "ProgresoEjercicio_fechaCompletado_idx" ON "ProgresoEjercicio"("fechaCompletado");

-- PostComunidad table
CREATE TABLE "PostComunidad" (
    "id" SERIAL PRIMARY KEY,
    "usuarioId" INTEGER NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "contenido" TEXT NOT NULL,
    "categoria" VARCHAR(100) NOT NULL,
    "fecha" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estadoModeracion" "EstadoModeracion" NOT NULL DEFAULT 'APROBADO',
    "likes" INTEGER NOT NULL DEFAULT 0,
    "reportado" BOOLEAN NOT NULL DEFAULT false,
    "reportadoCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PostComunidad_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
);

-- Indexes for PostComunidad
CREATE INDEX "PostComunidad_usuarioId_idx" ON "PostComunidad"("usuarioId");
CREATE INDEX "PostComunidad_categoria_idx" ON "PostComunidad"("categoria");
CREATE INDEX "PostComunidad_estadoModeracion_idx" ON "PostComunidad"("estadoModeracion");
CREATE INDEX "PostComunidad_fecha_idx" ON "PostComunidad"("fecha");

-- Comentario table
CREATE TABLE "Comentario" (
    "id" SERIAL PRIMARY KEY,
    "postId" INTEGER NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "contenido" TEXT NOT NULL,
    "fecha" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentId" INTEGER,
    CONSTRAINT "Comentario_postId_fkey" FOREIGN KEY ("postId") REFERENCES "PostComunidad"("id") ON DELETE CASCADE,
    CONSTRAINT "Comentario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
);

-- Indexes for Comentario
CREATE INDEX "Comentario_postId_idx" ON "Comentario"("postId");
CREATE INDEX "Comentario_usuarioId_idx" ON "Comentario"("usuarioId");

-- Logro table
CREATE TABLE "Logro" (
    "id" SERIAL PRIMARY KEY,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "puntos" INTEGER NOT NULL,
    "criterio" TEXT NOT NULL,
    "icono" VARCHAR(255)
);

-- Indexes for Logro
CREATE INDEX "Logro_puntos_idx" ON "Logro"("puntos");

-- UsuarioLogro table
CREATE TABLE "UsuarioLogro" (
    "id" SERIAL PRIMARY KEY,
    "usuarioId" INTEGER NOT NULL,
    "logroId" INTEGER NOT NULL,
    "fechaDesbloqueado" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UsuarioLogro_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id"),
    CONSTRAINT "UsuarioLogro_logroId_fkey" FOREIGN KEY ("logroId") REFERENCES "Logro"("id"),
    CONSTRAINT "UsuarioLogro_usuarioId_logroId_key" UNIQUE ("usuarioId", "logroId")
);

-- Indexes for UsuarioLogro
CREATE INDEX "UsuarioLogro_usuarioId_idx" ON "UsuarioLogro"("usuarioId");
CREATE INDEX "UsuarioLogro_logroId_idx" ON "UsuarioLogro"("logroId");

-- AlertaRiesgo table
CREATE TABLE "AlertaRiesgo" (
    "id" SERIAL PRIMARY KEY,
    "estudianteId" INTEGER NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "nivelRiesgo" "NivelRiesgo" NOT NULL,
    "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extracto" TEXT NOT NULL,
    "estado" "EstadoAlerta" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "resultadoId" INTEGER,
    "chatSessionId" INTEGER,
    "ipOrigen" VARCHAR(50),
    "userAgent" TEXT,
    CONSTRAINT "AlertaRiesgo_estudianteId_fkey" FOREIGN KEY ("estudianteId") REFERENCES "Usuario"("id"),
    CONSTRAINT "AlertaRiesgo_resultadoId_fkey" FOREIGN KEY ("resultadoId") REFERENCES "Resultado"("id"),
    CONSTRAINT "AlertaRiesgo_chatSessionId_fkey" FOREIGN KEY ("chatSessionId") REFERENCES "ChatSession"("id")
);

-- Indexes for AlertaRiesgo
CREATE INDEX "AlertaRiesgo_estudianteId_idx" ON "AlertaRiesgo"("estudianteId");
CREATE INDEX "AlertaRiesgo_estado_idx" ON "AlertaRiesgo"("estado");
CREATE INDEX "AlertaRiesgo_timestamp_idx" ON "AlertaRiesgo"("timestamp");
CREATE INDEX "AlertaRiesgo_nivelRiesgo_idx" ON "AlertaRiesgo"("nivelRiesgo");

-- AuditoriaAlerta table
CREATE TABLE "AuditoriaAlerta" (
    "id" SERIAL PRIMARY KEY,
    "alertaId" INTEGER NOT NULL,
    "accion" VARCHAR(255) NOT NULL,
    "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" VARCHAR(50),
    "userAgent" TEXT,
    "detalles" TEXT,
    CONSTRAINT "AuditoriaAlerta_alertaId_fkey" FOREIGN KEY ("alertaId") REFERENCES "AlertaRiesgo"("id") ON DELETE CASCADE
);

-- Indexes for AuditoriaAlerta
CREATE INDEX "AuditoriaAlerta_alertaId_idx" ON "AuditoriaAlerta"("alertaId");
CREATE INDEX "AuditoriaAlerta_timestamp_idx" ON "AuditoriaAlerta"("timestamp");

-- Informe table
CREATE TABLE "Informe" (
    "id" SERIAL PRIMARY KEY,
    "resultadoId" INTEGER NOT NULL,
    "padreId" INTEGER,
    "psicologoId" INTEGER,
    "resumen" TEXT NOT NULL,
    "detalle" TEXT NOT NULL,
    "recomendaciones" TEXT NOT NULL,
    "nivelRiesgo" "NivelRiesgo" NOT NULL,
    "fechaEnvio" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estadoLectura" "EstadoInforme" NOT NULL DEFAULT 'GENERADO',
    "hashSeguridad" VARCHAR(255) UNIQUE NOT NULL,
    "tokenAcceso" VARCHAR(255) UNIQUE NOT NULL,
    "expiracionToken" TIMESTAMP,
    CONSTRAINT "Informe_resultadoId_fkey" FOREIGN KEY ("resultadoId") REFERENCES "Resultado"("id"),
    CONSTRAINT "Informe_padreId_fkey" FOREIGN KEY ("padreId") REFERENCES "Usuario"("id"),
    CONSTRAINT "Informe_psicologoId_fkey" FOREIGN KEY ("psicologoId") REFERENCES "Usuario"("id")
);

-- Indexes for Informe
CREATE INDEX "Informe_padreId_idx" ON "Informe"("padreId");
CREATE INDEX "Informe_resultadoId_idx" ON "Informe"("resultadoId");
CREATE INDEX "Informe_estadoLectura_idx" ON "Informe"("estadoLectura");

-- SesionActiva table
CREATE TABLE "SesionActiva" (
    "id" SERIAL PRIMARY KEY,
    "usuarioId" INTEGER NOT NULL,
    "token" VARCHAR(255) UNIQUE NOT NULL,
    "refreshToken" VARCHAR(255),
    "ip" VARCHAR(50) NOT NULL,
    "userAgent" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaUltimaActividad" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SesionActiva_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
);

-- Indexes for SesionActiva
CREATE INDEX "SesionActiva_usuarioId_idx" ON "SesionActiva"("usuarioId");
CREATE INDEX "SesionActiva_token_idx" ON "SesionActiva"("token");

-- PreferenciasUsuario table
CREATE TABLE "PreferenciasUsuario" (
    "id" SERIAL PRIMARY KEY,
    "usuarioId" INTEGER UNIQUE NOT NULL,
    "notificacionesChat" BOOLEAN NOT NULL DEFAULT true,
    "notificacionesEjercicios" BOOLEAN NOT NULL DEFAULT true,
    "notificacionesComunidad" BOOLEAN NOT NULL DEFAULT true,
    "notificacionesAlertas" BOOLEAN NOT NULL DEFAULT true,
    "horaRecordatorio" VARCHAR(10) DEFAULT '09:00',
    "temaOscuro" BOOLEAN NOT NULL DEFAULT false,
    "idioma" VARCHAR(10) NOT NULL DEFAULT 'es',
    CONSTRAINT "PreferenciasUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id")
);

-- Indexes for PreferenciasUsuario
CREATE INDEX "PreferenciasUsuario_usuarioId_idx" ON "PreferenciasUsuario"("usuarioId");

-- Insert initial data (optional sample data)
-- Sample Cuestionario
INSERT INTO "Cuestionario" ("titulo", "descripcion", "instrucciones", "categoria", "estado") VALUES
('Evaluación de Ansiedad', 'Cuestionario para evaluar niveles de ansiedad en estudiantes', 'Responda cada pregunta sinceramente seleccionando la opción que mejor describa su situación', 'SALUD_MENTAL', 'publicado'),
('Evaluación de Depresión', 'Cuestionario para detectar signos de depresión', 'Lea cada pregunta y responda según cómo se ha sentido durante las últimas dos semanas', 'SALUD_MENTAL', 'publicado');

-- Sample Ejercicios
INSERT INTO "Ejercicio" ("titulo", "descripcion", "tipo", "duracionMinima", "duracionMaxima", "instrucciones") VALUES
('Respiración Profunda', 'Ejercicio de respiración para reducir el estrés', 'RESPIRACION', 3, 5, 'Siéntate cómodamente, cierra los ojos y respira profundamente siguiendo el ritmo indicado'),
('Meditación Guiada', 'Sesión de meditación para calmar la mente', 'MEDITACION', 5, 10, 'Encuentra un lugar tranquilo, siéntate y sigue las instrucciones de la guía'),
('Relajación Muscular', 'Técnica de relajación progresiva', 'RELAJACION', 5, 10, 'Tensa y relaja cada grupo muscular siguiendo la secuencia indicada');

-- Sample Logros
INSERT INTO "Logro" ("nombre", "descripcion", "puntos", "criterio") VALUES
('Primera Evaluación', 'Completa tu primer cuestionario de evaluación', 50, '{"tipo": "primer_cuestionario"}'),
('Semana Activa', 'Usa la app 7 días consecutivos', 100, '{"tipo": "consecutivo", "dias": 7}'),
('Maestro de la Calma', 'Completa 10 ejercicios de respiración', 75, '{"tipo": "ejercicios", "cantidad": 10, "tipo_ejercicio": "RESPIRACION"}'),
('Comunidad Activa', 'Publica 5 posts en la comunidad', 60, '{"tipo": "posts", "cantidad": 5}');

-- Grant permissions (adjust user/role as needed for Render)
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO your_render_user;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO your_render_user;
