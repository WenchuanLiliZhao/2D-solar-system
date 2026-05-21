import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import {
  PLANETS,
  SUN,
  findBody,
  type BodyId,
} from "../../data/planets";
import {
  appendUserTurnToSession,
  assistantPlaceholderFor,
  createSession,
} from "../../data/chatSession";
import { useChatSessions } from "../../data/useChatSessions";

import styles from "./SolarSystem.module.scss";
import { ChatDock } from "../ChatDock/ChatDock";
import { ChatSessionView } from "../ChatSession/ChatSessionView";
import { PlanetDetail } from "../PlanetDetail/PlanetDetail";
import { PlanetList } from "../PlanetList/PlanetList";
import {
  LAYOUT,
  RING,
  SUN_CX,
  SUN_CY,
  TRACKING,
  UMBRA,
  stageStyle,
  umbraLengthFor,
  zoomFor,
} from "./config";

const toXY = (orbit: number, angleDeg: number) => {
  const a = (angleDeg * Math.PI) / 180;
  return {
    x: SUN_CX + Math.cos(a) * orbit,
    y: SUN_CY - Math.sin(a) * orbit,
  };
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Live position + display radius for a selection (sun or planet). */
const liveTargetFor = (
  selected: BodyId | null,
  elapsed: number
): { x: number; y: number; radius: number } | null => {
  if (selected === null) return null;
  if (selected === SUN.id) {
    return { x: SUN_CX, y: SUN_CY, radius: SUN.radius };
  }
  const planet = PLANETS.find((p) => p.id === selected);
  if (!planet) return null;
  const liveAngle = planet.angle + (elapsed / planet.period) * 360;
  const { x, y } = toXY(planet.orbit, liveAngle);
  return { x, y, radius: planet.radius };
};

export function SolarSystem() {
  const [selected, setSelected] = useState<BodyId | null>(null);
  const [tracking, setTracking] = useState(false);

  /**
   * Single source of truth for every chat session across all bodies.
   * Persisted to localStorage by the hook. Down-stream components see only
   * the slice that matches the body they care about (filtered below).
   */
  const [sessions, setSessions] = useChatSessions();
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  );

  /**
   * When ChatSessionView collapses, the detail page should land on the tab of
   * the session that was just open. We pass the id down as a one-shot
   * preselect; PlanetDetail honours it whenever it changes.
   */
  const [preselectTabSession, setPreselectTabSession] = useState<string | null>(
    null
  );

  const chatOpen = activeSessionId !== null;

  /**
   * Create a session under `bodyId` with the user's first prompt + an
   * immediate assistant placeholder (so the thread never opens user-only).
   * Returns the new session id so callers can wire follow-up state (e.g.
   * switching the detail tab, opening full screen).
   *
   * FUTURE AI: replace the placeholder text with a streaming/typing row that
   * gets rewritten as tokens arrive — but keep the synchronous insert so the
   * UX bug from the dock's first send doesn't regress.
   */
  const handleCreateSession = useCallback(
    (bodyId: BodyId, prompt: string): string => {
      const body = findBody(bodyId);
      const placeholder = assistantPlaceholderFor(body?.name ?? "It");
      const session = createSession(bodyId, prompt, placeholder);
      setSessions((prev) => [...prev, session]);
      return session.id;
    },
    [setSessions]
  );

  /** Dock send: new Sun session, jump straight into the full-screen view. */
  const handleDockSend = useCallback(
    (prompt: string) => {
      const id = handleCreateSession(SUN.id, prompt);
      setActiveSessionId(id);
    },
    [handleCreateSession]
  );

  /**
   * Follow-up in an existing session (used by both detail tabs and the
   * full-screen view). Uses appendUserTurnToSession so the assistant
   * placeholder appears in the same React commit as the user message.
   */
  const handleSendInSession = useCallback(
    (sessionId: string, text: string) => {
      setSessions((prev) => {
        const target = prev.find((s) => s.id === sessionId);
        const body = target ? findBody(target.bodyId) : null;
        const placeholder = assistantPlaceholderFor(body?.name ?? "It");
        return appendUserTurnToSession(prev, sessionId, text, placeholder);
      });
    },
    [setSessions]
  );

  /** Promote a session into the full-screen view. */
  const handleExpandSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  /** Remove a session from storage; exit full-screen if it was the active one. */
  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      setActiveSessionId((id) => (id === sessionId ? null : id));
      setPreselectTabSession((id) => (id === sessionId ? null : id));
    },
    [setSessions]
  );

  /**
   * Collapse the full-screen view into the owning body's detail page. If the
   * detail page isn't already showing that body, switch to it. Also flag the
   * session id as the preselect so the detail tab activates correctly.
   */
  const handleCollapseFullChat = useCallback(() => {
    if (!activeSession) {
      setActiveSessionId(null);
      return;
    }
    setSelected(activeSession.bodyId);
    // Tracking only makes sense for orbiting planets; never for the Sun.
    setTracking(activeSession.bodyId !== SUN.id);
    setPreselectTabSession(activeSession.id);
    setActiveSessionId(null);
  }, [activeSession]);

  /** Full close: chat + detail both gone, back to the bare stage. */
  const handleCloseFullChat = useCallback(() => {
    setActiveSessionId(null);
    setSelected(null);
    setTracking(false);
    setPreselectTabSession(null);
  }, []);

  /** Create a new session from inside the full-screen view (sidebar +). */
  const handleCreateInFullScreen = useCallback(() => {
    if (!activeSession) return;
    // Empty-prompt session: opens with no messages, composer is auto-focused
    // for the user to start typing. We can't reuse createSession because it
    // expects a first prompt — for now we create-then-activate via the normal
    // path but with a single newline-trim trick would be wrong; better to
    // just push a blank-shell session here.
    const blank = {
      id: crypto.randomUUID(),
      bodyId: activeSession.bodyId,
      createdAt: Date.now(),
      messages: [],
    };
    setSessions((prev) => [...prev, blank]);
    setActiveSessionId(blank.id);
  }, [activeSession, setSessions]);

  const close = useCallback(() => {
    setSelected(null);
    setTracking(false);
    setPreselectTabSession(null);
  }, []);

  const toggleTracking = useCallback(() => {
    setTracking((t) => !t);
  }, []);

  // Selecting a planet auto-enables tracking; selecting the Sun (already
  // centred) or closing the panel turns it off. Manual body selection clears
  // any pending preselect from a previous collapse.
  const selectBody = useCallback((id: BodyId) => {
    setSelected(id);
    setTracking(id !== SUN.id);
    setPreselectTabSession(null);
  }, []);

  // rAF-driven elapsed seconds + eased viewport (centre + zoom).
  const [elapsed, setElapsed] = useState(0);
  const [view, setView] = useState({ cx: SUN_CX, cy: SUN_CY, zoom: 1 });
  const startRef = useRef<number | null>(null);

  // Keep the latest selected/tracking inside refs so the rAF closure stays stable.
  const selectedRef = useRef(selected);
  const trackingRef = useRef(tracking);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  useEffect(() => {
    trackingRef.current = tracking;
  }, [tracking]);

  useEffect(() => {
    if (prefersReducedMotion()) {
      // Snap to target without animation.
      const target = liveTargetFor(selectedRef.current, 0);
      if (trackingRef.current && target) {
        setView({ cx: target.x, cy: target.y, zoom: zoomFor(target.radius) });
      } else {
        setView({ cx: SUN_CX, cy: SUN_CY, zoom: 1 });
      }
      return;
    }

    let raf = 0;
    const tick = (t: number) => {
      if (startRef.current === null) startRef.current = t;
      const e = (t - startRef.current) / 1000;
      setElapsed(e);

      const target = liveTargetFor(selectedRef.current, e);
      const wantsTrack = trackingRef.current && target !== null;
      const targetCx = wantsTrack ? target!.x : SUN_CX;
      const targetCy = wantsTrack ? target!.y : SUN_CY;
      const targetZoom = wantsTrack ? zoomFor(target!.radius) : 1;

      setView((v) => {
        const ncx = v.cx + (targetCx - v.cx) * TRACKING.panEase;
        const ncy = v.cy + (targetCy - v.cy) * TRACKING.panEase;
        const nzoom = v.zoom + (targetZoom - v.zoom) * TRACKING.zoomEase;
        return { cx: ncx, cy: ncy, zoom: nzoom };
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Dynamic viewBox: zoom around (view.cx, view.cy).
  const vbW = LAYOUT.viewW / view.zoom;
  const vbH = LAYOUT.viewH / view.zoom;
  const vbX = view.cx - vbW / 2;
  const vbY = view.cy - vbH / 2;

  // Dock is only welcome on the idle stage; any open detail page or full chat
  // already provides its own composer surface.
  const dockVisible = selected === null && activeSessionId === null;

  // Sessions visible to the detail page = sessions belonging to the current body.
  const detailSessions = useMemo(
    () => (selected === null ? [] : sessions.filter((s) => s.bodyId === selected)),
    [sessions, selected]
  );

  // Sessions visible to the full-screen sidebar = sessions belonging to the
  // active session's body.
  const fullScreenSessions = useMemo(
    () =>
      activeSession
        ? sessions.filter((s) => s.bodyId === activeSession.bodyId)
        : [],
    [sessions, activeSession]
  );

  return (
    <div
      className={`${styles.stage} ${chatOpen ? styles.chatOpen : ""}`}
      style={stageStyle}
    >
      {/* HTML chrome (lists, dock, detail) — hidden while full chat is open. */}
      <div className={styles.stageChrome} aria-hidden={chatOpen}>
        <PlanetList selected={selected} onSelect={selectBody} />
        <ChatDock visible={dockVisible} onSend={handleDockSend} />
        <PlanetDetail
          planetId={selected}
          onClose={close}
          tracking={tracking}
          onToggleTracking={toggleTracking}
          sessions={detailSessions}
          onCreateSession={(prompt) => {
            if (selected === null) return "";
            return handleCreateSession(selected, prompt);
          }}
          onSendInSession={handleSendInSession}
          onExpandSession={handleExpandSession}
          onDeleteSession={handleDeleteSession}
          preselectSessionId={preselectTabSession}
        />
      </div>

      <svg
        className={styles.canvas}
        viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Two-dimensional schematic of the solar system"
      >
        <defs>
          {/* Umbra: dark at the planet, fades to transparent away from the Sun. */}
          <linearGradient id="planetUmbra" x1="0" y1="0" x2="1" y2="0">
            <stop
              offset="0%"
              stopColor={UMBRA.startColor}
              stopOpacity={UMBRA.startOpacity}
            />
            <stop
              offset="100%"
              stopColor={UMBRA.endColor}
              stopOpacity={UMBRA.endOpacity}
            />
          </linearGradient>
        </defs>

        {/* Concentric orbits centered on the Sun */}
        <g aria-hidden="true">
          {PLANETS.map((p) => (
            <circle
              key={`orbit-${p.id}`}
              className={styles.orbit}
              cx={SUN_CX}
              cy={SUN_CY}
              r={p.orbit}
            />
          ))}
        </g>

        {/* Sun at the center */}
        <g
          className={`${styles.planetGroup} ${
            selected === SUN.id ? styles.selected : ""
          }`}
          role="button"
          tabIndex={0}
          aria-label={SUN.name}
          onClick={() => selectBody(SUN.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              selectBody(SUN.id);
            }
          }}
        >
          <circle
            className={styles.planetRing}
            cx={SUN_CX}
            cy={SUN_CY}
            r={SUN.radius + RING.sunOffset}
          />
          <circle
            className={styles.planetBody}
            cx={SUN_CX}
            cy={SUN_CY}
            r={SUN.radius}
            style={{ fill: SUN.color }}
          />
          <circle
            className={styles.planetOutline}
            cx={SUN_CX}
            cy={SUN_CY}
            r={SUN.radius}
          />
          <text
            className={styles.sunLabel}
            x={SUN_CX}
            y={SUN_CY}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {SUN.name}
          </text>
        </g>

        {/* Planets */}
        {PLANETS.map((p) => {
          // Counter-clockwise revolution, classical illustration direction.
          const liveAngle = p.angle + (elapsed / p.period) * 360;
          const { x: cx, y: cy } = toXY(p.orbit, liveAngle);
          const isSelected = selected === p.id;

          // Night side: semicircle on the far side from the Sun.
          // Diameter perpendicular to the sun→planet vector splits day/night.
          const a = (liveAngle * Math.PI) / 180;
          const uxOut = Math.cos(a);
          const uyOut = -Math.sin(a); // SVG y is flipped
          const px = -uyOut;
          const py = uxOut;
          const p1x = cx + px * p.radius;
          const p1y = cy + py * p.radius;
          const p2x = cx - px * p.radius;
          const p2y = cy - py * p.radius;
          const nightPath = `M ${p1x} ${p1y} A ${p.radius} ${p.radius} 0 0 0 ${p2x} ${p2y} Z`;

          // Umbra rectangle: starts at planet center, extends outward along the
          // sun→planet ray, with width = planet diameter. SVG rotate is CW in
          // y-down screen coords, so we negate the (math, CCW) angle.
          const umbraLength = umbraLengthFor(p.radius);
          const umbraTransform = `translate(${cx} ${cy}) rotate(${-liveAngle})`;

          return (
            <g
              key={p.id}
              className={`${styles.planetGroup} ${
                isSelected ? styles.selected : ""
              }`}
              role="button"
              tabIndex={0}
              aria-label={p.name}
              onClick={() => selectBody(p.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  selectBody(p.id);
                }
              }}
            >
              <rect
                className={styles.umbra}
                x={0}
                y={-p.radius}
                width={umbraLength}
                height={p.radius * 2}
                fill="url(#planetUmbra)"
                transform={umbraTransform}
              />
              <circle
                className={styles.planetRing}
                cx={cx}
                cy={cy}
                r={p.radius + RING.offset}
              />
              <circle
                className={styles.planetBody}
                cx={cx}
                cy={cy}
                r={p.radius}
                style={{ fill: p.color }}
              />
              <path className={styles.nightSide} d={nightPath} />
              <circle
                className={styles.planetOutline}
                cx={cx}
                cy={cy}
                r={p.radius}
              />

              {/* Hit target */}
              <circle
                cx={cx}
                cy={cy}
                r={Math.max(p.radius + LAYOUT.clickPad, LAYOUT.clickMinRadius)}
                fill="transparent"
              />

              <text
                className={styles.label}
                x={cx}
                y={cy + p.radius + LAYOUT.labelOffset}
                textAnchor="middle"
                dominantBaseline="hanging"
              >
                {p.name}
              </text>
            </g>
          );
        })}
      </svg>

      {activeSession && (
        <ChatSessionView
          session={activeSession}
          sessions={fullScreenSessions}
          onSelectSession={setActiveSessionId}
          onCreateSession={handleCreateInFullScreen}
          onSendMessage={(text) => handleSendInSession(activeSession.id, text)}
          onCollapse={handleCollapseFullChat}
          onClose={handleCloseFullChat}
        />
      )}
    </div>
  );
}
