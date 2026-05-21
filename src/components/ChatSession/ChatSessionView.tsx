import { useEffect, useMemo } from "react";
import { findBody } from "../../data/planets";
import type { ChatSession } from "../../data/chatSession";
import { ChatThread } from "../ChatThread/ChatThread";
import styles from "./ChatSessionView.module.scss";

interface ChatSessionViewProps {
  /** The session currently shown in the main pane. */
  session: ChatSession;
  /**
   * Sibling sessions for the same body, listed in the left sidebar so the
   * user can switch sessions without leaving the full-screen view. Parent
   * filters these by bodyId.
   */
  sessions: ChatSession[];
  /** Switch the main pane to another sibling session. */
  onSelectSession: (sessionId: string) => void;
  /** Create a fresh session for this body and switch to it. */
  onCreateSession: () => void;
  /** Append a user turn to the active session. */
  onSendMessage: (text: string) => void;
  /**
   * Collapse the full-screen view back into the body's detail page; the
   * current session becomes the active tab there.
   */
  onCollapse: () => void;
  /**
   * Close everything and return to the bare solar-system stage (detail page
   * also closes). The session itself stays in memory.
   */
  onClose: () => void;
}

/** Short label for sidebar items: first user prompt (truncated) or fallback. */
function labelForSession(session: ChatSession, index: number): string {
  const firstUser = session.messages.find((m) => m.role === "user");
  const raw = firstUser?.content.trim();
  if (!raw) return `Session ${index + 1}`;
  return raw.length > 32 ? `${raw.slice(0, 31)}…` : raw;
}

/**
 * Full-screen chat surface for one session, with a collapsible sidebar that
 * lists other sessions belonging to the same body. Two distinct close affordances:
 *  - Collapse (chevron down): fold back into the owning body's detail page.
 *  - Close (×): fully exit chat + close the detail page; back to solar system.
 *
 * AI: parent must append the assistant turn in the same React commit as each
 * user send (see appendUserTurnToSession). Streaming should replace the
 * placeholder row in place, not delay creating it — see SolarSystem.
 */
export function ChatSessionView({
  session,
  sessions,
  onSelectSession,
  onCreateSession,
  onSendMessage,
  onCollapse,
  onClose,
}: ChatSessionViewProps) {
  const body = findBody(session.bodyId);
  const bodyName = body?.name ?? "Chat";
  const bodyColor = body?.color ?? "#000";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCollapse();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCollapse]);

  const orderedSessions = useMemo(
    () => [...sessions].sort((a, b) => a.createdAt - b.createdAt),
    [sessions]
  );

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`Chat with ${bodyName}`}
    >
      {/* ── Left: collapsible session sidebar ─────────────────────────── */}
      <aside className={styles.sidebar} aria-label="Sessions">
        <div className={styles.sidebarInner}>
          <button
            type="button"
            className={styles.newBtn}
            aria-label={`New session with ${bodyName}`}
            title={`New session with ${bodyName}`}
            onClick={onCreateSession}
          >
            <span className={styles.newIcon} aria-hidden="true">
              +
            </span>
            <span className={styles.itemLabel}>New session</span>
          </button>

          <div className={styles.sidebarDivider} aria-hidden="true" />

          <nav className={styles.sessionList} aria-label="Session list">
            {orderedSessions.map((s, idx) => {
              const isActive = s.id === session.id;
              const label = labelForSession(s, idx);
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`${styles.sessionItem} ${
                    isActive ? styles.sessionItemActive : ""
                  }`}
                  aria-current={isActive ? "true" : undefined}
                  title={label}
                  onClick={() => onSelectSession(s.id)}
                >
                  <span className={styles.itemIcon} aria-hidden="true">
                    {idx + 1}
                  </span>
                  <span className={styles.itemLabel}>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* ── Right: header + thread ───────────────────────────────────── */}
      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span
              className={styles.swatch}
              style={{ backgroundColor: bodyColor }}
              aria-hidden="true"
            />
            <div className={styles.headerText}>
              <span className={styles.eyebrow}>Session</span>
              <h2 className={styles.title}>Chat with {bodyName}</h2>
            </div>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Collapse to detail"
              title="Collapse to detail"
              onClick={onCollapse}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M3 6 L8 11 L13 6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="square"
                  fill="none"
                />
              </svg>
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Close chat"
              title="Close chat"
              onClick={onClose}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M3 3 L13 13 M13 3 L3 13"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="square"
                  fill="none"
                />
              </svg>
            </button>
          </div>
        </header>

        <ChatThread
          key={session.id}
          session={session}
          bodyName={bodyName}
          onSendMessage={onSendMessage}
          variant="full"
          autoFocusComposer
        />
      </div>
    </div>
  );
}
