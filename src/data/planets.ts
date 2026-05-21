export type PlanetId =
  | "mercury"
  | "venus"
  | "earth"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune";

/**
 * A celestial body acts as an AI "agent group": each body owns a set of chat
 * sessions, surfaced in its detail page as tabs. `intro` and `presetQuestions`
 * shape the Intro tab (introduction copy + starter cards). The Sun shares the
 * same shape — see SUN below.
 */
export interface Planet {
  id: PlanetId;
  name: string;
  color: string;
  /** Display radius in SVG units (classical-illustration proportions, not real). */
  radius: number;
  /** Orbital radius from the Sun's center, in SVG units. */
  orbit: number;
  /** Starting angle around the Sun in degrees (math convention: 0° = right, CCW). */
  angle: number;
  /** Orbital period in seconds for one full revolution (display only). */
  period: number;
  /** Short blurb shown on the Intro tab of the body's detail page. */
  intro: string;
  /** Starter prompts shown as cards on the Intro tab; clicking opens a new session. */
  presetQuestions: string[];
}

export const PLANETS: Planet[] = [
  {
    id: "mercury",
    name: "Mercury",
    color: "#8C8479",
    radius: 6,
    orbit: 100,
    angle: 215,
    period: 24,
    intro:
      "The smallest planet and closest to the Sun, Mercury races around our star every 88 Earth days through extreme heat and cold.",
    presetQuestions: [
      "Why does Mercury have such extreme temperature swings?",
      "How long is a single day on Mercury?",
      "What would standing on Mercury feel like?",
    ],
  },
  {
    id: "venus",
    name: "Venus",
    color: "#D9A86C",
    radius: 11,
    orbit: 138,
    angle: 305,
    period: 36,
    intro:
      "Wrapped in a thick CO₂ atmosphere, Venus is the hottest planet in the solar system and spins backward compared to most others.",
    presetQuestions: [
      "Why is Venus hotter than Mercury?",
      "What makes Venus spin in reverse?",
      "Could humans ever live in Venus's upper atmosphere?",
    ],
  },
  {
    id: "earth",
    name: "Earth",
    color: "#4F7CAC",
    radius: 12,
    orbit: 188,
    angle: 50,
    period: 48,
    intro:
      "Our pale blue dot — the only world we know of where life thrives, shielded by a magnetic field and bathed in liquid water.",
    presetQuestions: [
      "What makes Earth uniquely suited for life?",
      "How does Earth's magnetic field protect us?",
      "Why do we have seasons?",
    ],
  },
  {
    id: "mars",
    name: "Mars",
    color: "#B8553C",
    radius: 8,
    orbit: 235,
    angle: 130,
    period: 66,
    intro:
      "The rust-coloured fourth planet, Mars has the largest volcano in the solar system and ancient riverbeds hinting at a wetter past.",
    presetQuestions: [
      "Did Mars once have oceans?",
      "What is Olympus Mons?",
      "How realistic is human settlement on Mars?",
    ],
  },
  {
    id: "jupiter",
    name: "Jupiter",
    color: "#B6905E",
    radius: 28,
    orbit: 310,
    angle: 240,
    period: 110,
    intro:
      "The giant of the family, Jupiter is a swirling ball of gas with a storm — the Great Red Spot — larger than Earth itself.",
    presetQuestions: [
      "What powers Jupiter's Great Red Spot?",
      "How many moons does Jupiter have?",
      "Could Jupiter have become a star?",
    ],
  },
  {
    id: "saturn",
    name: "Saturn",
    color: "#C9B17A",
    radius: 24,
    orbit: 378,
    angle: 350,
    period: 160,
    intro:
      "Famous for its dazzling rings of ice and rock, Saturn is a gas giant so light it would float in a bathtub — if you could find one.",
    presetQuestions: [
      "What are Saturn's rings made of?",
      "How long will Saturn's rings last?",
      "What is hexagonal storm at Saturn's north pole?",
    ],
  },
  {
    id: "uranus",
    name: "Uranus",
    color: "#6FA9B0",
    radius: 16,
    orbit: 432,
    angle: 95,
    period: 220,
    intro:
      "The tilted ice giant rolls on its side as it orbits the Sun, giving it the strangest seasons of any planet — decades of light then dark.",
    presetQuestions: [
      "Why is Uranus tipped on its side?",
      "What makes Uranus look blue-green?",
      "What would a year on Uranus feel like?",
    ],
  },
  {
    id: "neptune",
    name: "Neptune",
    color: "#3D5A80",
    radius: 15,
    orbit: 500,
    angle: 170,
    period: 290,
    intro:
      "The deep-blue ice giant at the edge of the planetary realm, Neptune whips up the fastest winds in the solar system.",
    presetQuestions: [
      "How fast are Neptune's winds?",
      "Why is Neptune so blue?",
      "What is Triton, Neptune's largest moon?",
    ],
  },
];

/** Largest orbital radius in SVG units (used to size the viewBox). */
export const MAX_ORBIT = Math.max(...PLANETS.map((p) => p.orbit));

/**
 * The Sun is treated as a body in its own right (same shape as a Planet, minus
 * orbital parameters). Its id matches the `bodyId` literal used by ChatSession,
 * so a single string identifies the body across data + chat layers.
 */
export const SUN = {
  id: "sun" as const,
  name: "Sun",
  color: "#D97834",
  radius: 50,
  intro:
    "Our local star — a 4.6-billion-year-old ball of plasma whose fusion core powers every world that orbits it.",
  presetQuestions: [
    "How does fusion power the Sun?",
    "What will happen when the Sun dies?",
    "Why does the Sun have an 11-year cycle of activity?",
  ],
};

/** Union of every body the user can talk to. */
export type BodyId = PlanetId | typeof SUN.id;

/**
 * Lookup any body (planet or Sun) by id. Returns the shape the UI cares about
 * (name + color + intro + presetQuestions) — callers that need orbital data
 * should reach into PLANETS directly.
 */
export function findBody(id: BodyId):
  | (Pick<Planet, "name" | "color" | "intro" | "presetQuestions"> & {
      id: BodyId;
    })
  | null {
  if (id === SUN.id) return SUN;
  return PLANETS.find((p) => p.id === id) ?? null;
}
