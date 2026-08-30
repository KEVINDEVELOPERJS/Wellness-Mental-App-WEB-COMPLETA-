-- Create SesionJuego table
CREATE TABLE IF NOT EXISTS "SesionJuego" (
    "id" SERIAL PRIMARY KEY,
    "usuarioId" INTEGER NOT NULL,
    "tipoJuego" TEXT NOT NULL,
    "puntos" INTEGER NOT NULL DEFAULT 0,
    "combo" INTEGER NOT NULL DEFAULT 0,
    "duracion" INTEGER NOT NULL DEFAULT 0,
    "fechaSesion" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SesionJuego_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "SesionJuego_usuarioId_idx" ON "SesionJuego"("usuarioId");
CREATE INDEX IF NOT EXISTS "SesionJuego_tipoJuego_idx" ON "SesionJuego"("tipoJuego");
CREATE INDEX IF NOT EXISTS "SesionJuego_fechaSesion_idx" ON "SesionJuego"("fechaSesion");
