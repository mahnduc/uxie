// agent/runtime/agent-runtime.ts

import { ProviderRouter } from "../providers/provider-router";
import { ToolRegistry } from "../tools/tool-registry";
import { reasoningLoopStream } from "./reasoning-loop";
import { ConversationSession } from "./conversation-session";
import { RuntimeEventEmitter } from "./event-emitter";
import { AgentState } from "../state/agent-state";

export class AgentRuntime {
  private readonly DEFAULT_MAX_ITERATIONS = 10;
  private readonly SYSTEM_PROMPT = `
Bạn là AI Agent có tên là Dứa, vận hành trong một runtime có tool calling.

QUY TẮC BẮT BUỘC:

1. KHÔNG ĐƯỢC ẢO TƯỞNG NĂNG LỰC
- Không nói rằng đã làm điều gì nếu chưa thực sự thực hiện.
- Không nói đã đọc file, truy cập internet, gọi API, chạy code, truy cập database nếu chưa dùng tool tương ứng.
- Không giả vờ kết quả từ tool.
- Không tự tạo dữ liệu giả như logs, ids, responses, file contents.

2. TOOL-FIRST
- Nếu cần dữ liệu bên ngoài -> phải dùng tool.
- Nếu không có tool phù hợp -> nói rõ giới hạn.
- Không suy đoán kết quả tool.

3. MINH BẠCH TRẠNG THÁI
- Nếu đang suy luận -> chỉ nói đang suy luận.
- Nếu thiếu thông tin -> yêu cầu thêm dữ liệu.
- Nếu thất bại -> giải thích lỗi thật.

4. KHÔNG BỊA ĐẶT
- Không tự tạo facts.
- Không tự khẳng định code đã chạy thành công.
- Không tự nói "đã lưu", "đã gửi", "đã deploy", "đã truy cập" nếu chưa có bằng chứng thực thi.

5. ƯU TIÊN HÀNH ĐỘNG THẬT
- Chỉ mô tả những gì thực sự có thể làm trong runtime hiện tại.
- Phân biệt rõ:
  - điều đã làm
  - điều dự định làm
  - điều không thể làm

6. RESPONSE STYLE
- Ngắn gọn
- Chính xác
- Không roleplay
- Không giả lập hệ thống
- Không tạo fake terminal output
`;

  private providerRouter = new ProviderRouter();
  private tools = new ToolRegistry();
  public events = new RuntimeEventEmitter();
  private session = new ConversationSession();
  private _state: AgentState = "idle";

  constructor() {
    /**
     * Inject system prompt ngay từ đầu session
     */
    this.session.addMessage({
      role: "system",
      content: this.SYSTEM_PROMPT,
    });

    this.events.onStateChange((state: AgentState) => {
      this._state = state;
    });
  }

  get state() {
    return this._state;
  }

  async *runStream(
    userInput: string,
    options?: { maxIterations?: number }
  ) {
    const maxIterations =
      options?.maxIterations ??
      this.DEFAULT_MAX_ITERATIONS;

    try {
      this.session.addMessage({
        role: "user",
        content: userInput,
      });

      yield* this.handleReasoningFlowStream(
        maxIterations
      );

    } catch (error: any) {
      this.events.emitError(
        error.message || "Unknown error"
      );

      throw error;
    }
  }

  private async *handleReasoningFlowStream(
    maxIterations: number
  ) {
    this.events.emitThinking();

    const provider =
      this.providerRouter.getProvider();

    try {
      yield* reasoningLoopStream({
        session: this.session,
        provider,
        tools: this.tools,
        events: this.events,
        maxIterations,
      });

      this.events.emitCompleted();
      this.events.emitIdle();

    } catch (error: any) {
      this.events.emitError(
        error.message || "Reasoning flow failed"
      );

      throw error;
    }
  }
}