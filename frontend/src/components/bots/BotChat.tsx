import { useEffect, useRef, useState } from 'react';
import { botsService } from '../../services/bots.service';
import type { Bot } from '../../types/bots';

interface BotChatProps {
  bot: Bot;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  tokens?: number;
  error?: boolean;
  isWelcome?: boolean;
}

export function BotChat({ bot }: BotChatProps) {
  const [messages, setMessages] = useState<Message[]>(() =>
    bot.welcomeMsg
      ? [{ role: 'assistant', content: bot.welcomeMsg, isWelcome: true }]
      : [],
  );
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    setMessages(
      bot.welcomeMsg
        ? [{ role: 'assistant', content: bot.welcomeMsg, isWelcome: true }]
        : [],
    );
    setInput('');
  }, [bot.id]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter((m) => !m.isWelcome && !m.error)
        .map((m) => ({ role: m.role, content: m.content }));

      history.push({ role: 'user', content: text });

      const res = await botsService.chat(bot.id, history);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: res.content,
          tokens: res.usage?.totalTokens,
        },
      ]);
    } catch (err: unknown) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : 'Error al obtener respuesta',
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const isDisabled = bot.status !== 'ACTIVE';

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-bot-dot" />
          <span className="chat-bot-name">{bot.name}</span>
          <span className="chat-model-pill">{bot.model}</span>
        </div>
        <button
          className="chat-clear-btn"
          onClick={() =>
            setMessages(
              bot.welcomeMsg
                ? [{ role: 'assistant', content: bot.welcomeMsg, isWelcome: true }]
                : [],
            )
          }
        >
          ↺ Limpiar
        </button>
      </div>

      {/* Mensajes */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p className="chat-empty-icon">◈</p>
            <p>Envía un mensaje para comenzar</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`chat-msg chat-msg--${msg.role}${msg.error ? ' chat-msg--error' : ''}`}
          >
            {msg.role === 'assistant' && <div className="chat-avatar-sm">◈</div>}
            <div className="chat-bubble">
              <pre className="chat-text">{msg.content}</pre>
              {msg.tokens && (
                <span className="chat-tokens">{msg.tokens} tokens</span>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-msg chat-msg--assistant">
            <div className="chat-avatar-sm">◈</div>
            <div className="chat-bubble chat-bubble--typing">
              <span /><span /><span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <textarea
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isDisabled
              ? 'Activa el bot para chatear'
              : 'Escribe un mensaje... (Enter para enviar)'
          }
          rows={1}
          disabled={loading || isDisabled}
        />
        <button
          className="chat-send-btn"
          onClick={send}
          disabled={loading || !input.trim() || isDisabled}
        >
          {loading ? <span className="spinner" /> : '▲'}
        </button>
      </div>

      {isDisabled && (
        <p className="chat-disabled-notice">
          ⚠ Este bot está {bot.status === 'DRAFT' ? 'en borrador' : 'inactivo'}. Actívalo para chatear.
        </p>
      )}
    </div>
  );
}