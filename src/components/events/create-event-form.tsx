"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, CheckCircle2, Loader2, WalletCards } from "lucide-react";
import { useWallet } from "@/components/wallet-provider";

type DraftResponse = {
  event?: {
    id: string;
    slug: string;
    title: string;
    status: string;
  };
  error?: string;
  issues?: Array<{ path: string; message: string }>;
};

const inputClass =
  "min-h-11 w-full border border-line bg-background/60 px-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent";
const labelClass = "text-sm font-medium text-foreground";

function defaultDateTime(offsetHours: number) {
  const date = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
  return date.toISOString().slice(0, 16);
}

function toIsoDateTime(value: string) {
  return new Date(value).toISOString();
}

export function CreateEventForm() {
  const { sessionWalletAddress, status } = useWallet();
  const [mode, setMode] = useState<"paid" | "free">("paid");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<DraftResponse | null>(null);
  const [form, setForm] = useState({
    title: "APAC Stellar Builder Meetup",
    eventType: "Web3 meetup",
    shortDescription:
      "A paid builder meetup with a mini workshop, collaborator split, and gated resources.",
    coverImageUrl:
      "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1600&q=80",
    startDateTime: defaultDateTime(48),
    endDateTime: defaultDateTime(51),
    timezone: "Asia/Jakarta",
    locationType: "hybrid",
    locationText: "Jakarta + livestream",
    meetingUrl: "https://example.com/livestream",
    priceUsdc: "5",
    capacity: "80",
  });

  const canSubmit = Boolean(sessionWalletAddress) && !submitting;
  const issueText = useMemo(() => {
    if (!result?.issues?.length) return null;
    return result.issues.map((issue) => issue.message).join(" ");
  }, [result]);

  function updateForm(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setResult(null);

    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        startDateTime: toIsoDateTime(form.startDateTime),
        endDateTime: toIsoDateTime(form.endDateTime),
        isFree: mode === "free",
        priceUsdc: mode === "free" ? "0" : form.priceUsdc,
        capacity: Number(form.capacity),
      }),
    });
    const payload = (await response.json()) as DraftResponse;

    setResult(payload);
    setSubmitting(false);
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="border border-line bg-panel p-5">
          <div className="grid gap-4">
            <label className="grid gap-2">
              <span className={labelClass}>Event title</span>
              <input
                className={inputClass}
                onChange={(event) => updateForm("title", event.target.value)}
                required
                value={form.title}
              />
            </label>

            <label className="grid gap-2">
              <span className={labelClass}>Description</span>
              <textarea
                className={`${inputClass} min-h-28 py-3 leading-6`}
                maxLength={280}
                onChange={(event) =>
                  updateForm("shortDescription", event.target.value)
                }
                required
                value={form.shortDescription}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <span className={labelClass}>Event type</span>
                <input
                  className={inputClass}
                  onChange={(event) => updateForm("eventType", event.target.value)}
                  required
                  value={form.eventType}
                />
              </label>

              <label className="grid gap-2">
                <span className={labelClass}>Cover image URL</span>
                <input
                  className={inputClass}
                  onChange={(event) =>
                    updateForm("coverImageUrl", event.target.value)
                  }
                  type="url"
                  value={form.coverImageUrl}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="border border-line bg-panel p-5">
          <p className="font-mono text-xs uppercase tracking-normal text-muted">
            Organizer
          </p>
          <div className="mt-4 border border-line bg-background/40 p-4">
            <WalletCards className="text-accent" size={20} />
            <p className="mt-3 font-mono text-xs leading-5 text-muted break-all">
              {sessionWalletAddress ?? "Connect wallet to create draft"}
            </p>
            <p className="mt-3 text-sm font-medium capitalize">
              {sessionWalletAddress ? "Session signed" : status}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="border border-line bg-panel p-5 lg:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className={labelClass}>Start</span>
              <input
                className={inputClass}
                onChange={(event) =>
                  updateForm("startDateTime", event.target.value)
                }
                required
                type="datetime-local"
                value={form.startDateTime}
              />
            </label>

            <label className="grid gap-2">
              <span className={labelClass}>End</span>
              <input
                className={inputClass}
                onChange={(event) => updateForm("endDateTime", event.target.value)}
                required
                type="datetime-local"
                value={form.endDateTime}
              />
            </label>

            <label className="grid gap-2">
              <span className={labelClass}>Timezone</span>
              <input
                className={inputClass}
                onChange={(event) => updateForm("timezone", event.target.value)}
                required
                value={form.timezone}
              />
            </label>

            <label className="grid gap-2">
              <span className={labelClass}>Location type</span>
              <select
                className={inputClass}
                onChange={(event) => updateForm("locationType", event.target.value)}
                value={form.locationType}
              >
                <option value="physical">Physical</option>
                <option value="virtual">Virtual</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className={labelClass}>Location</span>
              <input
                className={inputClass}
                onChange={(event) => updateForm("locationText", event.target.value)}
                value={form.locationText}
              />
            </label>

            <label className="grid gap-2">
              <span className={labelClass}>Meeting URL</span>
              <input
                className={inputClass}
                onChange={(event) => updateForm("meetingUrl", event.target.value)}
                type="url"
                value={form.meetingUrl}
              />
            </label>
          </div>
        </div>

        <div className="border border-line bg-panel p-5">
          <p className="font-mono text-xs uppercase tracking-normal text-muted">
            Access
          </p>
          <div className="mt-4 grid grid-cols-2 border border-line">
            {(["paid", "free"] as const).map((item) => (
              <button
                className={`min-h-11 text-sm font-medium transition ${
                  mode === item ? "bg-accent text-background" : "bg-background/40"
                }`}
                key={item}
                onClick={() => setMode(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-4">
            <label className="grid gap-2">
              <span className={labelClass}>Price USDC</span>
              <input
                className={inputClass}
                disabled={mode === "free"}
                min="0"
                onChange={(event) => updateForm("priceUsdc", event.target.value)}
                step="0.01"
                type="number"
                value={mode === "free" ? "0" : form.priceUsdc}
              />
            </label>

            <label className="grid gap-2">
              <span className={labelClass}>Capacity</span>
              <input
                className={inputClass}
                min="1"
                onChange={(event) => updateForm("capacity", event.target.value)}
                required
                type="number"
                value={form.capacity}
              />
            </label>
          </div>
        </div>
      </div>

      {result?.event ? (
        <div className="grid grid-cols-[auto_1fr] items-center gap-3 border border-accent/60 bg-accent/10 p-4 text-sm">
          <CheckCircle2 className="text-accent" size={20} />
          <span>
            Draft saved: <span className="font-medium">{result.event.title}</span>
          </span>
        </div>
      ) : null}

      {result?.error ? (
        <div className="border border-coral/60 bg-coral/10 p-4 text-sm text-coral">
          {result.error} {issueText}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          className="inline-flex min-h-11 items-center gap-2 border border-accent bg-accent px-5 text-sm font-semibold text-background transition hover:bg-transparent hover:text-accent disabled:cursor-not-allowed disabled:border-line disabled:bg-panel disabled:text-muted"
          disabled={!canSubmit}
          type="submit"
        >
          {submitting ? (
            <Loader2 className="animate-spin" size={17} />
          ) : (
            <CalendarPlus size={17} />
          )}
          Save draft
        </button>
      </div>
    </form>
  );
}
