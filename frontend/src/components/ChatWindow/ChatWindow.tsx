import React, { useEffect, useRef, useState, KeyboardEvent } from "react";
import { Match, Message } from "../../types";

interface ChatWindowProps {
  match: Match | null;
  messages: Message[];
  onSendMessage: (content: string) => void;
  isTyping: boolean;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
}

const formatTime = (date: Date): string =>
  date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

const ChatWindow: React.FC<ChatWindowProps> = ({
  match,
  messages,
  onSendMessage,
  isTyping,
  connectionStatus,
}) => {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || !match) return;
    onSendMessage(trimmed);
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!match) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p
          className="text-sm italic text-[var(--color-text-muted)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          select a match to start chatting
        </p>
      </div>
    );
  }

  const statusColor =
    connectionStatus === "connected"
      ? "bg-green-400"
      : connectionStatus === "connecting"
      ? "bg-[var(--color-accent-orange)] animate-pulse"
      : "bg-[var(--color-border-strong)]";

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 border-b border-[var(--color-border)] shrink-0 flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <h2
            className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] m-0"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {match.username}
          </h2>
          <div className="flex gap-2 flex-wrap">
            {match.interests.map((interest) => (
              <span
                key={interest}
                className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-tag-bg)] border border-[var(--color-tag-border)] rounded-full px-3 py-0.5"
                style={{ fontFamily: "var(--font-body)" }}
              >
                {interest}
              </span>
            ))}
          </div>
          <span
            className="text-[0.8rem] text-[var(--color-text-muted)]"
            style={{ fontFamily: "var(--font-body)" }}
          >
            {match.matchPercentage}% match
          </span>
        </div>
        <div
          className={`w-2 h-2 rounded-full mt-2 ${statusColor}`}
          title={connectionStatus}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 py-6 flex flex-col gap-3 scroll-smooth">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[60%] px-4 pt-3 pb-2 rounded-2xl flex flex-col gap-1.5 animate-[fadeUp_0.2s_ease] ${
                msg.isOwn
                  ? "bg-[var(--color-bubble-own)] rounded-br-sm"
                  : "bg-[var(--color-bubble-other)] rounded-bl-sm"
              }`}
            >
              <p
                className={`text-sm m-0 leading-relaxed break-words whitespace-pre-wrap ${
                  msg.isOwn ? "text-white" : "text-[var(--color-text-primary)]"
                }`}
                style={{ fontFamily: "var(--font-body)" }}
              >
                {msg.content}
              </p>
              <span
                className={`text-[0.65rem] self-end ${
                  msg.isOwn ? "text-white/60" : "text-[var(--color-text-muted)]"
                }`}
                style={{ fontFamily: "var(--font-body)" }}
              >
                {formatTime(msg.timestamp)}
              </span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-[var(--color-bubble-other)] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
              {[0, 200, 400].map((delay) => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 px-6 pt-4 pb-5 border-t border-[var(--color-border)] shrink-0">
        <textarea
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="say something real..."
          rows={1}
          className="flex-1 text-sm italic text-[var(--color-text-primary)] bg-[var(--color-input-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 resize-none outline-none leading-relaxed max-h-28 overflow-y-auto transition-colors duration-150 placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent-red-subtle)]"
          style={{ fontFamily: "var(--font-body)" }}
        />
        <button
          onClick={handleSend}
          disabled={!inputValue.trim()}
          aria-label="Send message"
          className={`w-[42px] h-[42px] rounded-xl border-none text-lg flex items-center justify-center shrink-0 transition-all duration-150 ${
            inputValue.trim()
              ? "bg-[var(--color-accent-red)] text-white cursor-pointer hover:bg-[var(--color-accent-red-dark)]"
              : "bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed"
          }`}
        >
          →
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;