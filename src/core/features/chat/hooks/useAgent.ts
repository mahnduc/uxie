"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { AgentRuntime } from "@/core/agent/runtime/agent-runtime";
import { AgentState } from "@/core/agent/state/agent-state";

export interface ChatMessage {
  role: "user" | "assistant" | "tool" | "system";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: {
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }[];
}

export function useAgent() {
  const runtime = useMemo(() => new AgentRuntime(), []);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [agentState, setAgentState] = useState<AgentState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const events = runtime.events;
    const handleMessagesUpdate = (updatedMessages: ChatMessage[]) => {
      const filtered = updatedMessages.filter((msg) => msg.role !== "tool");
      setMessages(filtered.map((msg) => ({ ...msg })));
    };

    const updateState = (state: AgentState) => () => setAgentState(state);
    const handleError = (msg: string) => {
      setAgentState("error");
      setError(msg || "Unknown error");
    };

    events.on("messages_updated", handleMessagesUpdate);
    events.on("idle", updateState("idle"));
    events.on("thinking", updateState("thinking"));
    events.on("streaming", updateState("streaming"));
    events.on("busy", updateState("busy"));
    events.on("completed", updateState("completed"));
    events.on("tool_execution_start", updateState("busy"));
    events.on("error", handleError);

    return () => {
      events.off("messages_updated", handleMessagesUpdate);
      events.off("idle", updateState("idle"));
      events.off("thinking", updateState("thinking"));
      events.off("streaming", updateState("streaming"));
      events.off("busy", updateState("busy"));
      events.off("completed", updateState("completed"));
      events.off("tool_execution_start", updateState("busy"));
      events.off("error", handleError);
    };
  }, [runtime]);

  const sendMessage = useCallback(async (input: string) => {
    if (!input.trim()) return;
    setError(null);
    try {
      for await (const _ of runtime.runStream(input)) { /* Emitter handles updates */ }
    } catch (err: any) {
      setError(err?.message || "Unknown error");
    }
  }, [runtime]);

  // const reset = useCallback(() => {
  //   setMessages([]);
  //   setAgentState("idle");
  //   setError(null);
  //   runtime.reset?.();
  // }, [runtime]);

  return {
    messages,
    agentState,
    isLoading: ["thinking", "streaming", "busy"].includes(agentState),
    error,
    sendMessage,
    // reset,
  };
}