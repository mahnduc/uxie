import { keyService } from "@/app/dashboard/settings/api-key/_services/key.service";

import {
  callGroqApiStream,
} from "./groq/groq.config";

import { LLMProvider } from "./provider.interface";

export class GroqProvider implements LLMProvider {

  async *chatStream(input: any) {
    const apiKey = await keyService.getRandomKey("groq");

    yield* callGroqApiStream(
      {
        model: "llama-3.3-70b-versatile",
        messages: input.messages,
        tools: input.tools,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 2048,
      },
      apiKey
    );
  }
}