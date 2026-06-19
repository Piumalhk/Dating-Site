"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface MessageInputProps {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;

    setSending(true);
    try {
      await onSend(trimmed);
      setText("");
      // Reset textarea height after clear
      if (textareaRef.current) {
        textareaRef.current.style.height = "44px";
      }
    } catch (err) {
      console.error("Failed to send:", err);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a newline
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-grow textarea up to ~5 lines
  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "44px";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const canSend = text.trim().length > 0 && !sending && !disabled;

  return (
    <div className="flex items-end gap-3 px-4 py-3 border-t border-gray-100 bg-white shrink-0">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="Type a message…"
        rows={1}
        disabled={disabled || sending}
        className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent overflow-y-auto transition disabled:opacity-50"
        style={{ minHeight: "44px", maxHeight: "120px" }}
      />

      <button
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Send message"
        className="flex items-center justify-center w-11 h-11 rounded-full bg-linear-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
      >
        <Send size={18} />
      </button>
    </div>
  );
}
