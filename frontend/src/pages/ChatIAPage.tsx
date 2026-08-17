import { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import { useUIStore } from '../store/uiStore';
import { MensajeChat } from '../types/chat';
import { Send, Loader2, Bot, User, AlertTriangle } from 'lucide-react';

export default function ChatIAPage() {
  const { addToast } = useUIStore();
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [chatSessionId, setChatSessionId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeChat();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [mensajes, isTyping]);

  const initializeChat = async () => {
    try {
      console.log('Initializing chat session...');
      const session = await chatService.iniciarSesion();
      console.log('Chat session created:', session);
      setChatSessionId(session.id);
      
      // Load recent messages
      const recentMensajes = await chatService.getMensajes(session.id);
      setMensajes(recentMensajes.reverse());
    } catch (error) {
      console.error('Error initializing chat:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo inicializar el chat. Por favor verifica tu conexión.',
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsLoading(true);

    try {
      console.log('Sending message:', userMessage);
      const response = await chatService.enviarMensaje({
        contenido: userMessage,
        chatSessionId: chatSessionId || undefined,
      });
      console.log('Message response:', response);

      // Add user message
      setMensajes(prev => [...prev, {
        id: Date.now(),
        chatSessionId: chatSessionId || 0,
        remitente: 'usuario',
        contenido: userMessage,
        fechaMensaje: new Date().toISOString(),
      }]);

      // Check for risk alert
      if (response.requiereAlerta) {
        addToast({
          type: 'warning',
          title: 'Mensaje de ayuda',
          message: 'Si estás pasando por una situación difícil, por favor habla con un adulto de confianza o profesional.',
        });
      }

      // Show typing indicator
      setIsTyping(true);

      // Simulate typing delay
      setTimeout(() => {
        setIsTyping(false);
        
        // Add AI response
        setMensajes(prev => [...prev, response.mensaje]);
      }, 1000 + Math.random() * 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo enviar el mensaje. Por favor verifica tu conexión.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] space-y-4">
      {/* Header */}
      <div className="bg-card rounded-xl p-4 border flex items-center space-x-4">
        <div className="bg-primary/10 rounded-full p-3">
          <Bot className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">Asistente de Bienestar</h1>
          <p className="text-sm text-muted-foreground">
            Estoy aquí para escucharte y apoyarte
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-green-100 px-3 py-1 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-green-700">En línea</span>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 bg-card rounded-xl border overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Welcome Message */}
          {mensajes.length === 0 && (
            <div className="text-center py-8">
              <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">¡Hola! 👋</h3>
              <p className="text-muted-foreground">
                Soy tu asistente de bienestar mental. ¿En qué puedo ayudarte hoy?
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 max-w-md mx-auto">
                <button
                  onClick={() => setInputText('Me siento un poco ansioso últimamente')}
                  className="p-3 bg-secondary rounded-lg text-sm hover:bg-accent transition-colors"
                >
                  Me siento ansioso
                </button>
                <button
                  onClick={() => setInputText('Tengo problemas para dormir')}
                  className="p-3 bg-secondary rounded-lg text-sm hover:bg-accent transition-colors"
                >
                  Problemas para dormir
                </button>
                <button
                  onClick={() => setInputText('Me siento estresado por la escuela')}
                  className="p-3 bg-secondary rounded-lg text-sm hover:bg-accent transition-colors"
                >
                  Estrés escolar
                </button>
                <button
                  onClick={() => setInputText('Quiero aprender técnicas de relajación')}
                  className="p-3 bg-secondary rounded-lg text-sm hover:bg-accent transition-colors"
                >
                  Técnicas de relajación
                </button>
              </div>
            </div>
          )}

          {/* Messages */}
          {mensajes.map((mensaje) => (
            <MessageBubble key={mensaje.id} mensaje={mensaje} />
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-center space-x-2">
              <div className="bg-secondary rounded-full p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t bg-secondary/50">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Escribe tu mensaje..."
                rows={1}
                className="w-full px-4 py-3 pr-12 bg-background border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading}
              className="bg-primary text-white p-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-800">
            Este asistente no proporciona diagnósticos médicos. Si estás en crisis o necesitas ayuda inmediata, 
            contacta con servicios de emergencia o líneas de ayuda disponibles en tu país.
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ mensaje }: { mensaje: MensajeChat }) {
  const isUser = mensaje.remitente === 'usuario';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start space-x-3 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <div className={`flex-shrink-0 rounded-full p-2 ${
          isUser ? 'bg-primary text-white' : 'bg-secondary'
        }`}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser 
            ? 'bg-primary text-white' 
            : 'bg-secondary'
        }`}>
          <p className="text-sm leading-relaxed">{mensaje.contenido}</p>
          <p className={`text-xs mt-1 ${isUser ? 'text-white/70' : 'text-muted-foreground'}`}>
            {new Date(mensaje.fechaMensaje).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
