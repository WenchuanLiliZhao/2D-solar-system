import { useEffect, useRef, useState } from "react";
import type { ChatSession } from "./chatSession";

/**
 * localStorage key for all chat sessions (every body's sessions are stored as
 * one flat array). The `v1` suffix lets us discard old data wholesale when the
 * schema changes — bump to `v2` and the loader will treat stale entries as
 * absent (returning []) without complex migration code.
 */
const STORAGE_KEY = "solar-system/chat-sessions/v1";

/** Minimal runtime guard against corrupted / foreign data. */
function isValidSession(raw: unknown): raw is ChatSession {
  if (!raw || typeof raw !== "object") return false;
  const s = raw as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    typeof s.bodyId === "string" &&
    typeof s.createdAt === "number" &&
    Array.isArray(s.messages)
  );
}

function loadFromStorage(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidSession);
  } catch {
    return [];
  }
}

/**
 * Owns the full chat-session list with localStorage persistence.
 *
 * Single source of truth: PlanetDetail tabs and the full-screen ChatSessionView
 * both read from the same array (filtered by bodyId at the call site). Writes
 * go through this hook's setter so persistence stays consistent.
 *
 * Persistence is best-effort — quota errors, private-mode browsers, etc. are
 * swallowed (in-memory state still works for the session).
 */
export function useChatSessions(): [
  ChatSession[],
  React.Dispatch<React.SetStateAction<ChatSession[]>>
] {
  const [sessions, setSessions] = useState<ChatSession[]>(() =>
    loadFromStorage()
  );

  // Skip the first effect flush — we just hydrated, no need to write back.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // Quota exceeded or storage unavailable; in-memory state is unaffected.
    }
  }, [sessions]);

  return [sessions, setSessions];
}
