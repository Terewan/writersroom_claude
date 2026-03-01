import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore, type StreamingMessage } from "../chat-store";

const makeMessage = (overrides: Partial<StreamingMessage> = {}): StreamingMessage => ({
  id: "msg-1",
  agentId: "agent-1",
  agentName: "Test Agent",
  agentColor: "#6366f1",
  role: "agent",
  content: "Hello from agent",
  roundNumber: 1,
  turnOrder: 1,
  isStreaming: true,
  ...overrides,
});

describe("useChatStore", () => {
  beforeEach(() => {
    useChatStore.setState({
      messages: [],
      isSessionActive: false,
      currentRound: 0,
      currentAgentName: null,
    });
  });

  it("adds a message", () => {
    useChatStore.getState().addMessage(makeMessage());
    expect(useChatStore.getState().messages).toHaveLength(1);
    expect(useChatStore.getState().messages[0].content).toBe("Hello from agent");
  });

  it("updates message content during streaming", () => {
    useChatStore.getState().addMessage(makeMessage());
    useChatStore.getState().updateMessageContent("msg-1", "Hello from agent — updated");
    expect(useChatStore.getState().messages[0].content).toBe(
      "Hello from agent — updated",
    );
  });

  it("finalizes a message", () => {
    useChatStore.getState().addMessage(makeMessage());
    expect(useChatStore.getState().messages[0].isStreaming).toBe(true);

    useChatStore.getState().finalizeMessage("msg-1");
    expect(useChatStore.getState().messages[0].isStreaming).toBe(false);
  });

  it("clears all messages", () => {
    useChatStore.getState().addMessage(makeMessage());
    useChatStore.getState().addMessage(makeMessage({ id: "msg-2" }));
    expect(useChatStore.getState().messages).toHaveLength(2);

    useChatStore.getState().clearMessages();
    expect(useChatStore.getState().messages).toHaveLength(0);
  });

  it("manages session state", () => {
    useChatStore.getState().setSessionActive(true);
    expect(useChatStore.getState().isSessionActive).toBe(true);

    useChatStore.getState().setCurrentRound(3);
    expect(useChatStore.getState().currentRound).toBe(3);

    useChatStore.getState().setCurrentAgentName("Writer A");
    expect(useChatStore.getState().currentAgentName).toBe("Writer A");
  });
});
