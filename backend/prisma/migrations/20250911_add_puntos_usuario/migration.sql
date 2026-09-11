-- Create PuntosUsuario table
-- Fuente de verdad del sistema de niveles: puntos acumulados por usuario.
CREATE TABLE IF NOT EXISTS "PuntosUsuario" (
    "id" SERIAL PRIMARY KEY,
    "usuarioId" INTEGER NOT NULL,
    "puntosTotales" INTEGER NOT NULL DEFAULT 0,
    "puntosJuegos" INTEGER NOT NULL DEFAULT 0,
    "actualizadoEn" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PuntosUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PuntosUsuario_usuarioId_key" ON "PuntosUsuario"("usuarioId");
CREATE INDEX IF NOT EXISTS "PuntosUsuario_usuarioId_idx" ON "PuntosUsuario"("usuarioId");

-- Backfill: inicializa los puntos de cada usuario a partir de las sesiones de
-- juego ya registradas, para no perder el progreso existente.
INSERT INTO "PuntosUsuario" ("usuarioId", "puntosTotales", "puntosJuegos", "actualizadoEn")
SELECT "usuarioId", COALESCE(SUM("puntos"), 0), COALESCE(SUM("puntos"), 0), CURRENT_TIMESTAMP
FROM "SesionJuego"
GROUP BY "usuarioId"
ON CONFLICT ("usuarioId") DO NOTHING;
