import { PrismaClient, Rol, TipoEjercicio } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Crear ejercicios de respiración
  const ejercicios = await Promise.all([
    prisma.ejercicio.create({
      data: {
        titulo: 'Respiración 4-7-8',
        descripcion: 'Técnica de respiración relajante para reducir ansiedad',
        tipo: TipoEjercicio.RESPIRACION,
        duracionMinima: 3,
        duracionMaxima: 10,
        instrucciones: 'Inhala por la nariz durante 4 segundos, mantén el aire durante 7 segundos, exhala por la boca durante 8 segundos.',
        audioUrl: '/audio/respiracion-4-7-8.mp3',
        imagenUrl: '/images/respiracion.jpg',
      },
    }),
    prisma.ejercicio.create({
      data: {
        titulo: 'Respiración de Caja',
        descripcion: 'Técnica de respiración equilibrante',
        tipo: TipoEjercicio.RESPIRACION,
        duracionMinima: 3,
        duracionMaxima: 5,
        instrucciones: 'Inhala 4 segundos, mantén 4 segundos, exhala 4 segundos, mantén vacío 4 segundos. Repite el ciclo.',
        audioUrl: '/audio/respiracion-caja.mp3',
        imagenUrl: '/images/caja.jpg',
      },
    }),
    prisma.ejercicio.create({
      data: {
        titulo: 'Respiración Coherente',
        descripcion: 'Sincroniza tu respiración con tu ritmo cardíaco',
        tipo: TipoEjercicio.RESPIRACION,
        duracionMinima: 5,
        duracionMaxima: 10,
        instrucciones: 'Respira a un ritmo de 5 segundos inhalar, 5 segundos exhalar. Mantén un ritmo constante.',
        audioUrl: '/audio/respiracion-coherente.mp3',
        imagenUrl: '/images/coherente.jpg',
      },
    }),
    prisma.ejercicio.create({
      data: {
        titulo: 'Meditación Guiada',
        descripcion: 'Meditación de atención plena para principiantes',
        tipo: TipoEjercicio.MEDITACION,
        duracionMinima: 5,
        duracionMaxima: 15,
        instrucciones: 'Siéntate cómodamente, cierra los ojos y enfócate en tu respiración. Deja que los pensamientos pasen sin juzgarlos.',
        audioUrl: '/audio/meditacion-guiada.mp3',
        imagenUrl: '/images/meditacion.jpg',
      },
    }),
    prisma.ejercicio.create({
      data: {
        titulo: 'Relajación Muscular Progresiva',
        descripcion: 'Relaja cada grupo muscular de tu cuerpo',
        tipo: TipoEjercicio.RELAJACION,
        duracionMinima: 10,
        duracionMaxima: 20,
        instrucciones: 'Tensa y relaja cada grupo muscular, desde los pies hasta la cabeza. Siente la diferencia entre tensión y relajación.',
        audioUrl: '/audio/relajacion-muscular.mp3',
        imagenUrl: '/images/relajacion.jpg',
      },
    }),
  ]);

  console.log(`Created ${ejercicios.length} exercises`);

  // Crear logros
  const logros = await Promise.all([
    prisma.logro.create({
      data: {
        nombre: 'Primer Chat',
        descripcion: 'Inicia tu primera conversación con el asistente de IA',
        puntos: 200,
        criterio: JSON.stringify({ tipo: 'primer_chat' }),
        icono: '💬',
      },
    }),
    prisma.logro.create({
      data: {
        nombre: '7 Días Seguidos',
        descripcion: 'Completa ejercicios durante 7 días consecutivos',
        puntos: 300,
        criterio: JSON.stringify({ tipo: 'racha_dias', dias: 7 }),
        icono: '🔥',
      },
    }),
    prisma.logro.create({
      data: {
        nombre: '5 Ejercicios',
        descripcion: 'Completa 5 ejercicios de respiración',
        puntos: 250,
        criterio: JSON.stringify({ tipo: 'ejercicios_completados', cantidad: 5 }),
        icono: '🧘',
      },
    }),
    prisma.logro.create({
      data: {
        nombre: 'Explorador',
        descripcion: 'Completa tu primera evaluación psicológica',
        puntos: 500,
        criterio: JSON.stringify({ tipo: 'primera_evaluacion' }),
        icono: '🧭',
      },
    }),
    prisma.logro.create({
      data: {
        nombre: 'Apoyo Compartido',
        descripcion: 'Publica tu primer mensaje en la comunidad',
        puntos: 150,
        criterio: JSON.stringify({ tipo: 'primer_post' }),
        icono: '🤝',
      },
    }),
    prisma.logro.create({
      data: {
        nombre: 'Maestro de la Calma',
        descripcion: 'Alcanza el nivel de Maestro',
        puntos: 1000,
        criterio: JSON.stringify({ tipo: 'nivel', nivel: 'MAESTRO' }),
        icono: '🏆',
      },
    }),
  ]);

  console.log(`Created ${logros.length} achievements`);

  // Crear cuestionarios predefinidos (GAD-7, PHQ-9, PSS-10)
  const cuestionarioGAD7 = await prisma.cuestionario.create({
    data: {
      titulo: 'Escala de Ansiedad GAD-7',
      descripcion: 'Cuestionario para evaluar el nivel de ansiedad',
      instrucciones: 'Responde pensando en las últimas dos semanas. Selecciona la opción que mejor describa tu situación.',
      categoria: 'Ansiedad',
      estado: 'publicado',
      preguntas: {
        create: [
          {
            texto: 'Sentirse nervioso, ansioso o muy tenso',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 1,
            opciones: JSON.stringify(['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días']),
          },
          {
            texto: 'No poder impedir de preocuparse',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 2,
            opciones: JSON.stringify(['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días']),
          },
          {
            texto: 'Preocuparse demasiado sobre diferentes cosas',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 3,
            opciones: JSON.stringify(['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días']),
          },
          {
            texto: 'Dificultad para relajarse',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 4,
            opciones: JSON.stringify(['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días']),
          },
          {
            texto: 'Tan inquieto que le cuesta quedarse quieto',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 5,
            opciones: JSON.stringify(['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días']),
          },
          {
            texto: 'Sentirse fácilmente irritado o molesto',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 6,
            opciones: JSON.stringify(['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días']),
          },
          {
            texto: 'Sentirse miedo como si algo terrible fuera a pasar',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 7,
            opciones: JSON.stringify(['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días']),
          },
        ],
      },
    },
  });
  console.log(`Created GAD-7 questionnaire with ID: ${cuestionarioGAD7.id}`);

  const cuestionarioPHQ9 = await prisma.cuestionario.create({
    data: {
      titulo: 'Cuestionario de Salud Paciente PHQ-9',
      descripcion: 'Evaluación de síntomas depresivos',
      instrucciones: 'Responde pensando en las últimas dos semanas. Selecciona la opción que mejor describa tu situación.',
      categoria: 'Depresión',
      estado: 'publicado',
      preguntas: {
        create: [
          {
            texto: 'Poco interés o placer en hacer cosas',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 1,
            opciones: JSON.stringify(['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días']),
          },
          {
            texto: 'Sentirse decaído, deprimido o sin esperanza',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 2,
            opciones: JSON.stringify(['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días']),
          },
          {
            texto: 'Dificultad para quedarse o permanecer dormido, o dormir demasiado',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 3,
            opciones: JSON.stringify(['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días']),
          },
          {
            texto: 'Sentirse cansado o tener poca energía',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 4,
            opciones: JSON.stringify(['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días']),
          },
          {
            texto: 'Sin apetito o comer demasiado',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 5,
            opciones: JSON.stringify(['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días']),
          },
          {
            texto: 'Sentirse mal con uno mismo - o pensar que es un fracaso o que ha decepcionado a su familia',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 6,
            opciones: JSON.stringify(['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días']),
          },
          {
            texto: 'Dificultad para concentrarse en cosas como leer el periódico o ver la televisión',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 7,
            opciones: JSON.stringify(['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días']),
          },
          {
            texto: 'Movimientos o habla lentos, o lo contrario - estar tan inquieto que le cuesta quedarse quieto',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 8,
            opciones: JSON.stringify(['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días']),
          },
          {
            texto: 'Pensaría que estaría mejor muerto/a o de hacerse daño',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 9,
            opciones: JSON.stringify(['Nunca', 'Varios días', 'Más de la mitad de los días', 'Casi todos los días']),
          },
        ],
      },
    },
  });
  console.log(`Created PHQ-9 questionnaire with ID: ${cuestionarioPHQ9.id}`);

  const cuestionarioPSS10 = await prisma.cuestionario.create({
    data: {
      titulo: 'Escala de Estrés Percibido PSS-10',
      descripcion: 'Medición del nivel de estrés percibido',
      instrucciones: 'Responde pensando en el último mes. Indica con qué frecuencia ha pensado o se ha sentido de esa manera.',
      categoria: 'Estrés',
      estado: 'publicado',
      preguntas: {
        create: [
          {
            texto: 'Se ha molesto por cosas que han ocurrido fuera de su control',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 1,
            opciones: JSON.stringify(['Nunca', 'Casi nunca', 'A veces', 'Bastante a menudo', 'Muy a menudo']),
          },
          {
            texto: 'Ha sentido que no ha podido controlar todas las cosas que tenía que hacer',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 2,
            opciones: JSON.stringify(['Nunca', 'Casi nunca', 'A veces', 'Bastante a menudo', 'Muy a menudo']),
          },
          {
            texto: 'Ha sentido que no podía afrontar todas las cosas que tenía que hacer',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 3,
            opciones: JSON.stringify(['Nunca', 'Casi nunca', 'A veces', 'Bastante a menudo', 'Muy a menudo']),
          },
          {
            texto: 'Ha sido capaz de controlar las irritaciones',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 4,
            opciones: JSON.stringify(['Nunca', 'Casi nunca', 'A veces', 'Bastante a menudo', 'Muy a menudo']),
          },
          {
            texto: 'Ha sentido que las cosas le iban bien',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 5,
            opciones: JSON.stringify(['Nunca', 'Casi nunca', 'A veces', 'Bastante a menudo', 'Muy a menudo']),
          },
          {
            texto: 'Ha sentido que no podía superar las dificultades',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 6,
            opciones: JSON.stringify(['Nunca', 'Casi nunca', 'A veces', 'Bastante a menudo', 'Muy a menudo']),
          },
          {
            texto: 'Ha sido capaz de controlar los eventos de su vida',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 7,
            opciones: JSON.stringify(['Nunca', 'Casi nunca', 'A veces', 'Bastante a menudo', 'Muy a menudo']),
          },
          {
            texto: 'Ha sentido que tenía todo bajo control',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 8,
            opciones: JSON.stringify(['Nunca', 'Casi nunca', 'A veces', 'Bastante a menudo', 'Muy a menudo']),
          },
          {
            texto: 'Ha se enojado porque las cosas que le ocurrieron estaban fuera de su control',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 9,
            opciones: JSON.stringify(['Nunca', 'Casi nunca', 'A veces', 'Bastante a menudo', 'Muy a menudo']),
          },
          {
            texto: 'Ha sentido que las dificultades se acumulaban tanto que no podía superarlas',
            tipoRespuesta: 'likert',
            peso: 1.0,
            orden: 10,
            opciones: JSON.stringify(['Nunca', 'Casi nunca', 'A veces', 'Bastante a menudo', 'Muy a menudo']),
          },
        ],
      },
    },
  });
  console.log(`Created PSS-10 questionnaire with ID: ${cuestionarioPSS10.id}`);

  console.log('Created questionnaires: GAD-7, PHQ-9, PSS-10');

  // Crear usuario psicólogo por defecto
  const bcrypt = require('bcrypt');
  const passwordHash = await bcrypt.hash('admin123', 12);
  
  const psicologo = await prisma.usuario.create({
    data: {
      nombre: 'Dr. Psicólogo',
      email: 'psicologo@wellness.com',
      passwordHash,
      edad: 35,
      grado: 'N/A',
      rol: Rol.PSICOLOGO,
      estado: 'ACTIVO',
      consentimientoPadres: true,
      telefono: '+1234567890',
    },
  });
  console.log(`Created psychologist user with ID: ${psicologo.id}`);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
