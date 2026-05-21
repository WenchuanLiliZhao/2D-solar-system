import type { BodyId } from "./planets";

/**
 * A single message in a chat session.
 * Assistant rows are placeholders until AI is wired in.
 */
export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

/**
 * Chat always belongs to a celestial body (a planet or the Sun).
 * Sessions are listed as tabs in the body's PlanetDetail page, and the same
 * session can be expanded into ChatSessionView (full-screen) without losing
 * identity.
 */
export type ChatSession = {
  id: string;
  bodyId: BodyId;
  /** Epoch ms of session creation; used for tab ordering. */
  createdAt: number;
  messages: ChatMessage[];
};

/** Generic placeholder text; the UI swaps in the body's name. */
export function assistantPlaceholderFor(bodyName: string): string {
  return `${bodyName} is listening. AI responses will appear here once the service is connected.`;
}

export function createMessage(
  role: ChatMessage["role"],
  content: string
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: Date.now(),
  };
}

/**
 * One user send → user row + assistant row in the same update.
 *
 * FUTURE AI PITFALL: it is easy to append only the user message here and wait
 * for the model before updating state. That leaves the thread empty on the
 * assistant side until the network returns (the exact bug we hit on the dock's
 * first send). Keep UX responsive: commit the user message immediately, then
 * either (a) keep this placeholder/typing row until streaming completes and
 * replace it, or (b) replace the placeholder with streamed tokens in place.
 * Never open ChatSessionView with user-only messages unless you intentionally
 * show a loading indicator.
 */
export function appendUserTurn(
  messages: ChatMessage[],
  userText: string,
  assistantText: string
): ChatMessage[] {
  return [
    ...messages,
    createMessage("user", userText),
    createMessage("assistant", assistantText),
  ];
}

/**
 * Pure helper to append a user turn to a specific session inside a sessions
 * array. Returns a new array (no mutation). Centralises the map+spread pattern
 * that callers used to inline.
 */
export function appendUserTurnToSession(
  sessions: ChatSession[],
  sessionId: string,
  userText: string,
  assistantText: string
): ChatSession[] {
  return sessions.map((s) =>
    s.id === sessionId
      ? { ...s, messages: appendUserTurn(s.messages, userText, assistantText) }
      : s
  );
}

/**
 * Create a fresh session belonging to `bodyId`. `assistantText` is supplied by
 * the caller (which knows the body's display name).
 */
export function createSession(
  bodyId: BodyId,
  initialPrompt: string,
  assistantText: string
): ChatSession {
  return {
    id: crypto.randomUUID(),
    bodyId,
    createdAt: Date.now(),
    messages: appendUserTurn([], initialPrompt, assistantText),
  };
}
