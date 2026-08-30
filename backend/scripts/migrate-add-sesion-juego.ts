import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateSesionJuego() {
  try {
    console.log('Starting migration: Add SesionJuego table...');
    
    // Create the table using raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "SesionJuego" (
        "id" SERIAL PRIMARY KEY,
        "usuarioId" INTEGER NOT NULL,
        "tipoJuego" TEXT NOT NULL,
        "puntos" INTEGER NOT NULL DEFAULT 0,
        "combo" INTEGER NOT NULL DEFAULT 0,
        "duracion" INTEGER NOT NULL DEFAULT 0,
        "fechaSesion" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "SesionJuego_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `;
    
    console.log('Created SesionJuego table');
    
    // Create indexes
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "SesionJuego_usuarioId_idx" ON "SesionJuego"("usuarioId")`;
    console.log('Created index: SesionJuego_usuarioId_idx');
    
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "SesionJuego_tipoJuego_idx" ON "SesionJuego"("tipoJuego")`;
    console.log('Created index: SesionJuego_tipoJuego_idx');
    
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "SesionJuego_fechaSesion_idx" ON "SesionJuego"("fechaSesion")`;
    console.log('Created index: SesionJuego_fechaSesion_idx');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateSesionJuego();