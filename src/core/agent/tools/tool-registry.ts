// agent/tools/tool-registry.ts

import { getCurrentTimeTool } from "./definitions/get-current-time.tool";
import { internalDocsSearchTool } from "./definitions/internal-docs-search.tool";


export class ToolRegistry {
  private tools = new Map([
    [getCurrentTimeTool.name, getCurrentTimeTool],
    [internalDocsSearchTool.name, internalDocsSearchTool],
  ]);

  get(name: string) {
    return this.tools.get(name);
  }

  async execute(name: string, args: any) {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new Error(`Tool "${name}" not found`);
    }

    return tool.execute(args);
  }

  getDefinitions() {
    return Array.from(this.tools.values()).map((tool) => ({
      type: "function",

      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }
}