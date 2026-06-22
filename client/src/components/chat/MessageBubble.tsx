"use client";

import { format } from "date-fns";
import type { MessageDocument } from "@/types/chat";

interface MessageBubbleProps {
  message: MessageDocument;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const time = message.createdAt?.toDate
    ? format(message.createdAt.toDate(), "h:mm a")
    : "";

  if (isOwn) {
    return (
      <div className="flex justify-end mb-2 group">
        <div className="max-w-[72%] sm:max-w-[60%]">
          <div className="bg-linear-to-br from-pink-500 to-purple-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-sm shadow-pink-200/50">
            <p className="text-sm leading-relaxed wrap-break-word">{message.text}</p>
          </div>
          <div className="flex items-center justify-end gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-[10px] text-gray-400">{time}</span>
            <span
              className={`text-[11px] font-medium ${message.read ? "text-purple-500" : "text-gray-300"}`}
              title={message.read ? "Read" : "Sent"}
            >
              {message.read ? "✓✓" : "✓"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start mb-2 group">
      <div className="max-w-[72%] sm:max-w-[60%]">
        <div className="bg-white text-gray-800 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm border border-gray-100">
          <p className="text-sm leading-relaxed wrap-break-word">{message.text}</p>
        </div>
        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <span className="text-[10px] text-gray-400">{time}</span>
        </div>
      </div>
    </div>
  );
}
