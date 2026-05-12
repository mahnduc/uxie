export class ConversationSession {
  private messages: any[] = [];

  addMessage(message: any) {
    this.messages.push(message);
  }

  getMessages() {
    return this.messages;
  }
}