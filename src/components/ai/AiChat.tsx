"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Copy, Check, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import styles from './AiChat.module.css';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

const QUICK_ACTIONS = [
  "Gerar mensagem de follow-up",
  "Analisar meu pipeline atual",
  "Sugerir abordagem para lead frio",
  "Resumir minhas métricas"
];

// Simple markdown formatter
function formatMarkdown(text: string) {
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  return `<p>${html}</p>`;
}

export function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const pathname = usePathname();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'model',
        content: 'Olá! Sou o CRM AI da Invest Dream. Posso ajudar você a gerar mensagens persuasivas para seus leads, analisar seu pipeline ou resumir suas métricas. Como posso ajudar agora?'
      }]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
          pathname
        }),
      });

      if (!response.ok) throw new Error('Falha na comunicação com a IA');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';
      const aiMessageId = (Date.now() + 1).toString();

      setMessages(prev => [...prev, { id: aiMessageId, role: 'model', content: '' }]);
      setIsTyping(false);

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          aiContent += decoder.decode(value, { stream: true });
          
          setMessages(prev => prev.map(m => 
            m.id === aiMessageId ? { ...m, content: aiContent } : m
          ));
        }
      }
    } catch (error) {
      console.error(error);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: 'Desculpe, ocorreu um erro ao me comunicar com o servidor.'
      }]);
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSend(input);
    }
  };

  return (
    <div className={styles.chatContainer}>
      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <div className={styles.headerTitle}>
              <div className={styles.avatar}>
                <Sparkles size={20} />
                <div className={styles.statusDot} />
              </div>
              <div>
                <div style={{ lineHeight: 1.2 }}>Invest Dream AI</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>
                  Gemini 2.5 Flash-Lite
                </div>
              </div>
            </div>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <div className={styles.messages}>
            {messages.map(m => (
              <div key={m.id} className={`${styles.message} ${styles[m.role]}`}>
                {m.role === 'model' && (
                  <button 
                    className={styles.copyBtn} 
                    onClick={() => copyToClipboard(m.id, m.content)}
                    title="Copiar mensagem"
                  >
                    {copiedId === m.id ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                  </button>
                )}
                <div 
                  className={styles.messageContent}
                  dangerouslySetInnerHTML={{ __html: formatMarkdown(m.content) }}
                />
              </div>
            ))}
            {isTyping && (
              <div className={styles.typingIndicator}>
                <span></span><span></span><span></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <DragScrollQuickActions onActionSelect={setInput} />

          <div className={styles.inputArea}>
            <textarea
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem... (Ctrl+Enter para enviar)"
              rows={2}
            />
            <button 
              className={styles.sendBtn} 
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isTyping}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {!isOpen && (
        <button 
          data-chat-trigger="true"
          className={`${styles.fab} ${isOpen ? styles.isOpen : ''} desktop-only`}
          onClick={() => setIsOpen(true)}
          title="Abrir Assistente AI"
        >
          <Bot size={28} />
        </button>
      )}
    </div>
  );
}

/* ── Drag-to-scroll Quick Actions ── */
function DragScrollQuickActions({ onActionSelect }: { onActionSelect: (action: string) => void }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isDragging = React.useRef(false);
  const startX = React.useRef(0);
  const scrollLeft = React.useRef(0);
  const dragMoved = React.useRef(false);

  function onMouseDown(e: React.MouseEvent) {
    if (!ref.current) return;
    isDragging.current = true;
    dragMoved.current = false;
    startX.current = e.pageX - ref.current.offsetLeft;
    scrollLeft.current = ref.current.scrollLeft;
    ref.current.style.cursor = 'grabbing';
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!isDragging.current || !ref.current) return;
    e.preventDefault();
    const x = e.pageX - ref.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    if (Math.abs(walk) > 4) dragMoved.current = true;
    ref.current.scrollLeft = scrollLeft.current - walk;
  }

  function onMouseUp() {
    isDragging.current = false;
    if (ref.current) ref.current.style.cursor = 'grab';
  }

  function onMouseLeave() {
    isDragging.current = false;
    if (ref.current) ref.current.style.cursor = 'grab';
  }

  return (
    <div
      ref={ref}
      className={styles.quickActions}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseLeave}
      style={{ cursor: 'grab' }}
    >
      {QUICK_ACTIONS.map((action, i) => (
        <button 
          key={i} 
          className={styles.chip}
          onClick={() => {
            if (dragMoved.current) return;
            onActionSelect(action);
          }}
        >
          {action}
        </button>
      ))}
    </div>
  );
}

