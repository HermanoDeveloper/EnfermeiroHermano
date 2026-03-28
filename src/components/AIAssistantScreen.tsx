import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, ArrowLeft, RefreshCw, Sparkles, Info, History, X, Calendar, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { askAI, isAIConfigured } from '../services/gemini';
import { cn } from '../lib/utils';
import { Screen } from '../types';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  command?: any;
  suggestions?: string[];
}

interface ChatSession {
  id: string;
  date: Date;
  messages: Message[];
}

interface AIAssistantScreenProps {
  onBack: () => void;
  onNavigate?: (screen: Screen) => void;
  onShowDisease?: (disease: any) => void;
  onShowProcedure?: (procedure: any) => void;
}

export function AIAssistantScreen({ onBack, onNavigate, onShowDisease, onShowProcedure }: AIAssistantScreenProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('hermano_chat_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((s: any) => ({
          ...s,
          date: new Date(s.date),
          messages: Array.isArray(s.messages) 
            ? s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
            : []
        }));
      } catch (e) {
        console.error("Error parsing chat sessions", e);
      }
    }
    return [];
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('hermano_chat_history');
    const lastActive = localStorage.getItem('hermano_chat_last_active');
    const now = Date.now();
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

    const defaultGreeting: Message = {
      id: '1',
      text: 'Olá! Eu sou o Hermano, o seu assistente virtual da Biblioteca da Saúde de Moçambique. Forneço informações confiáveis baseadas em protocolos da OMS, MISAU e pesquisas atualizadas. Como posso ajudar você hoje?',
      sender: 'ai',
      timestamp: new Date(),
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed)) return [defaultGreeting];
        const history = parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
        
        // Check for inactivity
        if (lastActive && (now - parseInt(lastActive)) > INACTIVITY_LIMIT) {
          // Archive old history if it has more than just the greeting
          if (history.length > 1) {
            const newSession: ChatSession = {
              id: Date.now().toString(),
              date: history[0].timestamp,
              messages: history
            };
            const currentSessions = JSON.parse(localStorage.getItem('hermano_chat_sessions') || '[]');
            localStorage.setItem('hermano_chat_sessions', JSON.stringify([newSession, ...currentSessions]));
          }
          return [defaultGreeting];
        }
        return history;
      } catch (e) {
        console.error("Error parsing chat history", e);
      }
    }
    return [defaultGreeting];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    localStorage.setItem('hermano_chat_history', JSON.stringify(messages));
    localStorage.setItem('hermano_chat_last_active', Date.now().toString());
  }, [messages]);

  const handleClearChat = () => {
    if (messages.length > 1) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        date: messages[0].timestamp,
        messages: messages
      };
      const updatedSessions = [newSession, ...sessions];
      setSessions(updatedSessions);
      localStorage.setItem('hermano_chat_sessions', JSON.stringify(updatedSessions));
    }

    const defaultGreeting: Message = {
      id: Date.now().toString(),
      text: 'Chat reiniciado. Como posso ajudar você agora?',
      sender: 'ai',
      timestamp: new Date(),
    };
    setMessages([defaultGreeting]);
  };

  const handleLoadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setShowHistory(false);
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = typeof overrideInput === 'string' ? overrideInput : input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = textToSend;
    if (!overrideInput) setInput('');
    setIsLoading(true);

    try {
      const response = await askAI(currentInput, { currentScreen: 'ai-assistant' });
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'ai',
        timestamp: new Date(),
        command: response.command,
        suggestions: response.suggestions
      };
      setMessages((prev) => [...prev, aiMessage]);

      if (response.command) {
        if (response.command.action === 'navigate' && onNavigate) {
          setTimeout(() => {
            onNavigate(response.command.target as Screen);
          }, 2000);
        } else if (response.command.action === 'show_disease' && onShowDisease) {
          onShowDisease(response.command.params);
        } else if (response.command.action === 'show_procedure' && onShowProcedure) {
          onShowProcedure(response.command.params);
        }
      }
    } catch (error: any) {
      console.error('AI Assistant Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: error?.message?.includes('GEMINI_API_KEY') 
          ? 'Erro de Configuração: A chave da IA (GEMINI_API_KEY) não foi encontrada no ambiente de deploy. Por favor, verifique as variáveis de ambiente.'
          : 'Desculpe, o Hermano encontrou um erro ao processar sua solicitação. Por favor, tente novamente em alguns instantes.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface relative">
      {/* Header */}
      <header className="px-6 py-4 bg-surface border-b border-outline-variant/10 flex items-center gap-4 sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-on-surface" />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-headline font-bold text-lg text-on-surface">Doutor IA</h1>
            <p className="text-xs text-primary font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Fontes confiáveis: OMS, MISAU e Internet
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setShowHistory(true)}
            title="Histórico de conversas"
            className="p-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant"
          >
            <History className="w-5 h-5" />
          </button>
          <button 
            onClick={handleClearChat}
            title="Limpar conversa"
            className="p-2 rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* API Key Warning */}
      {!isAIConfigured && (
        <div className="bg-error/10 border-b border-error/20 px-6 py-3 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-error">Chave de API Ausente</p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              O Doutor IA não está configurado corretamente. Por favor, adicione a chave <code className="bg-error/5 px-1 rounded">GEMINI_API_KEY</code> nas variáveis de ambiente para ativar as funcionalidades de inteligência artificial.
            </p>
          </div>
        </div>
      )}

      {/* History Modal */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-surface w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-primary" />
                  <h2 className="font-headline font-bold text-lg">Histórico</h2>
                </div>
                <button 
                  onClick={() => setShowHistory(false)}
                  className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {sessions.length === 0 ? (
                  <div className="text-center py-12 text-on-surface-variant">
                    <p className="text-sm italic">Nenhum histórico salvo ainda.</p>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleLoadSession(session)}
                      className="w-full p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10 hover:border-primary/30 transition-all text-left group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-primary">
                          <Calendar className="w-3 h-3" />
                          {session.date.toLocaleDateString()} {session.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                          {session.messages.length} mensagens
                        </span>
                      </div>
                      <p className="text-sm text-on-surface line-clamp-2 opacity-80 group-hover:opacity-100">
                        {session.messages.find(m => m.sender === 'user')?.text || 'Conversa iniciada'}
                      </p>
                    </button>
                  ))
                )}
              </div>
              
              <div className="p-4 bg-surface-container-low border-t border-outline-variant/10">
                <button
                  onClick={() => {
                    localStorage.removeItem('hermano_chat_sessions');
                    setSessions([]);
                  }}
                  className="w-full py-3 text-sm font-medium text-error hover:bg-error/5 rounded-xl transition-colors"
                >
                  Limpar todo o histórico
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 overscroll-contain">
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {Array.isArray(messages) && messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  message.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  message.sender === 'user' ? "bg-secondary text-white" : "bg-primary text-white"
                )}>
                  {message.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                <div className={cn(
                  "p-4 rounded-2xl shadow-sm",
                  message.sender === 'user' 
                    ? "bg-secondary text-white rounded-tr-none" 
                    : "bg-surface-container-low border border-outline-variant/20 text-on-surface rounded-tl-none"
                )}>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap markdown-body">
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </div>
                  {Array.isArray(message.suggestions) && message.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {message.suggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(suggestion)}
                          className="text-xs bg-primary/5 hover:bg-primary/10 text-primary border border-primary/20 px-3 py-1.5 rounded-full transition-colors text-left font-medium"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className={cn(
                    "text-[10px] mt-2 opacity-60",
                    message.sender === 'user' ? "text-right" : "text-left"
                  )}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 mr-auto"
            >
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="bg-surface-container-low border border-outline-variant/20 p-4 rounded-2xl rounded-tl-none shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-surface border-t border-outline-variant/10">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Pergunte sobre medicamentos, doses ou contraindicações..."
              className="w-full bg-surface-container-low border border-outline-variant/30 rounded-2xl py-4 pl-6 pr-14 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:grayscale"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-on-surface-variant mt-3 text-center flex items-center justify-center gap-1">
            <Info className="w-3 h-3" /> Informações baseadas em fontes oficiais e confiáveis, incluindo OMS, MISAU e bases de dados globais.
          </p>
        </div>
      </div>
    </div>
  );
}
