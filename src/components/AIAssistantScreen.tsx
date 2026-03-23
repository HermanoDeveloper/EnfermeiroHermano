import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Bot, User, ArrowLeft, RefreshCw, Sparkles, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { askAI } from '../services/gemini';
import { cn } from '../lib/utils';
import { Screen } from '../types';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  command?: any;
}

interface AIAssistantScreenProps {
  onBack: () => void;
  onNavigate?: (screen: Screen) => void;
  onShowDisease?: (disease: any) => void;
  onShowProcedure?: (procedure: any) => void;
}

export function AIAssistantScreen({ onBack, onNavigate, onShowDisease, onShowProcedure }: AIAssistantScreenProps) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('hermano_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {
        console.error("Error parsing chat history", e);
      }
    }
    return [
      {
        id: '1',
        text: 'Olá! Eu sou o Hermano, o seu assistente virtual da Biblioteca da Saúde de Moçambique. Estou aqui para guiá-lo no uso do nosso sistema nacional de saúde. Posso ajudar você a encontrar informações detalhadas sobre doenças, procedimentos de enfermagem baseados no manual nacional ou dosagens de medicamentos do FNM. Como posso ser útil hoje?',
        sender: 'ai',
        timestamp: new Date(),
      },
    ];
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
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await askAI(input, { currentScreen: 'ai-assistant' });
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'ai',
        timestamp: new Date(),
        command: response.command
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
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Desculpe, o cérebro do sistema encontrou um erro ao processar sua solicitação.',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-surface">
      {/* Header */}
      <header className="px-6 py-4 bg-white border-b border-outline-variant/10 flex items-center gap-4 sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-on-surface" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-headline font-bold text-lg text-on-surface">Assistente IA</h1>
            <p className="text-xs text-primary font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Baseado no Formulário Nacional
            </p>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
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
                    : "bg-white border border-outline-variant/20 text-on-surface rounded-tl-none"
                )}>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap markdown-body">
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </div>
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
              <div className="bg-white border border-outline-variant/20 p-4 rounded-2xl rounded-tl-none shadow-sm">
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
      <div className="p-6 bg-white border-t border-outline-variant/10">
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
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 p-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:grayscale"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          <p className="text-[10px] text-on-surface-variant mt-3 text-center flex items-center justify-center gap-1">
            <Info className="w-3 h-3" /> Respostas baseadas estritamente no Formulário Nacional de Medicamentos (5ª Edição).
          </p>
        </div>
      </div>
    </div>
  );
}
