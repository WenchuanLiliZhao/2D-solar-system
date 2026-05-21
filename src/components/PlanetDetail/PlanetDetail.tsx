import { useEffect, useMemo, useRef, useState } from "react";
import { findBody, SUN, type BodyId } from "../../data/planets";
import type { ChatSession } from "../../data/chatSession";
import { ChatThread } from "../ChatThread/ChatThread";
import { Composer } from "../Composer/Composer";
import styles from "./PlanetDetail.module.scss";

interface PlanetDetailProps {
  planetId: BodyId | null;
  onClose: () => void;
  tracking: boolean;
  onToggleTracking: () => void;
  /** Sessions belonging to this body (parent already filters by bodyId). */
  sessions: ChatSession[];
  /**
   * Create a new session under this body with `prompt` as the first user
   * message. Returns the new session id so we can switch the active tab to it.
   */
  onCreateSession: (prompt: string) => string;
  /** Append a user turn to a session that lives in this detail page. */
  onSendInSession: (sessionId: string, text: string) => void;
  /** Open this session in the full-screen ChatSessionView. */
  onExpandSession: (sessionId: string) => void;
  /** Remove a session and its tab; parent clears full-screen state if needed. */
  onDeleteSession: (sessionId: string) => void;
  /**
   * When provided, preselects this session's tab (used when ChatSessionView
   * collapses back into the detail page — the user lands on the tab they were
   * just chatting in).
   */
  preselectSessionId?: string | null;
}

type TabKey = "intro" | string;

const INTRO_TAB: TabKey = "intro";

/** Best-effort tab label: trim/truncate the session's first user message. */
function labelForSession(session: ChatSession, index: number): string {
  const firstUser = session.messages.find((m) => m.role === "user");
  const raw = firstUser?.content.trim();
  if (!raw) return `Session ${index + 1}`;
  return raw.length > 26 ? `${raw.slice(0, 25)}…` : raw;
}

