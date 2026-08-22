export interface Video {
  id: string;
  titulo: string;
  descripcion: string;
  categoria: string;
  duracion: string;
  thumbnail: string;
  url: string;
  fechaPublicacion: string;
  vistas: number;
  forumActivo: boolean;
  comentariosCount: number;
}

export interface ForumPost {
  id: string;
  videoId: string;
  usuario: string;
  contenido: string;
  fecha: string;
  likes: number;
  respuestas: ForumPost[];
}

export const videos: Video[] = [
  {
    id: '1',
    titulo: 'Historias de Salud Mental',
    descripcion: 'Historias inspiradoras de personas que han superado desafíos de salud mental, mostrando que no estás solo en tu camino hacia el bienestar.',
    categoria: 'Inspiración',
    duracion: '12:30',
    thumbnail: '/videos/historias de salud mental.jpg',
    url: '/videos/historias de salud mental.mp4',
    fechaPublicacion: '2024-01-15',
    vistas: 1234,
    forumActivo: true,
    comentariosCount: 45
  },
  {
    id: '2',
    titulo: 'Kiara en el Espejismo de la Vida',
    descripcion: 'Un viaje emocional a través de los reflejos de la vida, explorando cómo nuestras percepciones pueden distorsionar la realidad afectando nuestra salud mental.',
    categoria: 'Reflexión',
    duracion: '15:45',
    thumbnail: '/videos/kiara en el espejismo de la vida.jpg',
    url: '/videos/kiara en el espejismo de la vida.mp4',
    fechaPublicacion: '2024-02-20',
    vistas: 892,
    forumActivo: true,
    comentariosCount: 32
  },
  {
    id: '3',
    titulo: 'La Importancia de la Salud Mental desde lo Básico',
    descripcion: 'Fundamentos esenciales para entender y cuidar tu salud mental, con estrategias prácticas para incorporar el bienestar en tu vida diaria.',
    categoria: 'Educación',
    duracion: '18:20',
    thumbnail: '/videos/la importancia de la salud mental desde lo basico.jpg',
    url: '/videos/la importancia de la salud mental desde lo basico.mp4',
    fechaPublicacion: '2024-03-10',
    vistas: 2105,
    forumActivo: true,
    comentariosCount: 78
  },
  {
    id: '4',
    titulo: 'Las Cicatrices que se Pueden Volver Traumas',
    descripcion: 'Análisis profundo sobre cómo las experiencias dolorosas del pasado pueden convertirse en traumas si no son procesadas adecuadamente, y herramientas para sanar.',
    categoria: 'Sanación',
    duracion: '22:15',
    thumbnail: '/videos/las cicatrices que se pueden volver traumas.jpg',
    url: '/videos/las cicatrices que se pueden volver traumas.mp4',
    fechaPublicacion: '2024-04-05',
    vistas: 1567,
    forumActivo: true,
    comentariosCount: 67
  },
  {
    id: '5',
    titulo: 'Una Madre y sus Soles en Medio del Disciplinamiento Emocional',
    descripcion: 'Historia conmovedora sobre el vínculo materno y el desarrollo emocional, mostrando cómo el amor y la disciplina pueden coexistir de manera saludable.',
    categoria: 'Familia',
    duracion: '16:40',
    thumbnail: '/videos/una madre y sus soles en medio del diciplinamiento emocional.jpg',
    url: '/videos/una madre y sus soles en medio del diciplinamiento emocional.mp4',
    fechaPublicacion: '2024-05-12',
    vistas: 943,
    forumActivo: true,
    comentariosCount: 28
  },
  {
    id: '6',
    titulo: 'Cuidar sin Perderse',
    descripcion: 'Guía práctica para cuidar de otros sin descuidarte a ti mismo, aprendiendo a establecer límites saludables y mantener tu propio bienestar mientras ayudas.',
    categoria: 'Auto-cuidado',
    duracion: '14:25',
    thumbnail: '/videos/cuidar sin perderse .jpg',
    url: '/videos/cuidar sin perderse .mp4',
    fechaPublicacion: '2024-06-18',
    vistas: 1789,
    forumActivo: true,
    comentariosCount: 53
  }
];

export const categorias = [
  'Todas',
  'Inspiración',
  'Reflexión',
  'Educación',
  'Sanación',
  'Familia',
  'Auto-cuidado'
];

// Datos de ejemplo para foros (en producción vendrían de la base de datos)
export const forumPosts: Record<string, ForumPost[]> = {
  '1': [
    {
      id: '1-1',
      videoId: '1',
      usuario: 'María García',
      contenido: 'Este video me ayudó mucho cuando estaba pasando por un momento difícil. Las historias reales dan mucha esperanza.',
      fecha: '2024-01-20',
      likes: 12,
      respuestas: []
    },
    {
      id: '1-2',
      videoId: '1',
      usuario: 'Carlos López',
      contenido: 'Comparto la misma experiencia. A veces pensamos que estamos solos, pero hay mucha gente luchando batallas similares.',
      fecha: '2024-01-22',
      likes: 8,
      respuestas: []
    }
  ],
  '2': [
    {
      id: '2-1',
      videoId: '2',
      usuario: 'Ana Martínez',
      contenido: 'La metáfora del espejismo es muy poderosa. Me hizo reflexionar sobre cómo percibo mi propia realidad.',
      fecha: '2024-02-25',
      likes: 15,
      respuestas: []
    }
  ]
};