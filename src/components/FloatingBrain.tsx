import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, X, Send, Sparkles, Command, ArrowRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { askAI, AIResponse } from '../services/gemini';
import { cn } from '../lib/utils';
import { Screen } from '../types';

interface FloatingBrainProps {
  onNavigate: (screen: Screen) => void;
  onSearch: (query: string) => void;
  onShowDisease: (disease: any) => void;
  onShowProcedure: (procedure: any) => void;
  currentScreen: Screen;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  command?: AIResponse['command'];
}

export function FloatingBrain({ onNavigate, onSearch, onShowDisease, onShowProcedure, currentScreen }: FloatingBrainProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('hermano_brain_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      } catch (e) {
        console.error("Error parsing brain history", e);
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
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages]);

  useEffect(() => {
    localStorage.setItem('hermano_brain_history', JSON.stringify(messages));
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    const currentInput = input;
    setInput('');

    try {
      const response = await askAI(currentInput, { currentScreen });
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'ai',
        timestamp: new Date(),
        command: response.command
      };

      setMessages(prev => [...prev, aiMessage]);

      if (response.command) {
        if (response.command.action === 'navigate' && response.command.target) {
          onNavigate(response.command.target as Screen);
        } else if (response.command.action === 'search' && response.command.target) {
          onSearch(response.command.target);
        } else if (response.command.action === 'show_disease' && response.command.params) {
          onShowDisease(response.command.params);
        } else if (response.command.action === 'show_procedure' && response.command.params) {
          onShowProcedure(response.command.params);
        }
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Desculpe, o cérebro do sistema encontrou um erro ao processar sua solicitação.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90vw] max-w-[400px] bg-white rounded-3xl shadow-2xl border border-primary/10 overflow-hidden z-[100]"
          >
            {/* Header */}
            <div className="bg-primary p-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <span className="font-headline font-bold">Cérebro Central</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide">
              {messages.map((message) => (
                <motion.div 
                  key={message.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col gap-1",
                    message.sender === 'user' ? "items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "p-3 rounded-2xl text-sm max-w-[90%]",
                    message.sender === 'user' 
                      ? "bg-secondary text-white rounded-tr-none" 
                      : "bg-surface-container-low border border-outline-variant/20 text-on-surface rounded-tl-none"
                  )}>
                    <div className="flex items-start gap-2">
                      {message.sender === 'ai' && <Bot className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
                      <div className="space-y-2 markdown-body">
                        <div className="leading-relaxed">
                          <ReactMarkdown>{message.text}</ReactMarkdown>
                        </div>
                        {message.command && message.command.action !== 'none' && (
                          <div className="flex items-center gap-2 text-[9px] font-bold text-primary uppercase tracking-wider bg-primary/5 p-1.5 rounded-lg border border-primary/10">
                            <Command className="w-2.5 h-2.5" />
                            Ação: {message.command.action}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] text-on-surface-variant/60 px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex justify-start py-2">
                  <div className="bg-surface-container-low p-3 rounded-2xl rounded-tl-none border border-outline-variant/20">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-outline-variant/10 bg-surface-container-lowest">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Comande o site..."
                  className="w-full bg-white border border-outline-variant/30 rounded-2xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1.5 top-1.5 p-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button (Navbar Style) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex flex-col items-center justify-center gap-1 px-2 sm:px-4 py-2 rounded-2xl transition-all duration-300 relative",
          isOpen ? "text-primary bg-primary-fixed/30" : "text-on-surface-variant hover:text-primary"
        )}
      >
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
          isOpen ? "bg-primary text-white scale-110" : "bg-primary/10 text-primary"
        )}>
          {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
        </div>
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Cérebro</span>
        {!isOpen && (
          <div className="absolute top-1 right-3 w-3 h-3 bg-secondary rounded-full border border-white flex items-center justify-center">
            <Sparkles className="w-2 h-2 text-white" />
          </div>
        )}
      </button>
    </div>
  );
}
