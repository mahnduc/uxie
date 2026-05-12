export type Role =
  | "system"
  | "user"
  | "assistant"
  | "tool";

export interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatMessage {
  role: Role;
  content: string | null;
  tool_call_id?: string;
  tool_calls?: {
    id: string;
    type: "function";
    function: {
      name: string;
      arguments: string;
    };
  }[];
}

export interface GroqChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  tools?: unknown[];
  tool_choice?: "auto" | "none";
  stream?: boolean;
}

export interface GroqChatResponse {
  choices: {
    message: ChatMessage;
    finish_reason?: string;
  }[];
}

export interface GroqStreamDelta {
  id: string;
  choices: {
    delta: {
      content?: string;
      tool_calls?: any[];
    };
    finish_reason: string | null;
  }[];
}