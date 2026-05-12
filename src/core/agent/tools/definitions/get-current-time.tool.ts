import { ToolDefinition } from "../tool.interface";

export const getCurrentTimeTool: ToolDefinition = {
  name: "get_current_time",
  description: "Lấy thời gian hiện tại",
  parameters: {
    type: "object",
    properties: {},
  },

  async execute() {
    return {
      currentTime: new Date().toLocaleString(),
    };
  },
};