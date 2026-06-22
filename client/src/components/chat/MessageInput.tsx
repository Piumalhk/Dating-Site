"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { Send, Smile } from "lucide-react";
import toast from "react-hot-toast";

interface MessageInputProps {
  onSend: (text: string) => Promise<void>;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text,    setText]    = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || disabled) return;
    setSending(true);
    try {
      await onSend(trimmed);
      setText("");
      if (textareaRef.current) textareaRef.current.style.height = "44px";
    } catch {
      toast.error("💬 Message failed to send");
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "44px";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const canSend = text.trim().length > 0 && !sending && !disabled;

  return (
    <div className="flex items-end gap-2 px-4 py-3 border-t border-gray-100 bg-white shrink-0">
      {/* Emoji placeholder */}
      <button
        type="button"
        aria-label="Emoji"
        className="p-2.5 rounded-xl text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition shrink-0 self-end"
      >
        <Smile size={20} />
      </button>

      {/* Text area */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="Type a message…"
        rows={1}
        disabled={disabled || sending}
        className="flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent overflow-y-auto transition disabled:opacity-50 placeholder:text-gray-400"
        style={{ minHeight: "44px", maxHeight: "120px" }}
      />

      {/* Send button */}
      <button
        onClick={handleSend}
        disabled={!canSend}
        aria-label="Send message"
        className={`flex items-center justify-center w-11 h-11 rounded-full transition-all active:scale-95 shrink-0 self-end
          ${canSend
            ? "bg-linear-to-br from-pink-500 to-purple-600 text-white shadow-md shadow-pink-200/50 hover:opacity-90"
            : "bg-gray-100 text-gray-300 cursor-not-allowed"
          }`}
      >
        <Send size={17} className={canSend ? "" : "opacity-50"} />
      </button>
    </div>
  );
}
