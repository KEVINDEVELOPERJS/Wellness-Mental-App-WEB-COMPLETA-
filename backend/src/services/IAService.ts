import axios from 'axios';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class IAService {
  private static readonly API_KEY = process.env.GEMINI_API_KEY;
  private static readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  private static readonly MODEL = 'gemini-pro';

  private static getSystemPrompt(): string {
    return `Eres un asistente psicológico empático y profesional especializado en apoyo emocional para adolescentes (13-18 años). Actúa como un mini psicólogo con capacitación en salud mental adolescente.

TU ROL PROFESIONAL:
- Escucha activa y validación emocional
- Apoyo psicológico basado en evidencia
- Técnicas de manejo del estrés y ansiedad
- Detección de señales de alerta en salud mental
- Fomento de comunicación con familia y profesionales

ENFOQUE PARA DIFERENTES NIVELES:

Para casos MODERADOS (depresión leve, ansiedad, estrés):
- Validar los sentimientos del adolescente
- Ofrecer técnicas de respiración y mindfulness
- Sugerir actividades saludables (ejercicio, socialización)
- Recomendar hablar con padres/tutores
- Proporcionar recursos de apoyo escolar

Para casos de ALTO RIESGO (pensamientos suicidas, depresión severa):
- PRIORIDAD ABSOLUTA: Seguridad inmediata
- Recomendar buscar ayuda profesional URGENTE
- Sugerir líneas de ayuda (ej: 911, líneas de crisis)
- Fomentar comunicación con adultos de confianza
- NO intentar resolver sola/o el problema

REGLAS ÉTICAS:
- NUNCA dar diagnósticos médicos (eso es para profesionales)
- NUNCA recetar medicamentos o tratamientos
- SIEMPRI reconocer los límites de la IA
- Mantener confidencialidad con excepciones de seguridad
- Usar lenguaje empático, no clínico excesivo
- Ser breve pero profundo (100-200 palabras por respuesta)

TÉCNICAS PSICOLÓGICAS A UTILIZAR:
- Validación emocional ("Comprendo que te sientas así")
- Reformulación positiva ("Aunque te sientas mal, hay esperanza")
- Preguntas abiertas ("¿Qué te hace sentir mejor?")
- Técnicas de grounding ("Describe 5 cosas que ves ahora")
- Breves ejercicios de respiración

SEÑALES DE ALERTA INMEDIATA (requieren acción):
- Pensamientos de autolesión o suicidio
- Desesperanza extremo o nihilismo
- Planes específicos para hacerse daño
- Aislamiento social completo
- Cambios drásticos en comportamiento

RESPUESTA EMPÁTICA TIPO:
"Entiendo que estés pasando por un momento difícil. Tus sentimientos son válidos y no estás solo/a en esto. ¿Quieres contarme más sobre lo que te preocupa? Estoy aquí para escucharte y ayudarte a encontrar recursos que puedan apoyarte."`;
  }

  static async generateResponse(userMessage: string, conversationHistory: ChatMessage[]): Promise<string> {
    try {
      // Check if API key is available
      if (!this.API_KEY) {
        console.error('GEMINI_API_KEY is not configured');
        return 'Lo siento, el servicio de IA no está configurado correctamente. Por favor, contacta al administrador.';
      }

      console.log('Calling Gemini API with message:', userMessage);
      console.log('API Key configured:', !!this.API_KEY);

      // Convert OpenAI format to Gemini format
      const geminiMessages = [
        { role: 'user', parts: [{ text: this.getSystemPrompt() }] },
        ...conversationHistory.slice(-10).map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })),
        { role: 'user', parts: [{ text: userMessage }] }
      ];

      console.log('Sending to Gemini:', JSON.stringify(geminiMessages, null, 2));

      const response = await axios.post(
        `${this.API_URL}?key=${this.API_KEY}`,
        {
          contents: geminiMessages,
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.7,
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        }
      );

      console.log('Gemini response:', JSON.stringify(response.data, null, 2));

      if (response.data.candidates && response.data.candidates[0]) {
        const text = response.data.candidates[0].content.parts[0].text;
        console.log('Generated response:', text);
        return text;
      }

      console.error('Invalid response structure from Gemini:', response.data);
      throw new Error('Invalid response from Gemini API');
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
      }
      return 'Entiendo que necesitas apoyo en este momento. Por favor, considera hablar con un adulto de confianza, un consejero escolar, o llamar a una línea de ayuda. Tu bienestar es importante y hay profesionales que pueden ayudarte.';
    }
  }

  static async analyzeSentiment(message: string): Promise<number> {
    // Enhanced sentiment analysis with more psychological terms
    const negativeWords = [
      'triste', 'ansioso', 'miedo', 'solo', 'desesperado', 'mal', 'deprimido',
      'quiero morir', 'suicidio', 'hacerme daño', 'vacío', 'sin esperanza',
      'pesar', 'angustia', 'panico', 'desesperanza', 'aislado', 'inútil',
      'culpa', 'verguenza', 'odio', 'daño', 'muerte', 'acabar'
    ];
    const positiveWords = [
      'feliz', 'bien', 'mejor', 'contento', 'tranquilo', 'aliviado', 'gracias',
      'esperanza', 'calma', 'paz', 'alegría', 'optimista', 'fortaleza',
      'apoyo', 'comprendido', 'escuchado', 'valor', 'motivado'
    ];
    
    const lowerMessage = message.toLowerCase();
    let score = 0.5; // neutral baseline

    negativeWords.forEach(word => {
      if (lowerMessage.includes(word)) score -= 0.12;
    });

    positiveWords.forEach(word => {
      if (lowerMessage.includes(word)) score += 0.1;
    });

    // Check for moderate depression indicators
    const moderateIndicators = ['cansado', 'sin energía', 'no me gusta nada', 'tristeza', 'llorar'];
    moderateIndicators.forEach(indicator => {
      if (lowerMessage.includes(indicator)) score -= 0.08;
    });

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  static detectRisk(message: string): 'ALTO' | 'MODERADO' | 'BAJO' {
    const highRiskPhrases = [
      'quiero morir', 'suicidio', 'hacerme daño', 'acabar con todo',
      'no quiero vivir', 'me quiero matar', 'me voy a matar', 'plan',
      'método', 'adiós', 'despedida', 'última vez'
    ];

    const moderateRiskPhrases = [
      'deprimido', 'triste', 'solo', 'vacío', 'sin esperanza',
      'cansado de vivir', 'no tiene sentido', 'desesperado',
      'no puedo más', 'sufrir', 'dolor emocional'
    ];

    const lowerMessage = message.toLowerCase();

    if (highRiskPhrases.some(phrase => lowerMessage.includes(phrase))) {
      return 'ALTO';
    }

    if (moderateRiskPhrases.some(phrase => lowerMessage.includes(phrase))) {
      return 'MODERADO';
    }

    return 'BAJO';
  }

  static getRiskLevel(sentiment: number): 'ALTO' | 'MODERADO' | 'BAJO' {
    if (sentiment < 0.3) return 'ALTO';
    if (sentiment < 0.5) return 'MODERADO';
    return 'BAJO';
  }
}
