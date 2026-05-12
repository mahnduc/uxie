import { ToolDefinition } from "../tool.interface";
export const internalDocsSearchTool: ToolDefinition = {
  name: "internal_docs_search",
  description: `Tra cứu tài liệu nội bộ của hệ thống.
Sử dụng tool này khi người dùng hỏi:
- kiến trúc hệ thống
- workflow
- tài liệu nội bộ
- hướng dẫn
- cấu trúc project
- agent runtime
- tool calling
- state machine`,
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Nội dung cần tìm trong tài liệu nội bộ",
      },
    },
    required: ["query"],
  },
  async execute(input: { query: string }) {
    const docs = [
      {
        id: "runtime-001",
        title: "Agent Runtime",
        content: `Agent Runtime gồm:
- Provider Router
- Tool Registry
- Reasoning Loop
- Conversation Session
- Event Emitter`,
      },
      {
        id: "workflow-001",
        title: "Workflow Engine",
        content: `Workflow hỗ trợ:
- pause
- resume
- waiting_human
- approval
- human input`,
      },
      {
        id: "tool-001",
        title: "Tool Calling",
        content: `Tool calling flow:
1. Model yêu cầu tool
2. Runtime execute tool
3. Tool result đưa lại cho model
4. Model sinh response cuối`,
      },
    ];
    const keyword = input.query.toLowerCase();
    const results = docs.filter((doc) =>
      doc.title.toLowerCase().includes(keyword) ||
      doc.content.toLowerCase().includes(keyword)
    );
    return {
      success: true,
      query: input.query,
      total: results.length,
      results,
    };
  },
};