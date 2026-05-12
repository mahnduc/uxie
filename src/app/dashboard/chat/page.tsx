"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bot, User, SendHorizonal, Wrench } from "lucide-react";
import { useAgent } from "@/core/features/chat/hooks/useAgent";

// --- Sub-components ---

const EmptyState = () => (
  <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center">
    <div className="w-24 h-24 rounded-[30px] bg-[#FFF0F7] flex items-center justify-center mb-6">
      <Bot size={44} className="text-[#FF3399]" strokeWidth={2.3} />
    </div>
    <h2 className="text-3xl font-black text-[#2D3436]">StudyMind AI</h2>
    <p className="mt-4 max-w-md text-sm leading-7 text-[#636E72]">
      Hỏi bài tập, lập trình, tài liệu học tập hoặc trò chuyện cùng AI.
    </p>
  </div>
);

const MessageBubble = ({ msg, isStreaming, isLast }: { msg: any; isStreaming: boolean; isLast: boolean }) => {
  const isUser = msg.role === "user";
  
  return (
    <div className={`flex items-end gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-10 h-10 shrink-0 rounded-2xl bg-[#FF3399] flex items-center justify-center shadow-[0_4px_0_#D12A7E]">
          <Bot size={18} className="text-white" strokeWidth={2.5} />
        </div>
      )}

      <div className={`max-w-[90%] md:max-w-[75%] px-5 py-4 rounded-3xl text-[15px] leading-7 whitespace-pre-wrap break-words shadow-sm ${
        isUser ? "bg-[#FF3399] text-white rounded-br-md" : "bg-white border border-[#F0F0F0] text-[#2D3436] rounded-bl-md"
      }`}>
        {msg.content}
        {isLast && isStreaming && (
          <span className="inline-flex ml-2">
            <span className="w-2 h-2 rounded-full bg-[#FF3399] animate-pulse mt-1" />
          </span>
        )}
      </div>

      {isUser && (
        <div className="w-10 h-10 shrink-0 rounded-2xl bg-[#2D3436] flex items-center justify-center shadow-[0_4px_0_#1E272E]">
          <User size={18} className="text-white" strokeWidth={2.5} />
        </div>
      )}
    </div>
  );
};

const LoadingStatus = ({ state }: { state: string }) => (
  <div className="flex items-end gap-3">
    <div className="w-10 h-10 shrink-0 rounded-2xl bg-[#FF3399] flex items-center justify-center shadow-[0_4px_0_#D12A7E]">
      {state === "busy" ? <Wrench size={18} className="text-white" strokeWidth={2.5} /> : <Bot size={18} className="text-white" strokeWidth={2.5} />}
    </div>
    <div className="bg-white border border-[#F0F0F0] px-5 py-4 rounded-3xl rounded-bl-md shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {[0, 150, 300].map((delay) => (
            <div key={delay} className="w-2 h-2 rounded-full bg-[#B2BEC3] animate-bounce" style={{ animationDelay: `${delay}ms` }} />
          ))}
        </div>
        <span className="text-xs font-bold text-[#636E72]">
          {state === "thinking" ? "Đang suy nghĩ..." : "Đang thực thi công cụ..."}
        </span>
      </div>
    </div>
  </div>
);

// --- Main Component ---

export default function ChatInterface() {
  const { messages, agentState, isLoading, error, sendMessage } = useAgent();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, agentState]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const value = input;
    setInput("");
    await sendMessage(value);
  };

  const visibleMessages = messages.filter(
    (msg) =>
      msg.role !== "tool" &&
      msg.role !== "system" &&
      !(msg.role === "assistant" && !msg.content?.trim())
  );

  return (
    <div className="flex flex-col h-full bg-[#F7F9FB] overflow-hidden">
      <main ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-6 scroll-smooth">
        <div className="max-w-5xl mx-auto space-y-6">
          {visibleMessages.length === 0 ? <EmptyState /> : (
            visibleMessages.map((msg, idx) => (
              <MessageBubble 
                key={idx} 
                msg={msg} 
                isStreaming={agentState === "streaming"} 
                isLast={idx === visibleMessages.length - 1} 
              />
            ))
          )}

          {(agentState === "thinking" || agentState === "busy") && <LoadingStatus state={agentState} />}

          {error && (
            <div className="mx-auto max-w-md bg-red-50 border border-red-200 text-red-500 text-sm rounded-2xl px-5 py-4">
              {error}
            </div>
          )}
        </div>
      </main>

      <footer className="shrink-0 border-t border-[#F0F0F0] bg-white px-4 md:px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSend} className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isLoading ? "Vui lòng đợi phản hồi..." : "Nhập tin nhắn..."}
                disabled={isLoading}
                className="w-full bg-[#F7F9FB] border border-[#E5E5E5] rounded-3xl px-5 py-4 pr-14 text-[15px] text-[#2D3436] outline-none transition-all placeholder:text-[#B2BEC3] focus:border-[#FF3399] focus:ring-4 focus:ring-[#FF3399]/10 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-[#FF3399] text-white flex items-center justify-center shadow-[0_4px_0_#D12A7E] active:shadow-none active:translate-y-[-40%] transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                <SendHorizonal size={18} strokeWidth={2.8} />
              </button>
            </div>
          </form>
        </div>
      </footer>
    </div>
  );
}