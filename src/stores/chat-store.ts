import { create } from "zustand";

export interface StreamingMessage {
  id: string;
  agentId: string | null;
  agentName: string;
  agentColor: string;
  role: "agent" | "showrunner" | "system";
  content: string;
  roundNumber: number;
  turnOrder: number;
  isStreaming: boolean;
}

interface ChatState {
  messages: StreamingMessage[];
  isSessionActive: boolean;
  currentRound: number;
  currentAgentName: string | null;

  addMessage: (message: StreamingMessage) => void;
  updateMessageContent: (id: string, content: string) => void;
  finalizeMessage: (id: string) => void;
  clearMessages: () => void;

  setSessionActive: (active: boolean) => void;
  setCurrentRound: (round: number) => void;
  setCurrentAgentName: (name: string | null) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  isSessionActive: false,
  currentRound: 0,
  currentAgentName: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateMessageContent: (id, content) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, content } : m,
      ),
    })),

  finalizeMessage: (id) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, isStreaming: false } : m,
      ),
    })),

  clearMessages: () => set({ messages: [] }),

  setSessionActive: (active) => set({ isSessionActive: active }),
  setCurrentRound: (round) => set({ currentRound: round }),
  setCurrentAgentName: (name) => set({ currentAgentName: name }),
}));
