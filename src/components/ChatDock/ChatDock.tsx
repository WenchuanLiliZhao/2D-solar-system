import { useState } from "react";
import styles from "./ChatDock.module.scss";
import { SUN } from "../../data/planets";
import { Composer } from "../Composer/Composer";

interface ChatDockProps {
  /**
   * Dock is visible only when the stage is idle (no body selected, no full
   * chat open). When false it fades out and sinks a few pixels.
   */
  visible: boolean;
  /** Creates a new session with the Sun and opens the full session view. */
  onSend: (prompt: string) => void;
}

/**
 * Bottom-centred prompt bar on the solar-system stage.
 *
 * Business model: global chat = chat with the Sun. This dock is a shortcut to
 * start a brand-new Sun session and jump directly into the full-screen view;
 * equivalent entry points exist in the Sun's PlanetDetail (Intro tab + session
 * tabs). The dock hides whenever any body's detail page is open to avoid two
 * concurrent composer affordances.
 */
export function ChatDock({ visible, onSend }: ChatDockProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <div
      className={`${styles.dock} ${visible ? styles.dockVisible : ""}`}
      aria-hidden={!visible}
    >
      <Composer
        value={value}
        onChange={setValue}
        onSubmit={submit}
        placeholder={`Ask anything about ${SUN.name}…`}
        ariaLabel={`Message to ${SUN.name}`}
        disabled={!visible}
      />
    </div>
  );
}
