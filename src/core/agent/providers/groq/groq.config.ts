// agent/providers/groq/groq.config.ts

import { ChatMessage, GroqChatRequest, GroqChatResponse } from "./groq.types";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface CallGroqApiParams {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  tools?: unknown[];
  tool_choice?: "auto" | "none";
}

export async function callGroqApi(
  params: CallGroqApiParams,
  apiKey: string
): Promise<GroqChatResponse> {
  if (!apiKey) {
    throw new Error("Thiếu Groq API Key");
  }

  const payload: GroqChatRequest = {
    model: params.model,
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.max_tokens ?? 2048,
    tools: params.tools,
    tool_choice: params.tool_choice ?? "auto",
  };

  const response = await fetch(
    GROQ_API_URL,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    }
  );

  /**
   * Parse error body
   */
  if (!response.ok) {
    let errorMessage = "Groq API request failed";

    try {
      const errorData = await response.json();
      errorMessage = errorData?.error?.message || errorMessage;
    } catch {
      //
    }
    throw new Error(errorMessage);
  }

  const data: GroqChatResponse = await response.json();

  return data;
}

export async function* callGroqApiStream(
  params: CallGroqApiParams,
  apiKey: string
): AsyncGenerator<any> {
  if (!apiKey) {
    throw new Error("Thiếu Groq API Key");
  }

  const payload: GroqChatRequest = {
    model: params.model,
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.max_tokens ?? 2048,
    tools: params.tools,
    tool_choice: params.tool_choice ?? "auto",
    stream: true,
  };
  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorMessage = "Groq stream failed";

    try {
      const err = await response.json();
      errorMessage = err?.error?.message || errorMessage;
    } catch {}

    throw new Error(errorMessage);
  }

  if (!response.body) {
    throw new Error("No response body");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");

    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed.startsWith("data:")) {
        continue;
      }
      const data = trimmed.replace("data:", "").trim();

      if (data === "[DONE]") {
        return;
      }

      try {
        const json = JSON.parse(data);

        const delta = json.choices?.[0]?.delta;

        if (!delta) continue;

        // text content
        if (delta.content) {
          yield {
            type: "content",
            content: delta.content,
          };
        }
        // tool calls
        if (delta.tool_calls) {
          yield {
            type: "tool_calls",
            tool_calls: delta.tool_calls,
          };
        }

      } catch (error) {
        console.error(error);
      }
    }
  }
}