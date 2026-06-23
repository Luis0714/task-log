"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { ConversationMessage } from "@/lib/schemas/conversation";
import {
  CONVERSATION_STORAGE_KEY,
  CONVERSATION_STORAGE_LIMIT,
} from "@/lib/copilot/conversation.constants";

type ConversationState = {
  messages: ConversationMessage[];
  _push: (msg: ConversationMessage) => void;
  _replace: (id: string, next: ConversationMessage) => void;
  _remove: (id: string) => void;
  clear: () => void;
};

export const useConversationStore = create<ConversationState>()(
  persist(
    (set) => ({
      messages: [],

      _push: (msg) =>
        set((s) => ({ messages: [...s.messages, msg] })),

      _replace: (id, next) =>
        set((s) => ({
          messages: s.messages.map((m) => (m.id === id ? next : m)),
        })),

      _remove: (id) =>
        set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),

      clear: () => set({ messages: [] }),
    }),
    {
      name: CONVERSATION_STORAGE_KEY,
      // `thinking` messages represent in-progress operations that are
      // meaningless after a page reload — strip them before serializing.
      partialize: (state) => ({
        messages: state.messages
          .filter((m) => m.role !== "thinking")
          .slice(-CONVERSATION_STORAGE_LIMIT),
      }),
      // Prevent auto-hydration on mount to avoid SSR/client mismatch.
      // The hook calls rehydrate() inside useEffect instead.
      skipHydration: true,
    },
  ),
);
