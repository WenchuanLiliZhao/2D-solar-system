import { useState } from "react";
import { PLANETS, SUN, type BodyId } from "../../data/planets";
import styles from "./PlanetList.module.scss";

interface PlanetListProps {
  selected: BodyId | null;
  onSelect: (id: BodyId) => void;
}

interface BodyItemProps {
  id: BodyId;
  name: string;
  color: string;
  selected: boolean;
  onSelect: (id: BodyId) => void;
  variant?: "star" | "planet";
}

function BodyItem({
  id,
  name,
  color,
  selected,
  onSelect,
  variant = "planet",
}: BodyItemProps) {
  return (
    <li className={styles.row}>
      <button
        type="button"
        className={`${styles.item} ${
          variant === "star" ? styles.itemStar : ""
        } ${selected ? styles.itemSelected : ""}`}
        aria-pressed={selected}
        onClick={() => onSelect(id)}
      >
        <span
          className={styles.swatch}
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span className={styles.itemName}>{name}</span>
      </button>
    </li>
  );
}

export function PlanetList({ selected, onSelect }: PlanetListProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <aside
      className={`${styles.panel} ${
        expanded ? styles.panelExpanded : styles.panelCollapsed
      }`}
      aria-label="Solar system bodies"
    >
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={expanded}
        aria-controls="planet-list-items"
        onClick={() => setExpanded((e) => !e)}
      >
        <span className={styles.toggleLabel}>Bodies</span>
        <span className={styles.toggleChevron} aria-hidden="true">
          <svg viewBox="0 0 10 6">
            <path
              d="M1 1 L5 5 L9 1"
              stroke="currentColor"
              strokeWidth="1.4"
              fill="none"
              strokeLinecap="square"
            />
          </svg>
        </span>
      </button>

      {expanded && (
        <div id="planet-list-items" className={styles.body}>
          <section className={styles.section}>
            <h3 className={styles.sectionLabel}>
              <span>Star</span>
              <span className={styles.sectionCount}>1</span>
            </h3>
            <ul className={styles.items}>
              <BodyItem
                id={SUN.id}
                name={SUN.name}
                color={SUN.color}
                selected={selected === SUN.id}
                onSelect={onSelect}
                variant="star"
              />
            </ul>
          </section>

          <section className={`${styles.section} ${styles.sectionChildren}`}>
            <h3 className={styles.sectionLabel}>
              <span>Planets</span>
              <span className={styles.sectionCount}>{PLANETS.length}</span>
            </h3>
            <ul className={`${styles.items} ${styles.itemsTree}`}>
              {PLANETS.map((p) => (
                <BodyItem
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  color={p.color}
                  selected={selected === p.id}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          </section>
        </div>
      )}
    </aside>
  );
}
