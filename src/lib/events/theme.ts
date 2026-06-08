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
  accent: "#6fe9ff",
  accent2: "#f6c760",
  fallbackEnd: "#182a38",
  fallbackStart: "#101820",
  glow: "rgba(111, 233, 255, 0.32)",
  ink: "#041318",
};

const communityTheme: EventTheme = {
  accent: "#9be77d",
  accent2: "#ff9a76",
  fallbackEnd: "#26331f",
  fallbackStart: "#111c17",
  glow: "rgba(155, 231, 125, 0.28)",
  ink: "#0c1608",
};

const workshopTheme: EventTheme = {
  accent: "#b8a7ff",
  accent2: "#72e6c8",
  fallbackEnd: "#25223a",
  fallbackStart: "#11131f",
  glow: "rgba(184, 167, 255, 0.28)",
  ink: "#0f0c1f",
};

function themeForEvent(event: EventRecord): EventTheme {
  const source = `${event.title} ${event.eventType}`.toLowerCase();

  if (source.includes("office") || source.includes("community")) {
    return communityTheme;
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
