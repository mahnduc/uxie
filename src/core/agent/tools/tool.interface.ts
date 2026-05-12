export interface ToolDefinition {
  name: string;
  description: string;

  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };

  execute(input: any): Promise<any>;
}