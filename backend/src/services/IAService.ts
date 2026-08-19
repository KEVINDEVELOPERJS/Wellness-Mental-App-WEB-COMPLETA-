import axios from 'axios';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class IAService {
  private static readonly API_KEY = process.env.GEMINI_API_KEY;
  private static readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
  private static readonly MODEL = 'gemini-1.5-pro';

  private static getSystemPrompt(): string {
    return `Eres un asistente psicológico ALTAMENTE EMPÁTICO y profesional especializado en apoyo emocional para adolescentes (13-18 años). Tu prioridad absoluta es la conexión emocional genuina y el apoyo compasivo.

TU ENFOQUE EMPÁTICO:
- Escucha activa profunda: "Te escucho realmente y lo que sientes importa"
- Validación emocional total: "Tus sentimientos son completamente válidos"
- Conexión humana: Usa lenguaje cálido, cercano y comprensivo
- Sin juicio: Crear un espacio seguro donde puedan expresarse libremente
- Esperanza genuina: "Hay ayuda disponible y cosas pueden mejorar"

ESTILO DE COMUNICACIÓN:
- Usa "tú" de forma cercana y respetuosa
- Expresiones de empatía: "Lamento mucho que pases por esto", "Entiendo lo difícil que es"
- Reconocimiento emocional: "Es normal sentirse así", "Tus sentimientos son importantes"
- Lenguaje cálido: "Estoy aquí para ti", "No estás solo/a en esto"
- Evita ser demasiado clínico o técnico

DETECCIÓN DE CRISIS (ALTA PRIORIDAD):
Si el usuario menciona:
- Pensamientos de suicidio, autolesión, "quiero morir"
- Desesperanza extremo, "no tiene sentido seguir"
- Planes específicos para hacerse daño
- Aislamiento completo con ideación suicida

RESPUESTA INMEDIATA:
"Veo que estás pasando por un momento muy difícil y doloroso. Por favor, considera hablar con alguien de confianza - un familiar, profesor, consejero escolar, o llamar a una línea de ayuda como 911. Hay personas que quieren ayudarte y mereces sentirte mejor. Tu vida tiene valor."

SOPORTE PARA DIFICULTADES MODERADAS:
Para depresión leve, ansiedad, estrés:
- "Entiendo lo difícil que es sentirse así"
- "No estás solo/a en esto"
- "Hay técnicas que pueden ayudarte"
- "Considera hablar con un consejero o profesional"
- Ofrece técnicas de respiración, mindfulness, actividades saludables

TÉCNICAS EMPÁTICAS ESPECÍFICAS:
1. Validación: "Lo que sientes es completamente válido"
2. Normalización: "Es normal sentirse así en situaciones difíciles"
3. Esperanza: "Aunque ahora parezca oscuro, hay ayuda disponible"
4. Acción: "Pequeños pasos pueden hacer una gran diferencia"
5. Conexión: "Hay personas que se preocupan por ti"

FRASES EMPÁTICAS CLAVE:
- "Lamento mucho que estés pasando por esto"
- "Tus sentimientos son importantes y válidos"
- "No tienes que cargar con esto solo/a"
- "Hay recursos y personas que pueden ayudarte"
- "Mereces sentirte mejor"
- "Aunque ahora sea difícil, hay esperanza"

LÍMITES ÉTICOS CLAROS:
- NUNCA dar diagnósticos médicos
- NUNCA recetar medicamentos o tratamientos
- SIEMPRE reconocer los límites de la IA
- Mantener confidencialidad (excepto seguridad)
- Derivar a profesionales cuando sea necesario

LONGITUD DE RESPUESTA:
- 150-250 palabras para respuestas regulares
- Más cortas y directas en situaciones de crisis
- Foco en empatía y apoyo sobre explicaciones técnicas

RESPUESTA EMPÁTICA MODELO:
"Entiendo que estás pasando por un momento muy difícil. Lo que sientes es completamente válido y eres valioso/a. No tienes que cargar con esto solo/a - hay personas que quieren ayudarte, incluyendo consejeros escolares, familiares y líneas de ayuda. Aunque ahora parezca oscuro, hay esperanza y recursos disponibles. ¿Quieres contarme más sobre lo que estás sintiendo? Estoy aquí para escucharte."`;

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
        console.error('=== GEMINI API KEY CONFIGURATION ERROR ===');
        console.error('GEMINI_API_KEY is not configured in environment variables');
        console.error('All environment variables:', Object.keys(process.env));
        console.error('API-related env vars:', Object.keys(process.env).filter(k => k.includes('API') || k.includes('GEMINI') || k.includes('KEY')));
        console.error('NODE_ENV:', process.env.NODE_ENV);
        console.error('=====================================');
        return 'Lo siento, el servicio de IA no está configurado correctamente. Por favor, contacta al administrador para configurar la API key de Gemini.';
      }

      console.log('=== GEMINI API CALL ===');
      console.log('Calling Gemini API with message:', userMessage);
      console.log('API Key configured:', !!this.API_KEY);
      console.log('API Key length:', this.API_KEY.length);
      console.log('API Key prefix:', this.API_KEY.substring(0, 10) + '...');
      console.log('=======================');

      // Convert OpenAI format to Gemini format
      const geminiMessages = [
        { role: 'user', parts: [{ text: this.getSystemPrompt() }] },
        ...conversationHistory.slice(-10).map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })),
        { role: 'user', parts: [{ text: userMessage }] }
      ];

      console.log('Sending to Gemini (message count):', geminiMessages.length);

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
          timeout: 30000, // Increased timeout
        }
      );

      console.log('Gemini response status:', response.status);
      console.log('Gemini response data:', JSON.stringify(response.data).substring(0, 500));

      if (response.data.candidates && response.data.candidates[0]) {
        const text = response.data.candidates[0].content.parts[0].text;
        console.log('Generated response length:', text.length);
        console.log('Generated response preview:', text.substring(0, 100) + '...');
        return text;
      }

      console.error('Invalid response structure from Gemini:', response.data);
      throw new Error('Invalid response from Gemini API');
    } catch (error) {
      console.error('=== GEMINI API ERROR ===');
      console.error('Error calling Gemini API:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('Axios error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          code: error.code,
        });
        
        // Specific error handling
        if (error.response?.status === 401) {
          console.error('API KEY INVALID - Check your GEMINI_API_KEY in Render environment variables');
          return 'Lo siento, hay un problema con la configuración de la API de IA. Por favor contacta al administrador.';
        }
        
        if (error.response?.status === 429) {
          console.error('RATE LIMIT EXCEEDED - Too many requests to Gemini API');
          return 'El servicio de IA está temporalmente ocupado. Por favor intenta de nuevo en unos minutos.';
        }
        
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          console.error('NETWORK ERROR - Cannot connect to Gemini API');
          return 'Hay problemas de conexión con el servicio de IA. Por favor verifica tu conexión a internet.';
        }
      }
      
      console.error('Error type:', error instanceof Error ? error.message : 'Unknown error');
      console.error('======================');
      
      // Fallback empathetic response
      return this.getFallbackResponse(userMessage);
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

  private static getFallbackResponse(userMessage: string): string {
    // Detect if user message indicates crisis
    const lowerMessage = userMessage.toLowerCase();
    const crisisIndicators = ['quiero morir', 'suicidio', 'hacerme daño', 'acabar con todo', 'no quiero vivir'];
    
    if (crisisIndicators.some(indicator => lowerMessage.includes(indicator))) {
      return 'Entiendo que estás pasando por un momento muy difícil. Por favor, considera hablar con un adulto de confianza, un consejero escolar, o llamar a una línea de ayuda como 911. Tu bienestar es importante y hay profesionales que pueden ayudarte.';
    }
    
    // General empathetic fallback
    return 'Entiendo que necesitas apoyo en este momento. Por favor, considera hablar con un adulto de confianza, un consejero escolar, o llamar a una línea de ayuda. Tu bienestar es importante y hay profesionales que pueden ayudarte.';
  }
}
