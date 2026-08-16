import axios from 'axios';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class IAService {
  private static readonly API_KEY = process.env.OPENAI_API_KEY;
  private static readonly API_URL = 'https://api.openai.com/v1/chat/completions';
  private static readonly MODEL = 'gpt-3.5-turbo';

  private static getSystemPrompt(): string {
    return `Eres un asistente empático y amigable para adolescentes (13-18 años) que están experimentando estrés, ansiedad u otros desafíos emocionales. 

TU ROL:
- Escuchar activamente y mostrar empatía
- Ofrecer apoyo emocional sin dar diagnósticos médicos
- Sugerir técnicas de manejo del estrés y respiración
- Fomentar la comunicación con padres/tutores cuando sea apropiado
- Reconocer cuando se necesita ayuda profesional

REGLAS IMPORTANTES:
- NUNCA dar diagnósticos médicos o psicológicos
- NUNCA recetar medicamentos o tratamientos
- SIEMPRE recomendar buscar ayuda profesional si el usuario expresa pensamientos suicidas
- Mantener un tono amable, comprensivo y apropiado para adolescentes
- Ser breve y directo (máximo 150 palabras por respuesta)
- Usar lenguaje sencillo y accesible

SEÑALES DE ALERTA (deben activar recomendación de ayuda profesional):
- Pensamientos de hacerse daño
- Sentimientos de desesperanza extremos
- Menciones de suicidio
- Síntomas que interfieren significativamente con la vida diaria`;
  }

  static async generateResponse(userMessage: string, conversationHistory: ChatMessage[]): Promise<string> {
    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: this.getSystemPrompt() },
        ...conversationHistory.slice(-10), // Keep last 10 messages for context
        { role: 'user', content: userMessage },
      ];

      const response = await axios.post(
        this.API_URL,
        {
          model: this.MODEL,
          messages,
          max_tokens: 300,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.API_KEY}`,
          },
          timeout: 10000,
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      return 'Lo siento, estoy teniendo dificultades para responder en este momento. Por favor, intenta nuevamente más tarde o habla con un adulto de confianza.';
    }
  }

  static async analyzeSentiment(message: string): Promise<number> {
    // Simple sentiment analysis (0.0 = negative, 1.0 = positive)
    // In production, this would use a proper NLP service
    const negativeWords = ['triste', 'ansioso', 'miedo', 'solo', 'desesperado', 'mal', 'mal', 'quiero morir', 'suicidio', 'hacerme daño'];
    const positiveWords = ['feliz', 'bien', 'mejor', 'contento', 'tranquilo', 'aliviado', 'gracias'];
    
    const lowerMessage = message.toLowerCase();
    let score = 0.5; // neutral baseline

    negativeWords.forEach(word => {
      if (lowerMessage.includes(word)) score -= 0.15;
    });

    positiveWords.forEach(word => {
      if (lowerMessage.includes(word)) score += 0.1;
    });

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  static detectRisk(message: string): boolean {
    const highRiskPhrases = [
      'quiero morir',
      'suicidio',
      'hacerme daño',
      'acabar con todo',
      'no quiero vivir',
      'me quiero matar',
      'me voy a matar',
    ];

    const lowerMessage = message.toLowerCase();
    return highRiskPhrases.some(phrase => lowerMessage.includes(phrase));
  }
}
