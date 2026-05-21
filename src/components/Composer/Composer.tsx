import { forwardRef, useImperativeHandle, useRef } from "react";
import styles from "./Composer.module.scss";

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  /** aria-label for the input (assistive tech). */
  ariaLabel: string;
  /** When true, the input is disabled and the send button greys out. */
  disabled?: boolean;
  /** When true, focuses the input on mount. */
  autoFocus?: boolean;
  /** Cosmetic-only variant for embedding inside dense surfaces. */
  variant?: "default" | "subtle";
}

export interface ComposerHandle {
  focus: () => void;
}

/**
 * Shared input bar used by ChatDock (bottom of stage), PlanetDetail (Intro tab
 * + session tabs), and ChatSessionView (full-screen footer). Centralising the
 * markup + styles avoids drift across four surfaces.
 *
 * Enter submits; Shift+Enter is reserved for the future textarea (TODO).
 */
export const Composer = forwardRef<ComposerHandle, ComposerProps>(
  function Composer(
    {
      value,
      onChange,
      onSubmit,
      placeholder,
      ariaLabel,
      disabled = false,
      autoFocus = false,
      variant = "default",
    },
    ref
  ) {
    const inputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => inputRef.current?.focus(),
    }));

    const submit = () => {
      if (disabled) return;
      if (!value.trim()) return;
      onSubmit();
    };

    return (
      <form
        className={`${styles.form} ${
          variant === "subtle" ? styles.formSubtle : ""
        }`}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              // TODO: multi-line — Shift+Enter for newline when textarea ships.
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          aria-label={ariaLabel}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete="off"
        />
        <button
          type="submit"
          className={styles.sendBtn}
          aria-label="Send message"
          disabled={disabled || !value.trim()}
        >
          <svg viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M3 8 L13 8 M9 4 L13 8 L9 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="square"
              strokeLinejoin="miter"
              fill="none"
            />
          </svg>
        </button>
      </form>
    );
  }
);
