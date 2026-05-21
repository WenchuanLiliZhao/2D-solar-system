import { useEffect, useRef, useState } from "react";
import type { ChatSession } from "../../data/chatSession";
import { Composer } from "../Composer/Composer";
import styles from "./ChatThread.module.scss";

interface ChatThreadProps {
  session: ChatSession;
  /** Display name for the assistant role (e.g. "Sun", "Mars"). */
  bodyName: string;
  /** Append a user message; parent also queues the assistant reply. */
  onSendMessage: (text: string) => void;
  /**
   * If provided, an Expand affordance is rendered in the session toolbar that
   * sits just above the composer. Used by PlanetDetail session tabs to jump
   * the conversation into the full-screen ChatSessionView; the full-screen
   * view itself omits this prop because it's already expanded.
   */
  onExpand?: () => void;
  /** Compact = embedded in a tab; full = standalone full-screen panel. */
  variant?: "compact" | "full";
  /** When true, focus the composer input on mount. */
  autoFocusComposer?: boolean;
}

/**
 * Message list + session toolbar + composer. Two render variants:
 *  - "compact" (default): used inside PlanetDetail session tabs; tighter
 *    padding and a subtle composer that doesn't fight the surrounding panel.
 *  - "full": used by ChatSessionView; spacious padding and the prominent
 *    composer used on the standalone stage.
 *
 * The toolbar lives directly above the composer and groups session-level
 * actions (Expand, ⋯ menu) so they don't crowd the message thread.
 *
 * Menu items are UI-only stubs for now — Rename and Export as Markdown both
 * close the menu silently. Wire real handlers when the features ship.
 */
export function ChatThread({
  session,
  bodyName,
  onSendMessage,
  onExpand,
  variant = "compact",
  autoFocusComposer = false,
}: ChatThreadProps) {
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);
  const menuWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages.length]);

  // Click-outside + Escape close the ⋯ menu.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (
        menuWrapRef.current &&
        !menuWrapRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setDraft("");
  };

  const placeholder = `Continue with ${bodyName}…`;

  // UI-only stub handlers; swap in real implementations later.
  const handleRename = () => {
    setMenuOpen(false);
    // TODO: prompt for a new title and persist via onRenameSession (parent).
  };
  const handleExport = () => {
    setMenuOpen(false);
    // TODO: serialise session.messages to Markdown and trigger a download.
  };

  return (
    <div
      className={`${styles.root} ${
        variant === "full" ? styles.rootFull : styles.rootCompact
      }`}
    >
      <div className={styles.scroll}>
        <div className={styles.thread} role="log" aria-live="polite">
          {session.messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={msg.id}
                className={`${styles.bubbleRow} ${
                  isUser ? styles.bubbleRowUser : styles.bubbleRowAssistant
                }`}
              >
                <span className={styles.bubbleLabel}>
                  {isUser ? "You" : bodyName}
                </span>
                <div
                  className={`${styles.bubble} ${
                    isUser ? styles.bubbleUser : styles.bubbleAssistant
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={listEndRef} aria-hidden="true" />
        </div>
      </div>

      <footer className={styles.foot}>
        {/* Session toolbar: expand (if applicable) + ⋯ menu. Kept thin and
            ink-mute by default so it doesn't compete with the composer. */}
        <div className={styles.toolbar} role="toolbar" aria-label="Session actions">
          {onExpand && (
            <button
              type="button"
              className={styles.toolBtn}
              aria-label="Expand chat to full screen"
              title="Expand"
              onClick={onExpand}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M2 6 L2 2 L6 2 M14 6 L14 2 L10 2 M2 10 L2 14 L6 14 M14 10 L14 14 L10 14"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="square"
                  fill="none"
                />
              </svg>
              <span className={styles.toolLabel}>Expand</span>
            </button>
          )}

          <div className={styles.menuWrap} ref={menuWrapRef}>
            <button
              type="button"
              className={`${styles.toolBtn} ${styles.toolBtnIconOnly}`}
              aria-label="More session actions"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title="More"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <circle cx="3.5" cy="8" r="1.2" fill="currentColor" />
                <circle cx="8" cy="8" r="1.2" fill="currentColor" />
                <circle cx="12.5" cy="8" r="1.2" fill="currentColor" />
              </svg>
            </button>

            {menuOpen && (
              <div className={styles.menu} role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className={styles.menuItem}
                  onClick={handleRename}
                >
                  Rename session
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={styles.menuItem}
                  onClick={handleExport}
                >
                  Export as Markdown
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.composer}>
          <Composer
            value={draft}
            onChange={setDraft}
            onSubmit={submit}
            placeholder={placeholder}
            ariaLabel={`Message to ${bodyName}`}
            autoFocus={autoFocusComposer}
            variant={variant === "compact" ? "subtle" : "default"}
          />
        </div>
      </footer>
    </div>
  );
}
