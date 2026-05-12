// runtime/reasoning-loop.ts

interface Params {
  session: any;
  provider: any;
  tools: any;
  events: any;
  maxIterations: number;
}

export async function* reasoningLoopStream({
  session,
  provider,
  tools,
  events,
  maxIterations,
}: Params) {
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let assistantMessage: any = null;
    let finalText = "";
    const toolCallsMap = new Map<number, any>();

    events.emit("streaming");

    const stream = provider.chatStream({
      messages: session.getMessages(),
      tools: tools.getDefinitions(),
    });

    for await (const chunk of stream) {
      if (chunk.type === "content") {
        if (!assistantMessage) {
          assistantMessage = { role: "assistant", content: "" };
          session.addMessage(assistantMessage);
        }
        finalText += chunk.content;
        assistantMessage.content = finalText;
        events.emit("messages_updated", session.getMessages());
        yield { type: "token", content: chunk.content };
      }

      if (chunk.type === "tool_calls") {
        if (!assistantMessage) {
          assistantMessage = { role: "assistant", content: null, tool_calls: [] };
          session.addMessage(assistantMessage);
        }

        for (const toolCall of chunk.tool_calls) {
          const { index, id, function: fn } = toolCall;
          if (!toolCallsMap.has(index)) {
            toolCallsMap.set(index, {
              id,
              type: "function",
              function: { name: fn?.name || "", arguments: fn?.arguments || "" },
            });
          } else {
            const existing = toolCallsMap.get(index);
            existing.function.arguments += fn?.arguments || "";
            if (fn?.name) existing.function.name = fn.name;
          }
        }
      }
    }

    const toolCalls = Array.from(toolCallsMap.values());
    if (assistantMessage) {
      if (toolCalls.length > 0) assistantMessage.tool_calls = toolCalls;
      if (finalText) assistantMessage.content = finalText;
    }

    events.emit("messages_updated", session.getMessages());

    if (toolCalls.length === 0) {
      events.emit("response", finalText);
      events.emit("completed");
      yield { type: "done", content: finalText };
      return;
    }

    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      const tool = tools.get(toolName);

      if (!tool) {
        session.addMessage({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({ error: `Tool '${toolName}' not found` }),
        });
        continue;
      }

      try {
        events.emit("tool_execution_start", toolName);
        let args = {};
        try {
          args = JSON.parse(toolCall.function.arguments || "{}");
        } catch {
          args = {};
        }

        const result = await tool.execute(args);
        session.addMessage({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });

        events.emit("tool_execution_end", { tool: toolName, result });
        events.emit("messages_updated", session.getMessages());
        yield { type: "tool_result", tool: toolName, result };
      } catch (error: any) {
        const errorResult = { error: error?.message || "Tool execution failed" };
        session.addMessage({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(errorResult),
        });
        events.emit("tool_execution_error", { tool: toolName, error: errorResult });
        events.emit("messages_updated", session.getMessages());
      }
    }
  }

  throw new Error("Max reasoning iterations reached");
}