export function PlanetDetail({
  planetId,
  onClose,
  tracking,
  onToggleTracking,
  sessions,
  onCreateSession,
  onSendInSession,
  onExpandSession,
  onDeleteSession,
  preselectSessionId,
}: PlanetDetailProps) {
  const isOpen = planetId !== null;
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const target = planetId ? findBody(planetId) : null;
  const isSun = planetId === SUN.id;

  const [activeTab, setActiveTab] = useState<TabKey>(INTRO_TAB);
  const [draft, setDraft] = useState("");

  // Reset tab when the user opens a different body's detail page.
  useEffect(() => {
    setActiveTab(INTRO_TAB);
    setDraft("");
  }, [planetId]);

  // Honour preselect coming from ChatSessionView collapse (only when valid).
  useEffect(() => {
    if (!preselectSessionId) return;
    if (sessions.some((s) => s.id === preselectSessionId)) {
      setActiveTab(preselectSessionId);
    }
  }, [preselectSessionId, sessions]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  /** Sorted ascending by creation time so tab order is stable. */
  const orderedSessions = useMemo(
    () => [...sessions].sort((a, b) => a.createdAt - b.createdAt),
    [sessions]
  );

  const activeSession =
    activeTab === INTRO_TAB
      ? null
      : orderedSessions.find((s) => s.id === activeTab) ?? null;

  // Defensive: if the active session was deleted while we were on it, fall
  // back to the intro tab so the body doesn't render nothing.
  useEffect(() => {
    if (activeTab !== INTRO_TAB && !activeSession) {
      setActiveTab(INTRO_TAB);
    }
  }, [activeTab, activeSession]);

  /**
   * Create a new session from a preset card and switch to its tab inside the
   * detail page. Cards are exploratory; we keep the user in the detail surface
   * so they can see the new tab show up alongside Intro.
   */
  const startSessionFromCard = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    const newId = onCreateSession(trimmed);
    setActiveTab(newId);
  };

  /**
   * Send from the Intro tab's "New session" composer. By product decision this
   * one DOES auto-expand to the full-screen view: typing into a composer
   * already signals "I want to focus on this conversation", so we honour that
   * and give the conversation the larger canvas. Collapsing (⌄) lands them
   * back on this same session's tab in the detail page.
   */
  const startSessionFromComposer = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    const newId = onCreateSession(trimmed);
    setActiveTab(newId);
    setDraft("");
    onExpandSession(newId);
  };

  const closeSessionTab = (sessionId: string) => {
    if (activeTab === sessionId) {
      setActiveTab(INTRO_TAB);
    }
    onDeleteSession(sessionId);
  };

  return (
    <>
      <div
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        aria-label={target ? `${target.name} detail` : "Body detail"}
      >
        <header className={styles.panelHeader}>
          <div className={styles.headerLeft}>
            <span
              className={styles.swatch}
              style={{ backgroundColor: target?.color ?? "transparent" }}
              aria-hidden="true"
            />
            <div className={styles.headerText}>
              <span className={styles.eyebrow}>{isSun ? "Star" : "Planet"}</span>
              <h2 className={styles.title}>{target?.name ?? ""}</h2>
            </div>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            className={styles.closeBtn}
            aria-label="Close detail"
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
        </header>

        {/* Tab strip: fixed Intro + one tab per session (ordered by createdAt). */}
        <nav
          className={styles.tabStrip}
          role="tablist"
          aria-label="Detail sections"
        >
          <button
            type="button"
            className={`${styles.tab} ${
              activeTab === INTRO_TAB ? styles.tabActive : ""
            }`}
            aria-selected={activeTab === INTRO_TAB}
            role="tab"
            onClick={() => setActiveTab(INTRO_TAB)}
          >
            Intro
          </button>
          {orderedSessions.map((s, idx) => {
            const active = activeTab === s.id;
            const label = labelForSession(s, idx);
            return (
              <div
                key={s.id}
                className={`${styles.tabGroup} ${
                  active ? styles.tabGroupActive : ""
                }`}
                role="presentation"
              >
                <button
                  type="button"
                  className={styles.tabSelect}
                  aria-selected={active}
                  role="tab"
                  title={label}
                  onClick={() => setActiveTab(s.id)}
                >
                  <span className={styles.tabIndex}>{idx + 1}</span>
                  <span className={styles.tabLabel}>{label}</span>
                </button>
                <button
                  type="button"
                  className={styles.tabClose}
                  aria-label={`Close session: ${label}`}
                  title="Close session"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeSessionTab(s.id);
                  }}
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
            );
          })}
        </nav>

        <div className={styles.body}>
          {activeTab === INTRO_TAB && target && (
            <div className={styles.intro}>
              <p className={styles.introText}>{target.intro}</p>

              <section className={styles.presetSection}>
                <span className={styles.sectionLabel}>Starters</span>
                <div className={styles.presetGrid}>
                  {target.presetQuestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className={styles.presetCard}
                      onClick={() => startSessionFromCard(q)}
                    >
                      <span className={styles.presetText}>{q}</span>
                      <span
                        className={styles.presetArrow}
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {!isSun && (
                <section className={styles.actions}>
                  <span className={styles.sectionLabel}>Camera</span>
                  <button
                    type="button"
                    className={`${styles.trackBtn} ${
                      tracking ? styles.trackBtnActive : ""
                    }`}
                    aria-pressed={tracking}
                    onClick={onToggleTracking}
                  >
                    <span className={styles.trackDot} aria-hidden="true" />
                    <span className={styles.trackLabel}>
                      {tracking ? "Tracking" : "Track planet"}
                    </span>
                    <span className={styles.trackHint}>
                      {tracking ? "ON" : "OFF"}
                    </span>
                  </button>
                  <p className={styles.actionsHelp}>
                    Centres the view on {target.name} and zooms in based on its
                    radius.
                  </p>
                </section>
              )}

              <footer className={styles.introComposer}>
                <span className={styles.sectionLabel}>New session</span>
                <Composer
                  value={draft}
                  onChange={setDraft}
                  onSubmit={() => startSessionFromComposer(draft)}
                  placeholder={`Ask ${target.name} anything…`}
                  ariaLabel={`Start a new session with ${target.name}`}
                  variant="subtle"
                />
              </footer>
            </div>
          )}

          {activeTab !== INTRO_TAB && activeSession && target && (
            <div className={styles.sessionTab}>
              <ChatThread
                key={activeSession.id}
                session={activeSession}
                bodyName={target.name}
                onSendMessage={(text) =>
                  onSendInSession(activeSession.id, text)
                }
                onExpand={() => onExpandSession(activeSession.id)}
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
