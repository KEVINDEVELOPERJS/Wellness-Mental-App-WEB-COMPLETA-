import prisma from '../../config/database';
import { Cuestionario, Pregunta, Respuesta, Resultado, RespuestaDTO, CuestionarioCompleto } from '../entities/Cuestionario';
import { NivelRiesgo } from '@prisma/client';
import { EncryptionService } from '../../services/EncryptionService';

export class CuestionarioRepository {
  static async findAll(): Promise<Cuestionario[]> {
    return prisma.cuestionario.findMany({
      where: { estado: 'publicado' },
      orderBy: { fechaCreacion: 'desc' },
    });
  }

  static async findById(id: number): Promise<CuestionarioCompleto | null> {
    return prisma.cuestionario.findUnique({
      where: { id },
      include: {
        preguntas: {
          orderBy: { orden: 'asc' },
        },
      },
    }) as Promise<CuestionarioCompleto | null>;
  }

  static async create(data: Omit<Cuestionario, 'id' | 'fechaCreacion'>): Promise<Cuestionario> {
    return prisma.cuestionario.create({
      data,
    });
  }

  static async update(id: number, data: Partial<Cuestionario>): Promise<Cuestionario> {
    return prisma.cuestionario.update({
      where: { id },
      data,
    });
  }

  static async addPregunta(cuestionarioId: number, pregunta: Omit<Pregunta, 'id'>): Promise<Pregunta> {
    return prisma.pregunta.create({
      data: {
        ...pregunta,
        cuestionarioId,
      },
    });
  }

  static async saveRespuestas(usuarioId: number, respuestas: RespuestaDTO[]): Promise<void> {
    await prisma.$transaction(async (tx) => {
      for (const respuesta of respuestas) {
        await tx.respuesta.create({
          data: {
            preguntaId: respuesta.preguntaId,
            usuarioId,
            valor: respuesta.valor,
            texto: respuesta.texto,
          },
        });
      }
    });
  }

  static async validateRespuestasCompletas(cuestionarioId: number, usuarioId: number): Promise<boolean> {
    const cuestionario = await this.findById(cuestionarioId);
    if (!cuestionario) return false;

    const preguntasIds = cuestionario.preguntas.map(p => p.id);
    const respuestasCount = await prisma.respuesta.count({
      where: {
        usuarioId,
        preguntaId: { in: preguntasIds },
      },
    });

    return respuestasCount === preguntasIds.length;
  }

  static async calcularPuntaje(usuarioId: number, cuestionarioId: number): Promise<number> {
    const cuestionario = await this.findById(cuestionarioId);
    if (!cuestionario) throw new Error('Cuestionario not found');

    const respuestas = await prisma.respuesta.findMany({
      where: {
        usuarioId,
        preguntaId: { in: cuestionario.preguntas.map(p => p.id) },
      },
      include: { pregunta: true },
    });

    return respuestas.reduce((sum, r) => sum + (r.valor * r.pregunta.peso), 0);
  }

  static async clasificarRiesgo(puntaje: number, totalPreguntas: number): Promise<NivelRiesgo> {
    const maxPuntaje = totalPreguntas * 3; // Assuming 0-3 scale
    const ratio = puntaje / maxPuntaje;

    if (ratio >= 0.67) return 'ALTO';
    if (ratio >= 0.33) return 'MEDIO';
    return 'BAJO';
  }

  static async generarPrediagnostico(riesgo: NivelRiesgo, respuestas: any[]): Promise<string> {
    const prediagnosticos = {
      BAJO: 'Los resultados indican un nivel de bienestar adecuado. Se recomienda mantener hábitos saludables y continuar con actividades de autocuidado.',
      MEDIO: 'Se detectan algunos indicadores de estrés moderado. Se sugiere practicar técnicas de relajación y considerar hablar con un consejero si los síntomas persisten.',
      ALTO: 'Los resultados sugieren un nivel de estrés significativo que podría requerir atención profesional. Se recomienda urgentemente consultar con un psicólogo o profesional de salud mental.',
    };

    return prediagnosticos[riesgo];
  }

  static async guardarResultado(
    usuarioId: number,
    cuestionarioId: number,
    puntaje: number,
    nivelRiesgo: NivelRiesgo,
    prediagnostico: string
  ): Promise<Resultado> {
    return prisma.resultado.create({
      data: {
        usuarioId,
        cuestionarioId,
        puntaje,
        nivelRiesgo,
        prediagnostico: EncryptionService.encrypt(prediagnostico),
      },
    });
  }

  static async getResultadosByUsuario(usuarioId: number): Promise<Resultado[]> {
    return prisma.resultado.findMany({
      where: { usuarioId },
      include: { cuestionario: true },
      orderBy: { fechaEvaluacion: 'desc' },
    });
  }

  static async getResultadoById(id: number): Promise<Resultado | null> {
    const resultado = await prisma.resultado.findUnique({
      where: { id },
      include: { cuestionario: true },
    });

    if (resultado) {
      resultado.prediagnostico = EncryptionService.decrypt(resultado.prediagnostico);
    }

    return resultado;
  }
}
