import type { CSSProperties } from "react";
import type { EventRecord } from "@/lib/db/models";

type EventTheme = {
  accent: string;
  accent2: string;
  fallbackEnd: string;
  fallbackStart: string;
  glow: string;
  ink: string;
};

const fallbackCoverImage =
  "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1600&q=80";

const stellarTheme: EventTheme = {
  accent: "#d9a85c",
  accent2: "#8fb8bd",
  fallbackEnd: "#2a2116",
  fallbackStart: "#15130f",
  glow: "rgba(217, 168, 92, 0.24)",
  ink: "#111112",
};

const communityTheme: EventTheme = {
  accent: "#a993ff",
  accent2: "#d98571",
  fallbackEnd: "#211b34",
  fallbackStart: "#131119",
  glow: "rgba(169, 147, 255, 0.22)",
  ink: "#111112",
};

const workshopTheme: EventTheme = {
  accent: "#d98571",
  accent2: "#d9a85c",
  fallbackEnd: "#301c19",
  fallbackStart: "#15100f",
  glow: "rgba(217, 133, 113, 0.2)",
  ink: "#111112",
};

function themeForEvent(event: EventRecord): EventTheme {
  const source = `${event.title} ${event.eventType}`.toLowerCase();

  if (source.includes("office") || source.includes("community")) {
    return communityTheme;
  }

  if (source.includes("stellar")) {
    return stellarTheme;
  }

  if (source.includes("workshop")) {
    return workshopTheme;
  }

  return stellarTheme;
}

export function eventThemeStyle(event: EventRecord): CSSProperties {
  const theme = themeForEvent(event);

  return {
    "--event-accent": theme.accent,
    "--event-accent-2": theme.accent2,
    "--event-glow": theme.glow,
    "--event-ink": theme.ink,
  } as CSSProperties;
}

export function eventCoverStyle(event: EventRecord): CSSProperties {
  const theme = themeForEvent(event);
  const imageUrl = event.coverImageUrl ?? fallbackCoverImage;

  return {
    ...eventThemeStyle(event),
    backgroundImage: [
      "linear-gradient(135deg, rgba(8, 10, 14, 0.12), rgba(8, 10, 14, 0.54))",
      `linear-gradient(110deg, ${theme.glow}, transparent 38%, color-mix(in srgb, ${theme.accent2} 24%, transparent))`,
      `url("${imageUrl}")`,
      `linear-gradient(135deg, ${theme.fallbackStart}, ${theme.fallbackEnd})`,
    ].join(", "),
  };
}
