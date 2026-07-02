'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

type Message = { role: 'user' | 'assistant'; content: string };

export function ChatWidget() {
  const t = useTranslations('ChatWidget');
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: t('greeting') },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const scrollBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollBottom();
  }, [messages, scrollBottom]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { role: 'user', content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput('');
    setStreaming(true);

    const placeholderIdx = history.length;
    setMessages((m) => [...m, { role: 'assistant', content: '' }]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) throw new Error('Request failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const snap = accumulated;
        setMessages((m) => {
          const updated = [...m];
          updated[placeholderIdx] = { role: 'assistant', content: snap };
          return updated;
        });
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setMessages((m) => {
          const updated = [...m];
          updated[placeholderIdx] = {
            role: 'assistant',
            content: t('errorMessage'),
          };
          return updated;
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? t('closeChat') : t('chatWithUs')}
        className="fixed bottom-20 right-6 z-50 flex h-14 w-14 items-center justify-center border border-bmw bg-graphite-900 text-bmw shadow-lg transition-all hover:bg-bmw hover:text-white md:bottom-6"
        style={{ borderRadius: 0 }}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-[9.5rem] right-6 z-50 flex w-[min(380px,calc(100vw-2rem))] flex-col border border-white/10 bg-graphite-900 shadow-2xl md:bottom-24"
          style={{ height: 'min(520px, calc(100vh - 120px))' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-bmw" />
              <span className="font-mono text-xs uppercase tracking-wider text-ink">
                {t('assistantLabel')}
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-faint transition-colors hover:text-ink"
              aria-label={t('close')}
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-bmw text-white'
                      : 'border border-white/10 bg-graphite-800 text-ink'
                  }`}
                >
                  {m.content || (
                    <span className="flex gap-1 py-1">
                      <span className="animate-bounce [animation-delay:0ms]">·</span>
                      <span className="animate-bounce [animation-delay:150ms]">·</span>
                      <span className="animate-bounce [animation-delay:300ms]">·</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-3 flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t('placeholder')}
              rows={1}
              disabled={streaming}
              className="flex-1 resize-none border border-white/10 bg-graphite-800 px-3 py-2 text-sm text-ink placeholder:text-faint outline-none focus:border-bmw disabled:opacity-50 transition-colors"
              style={{ maxHeight: '96px', overflowY: 'auto' }}
            />
            <button
              onClick={send}
              disabled={!input.trim() || streaming}
              aria-label={t('send')}
              className="flex h-9 w-9 shrink-0 items-center justify-center border border-bmw text-bmw transition-colors hover:bg-bmw hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
