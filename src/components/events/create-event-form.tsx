"use client";

import { useMemo, useState } from "react";
import {
  CalendarPlus,
  CheckCircle2,
  FileKey2,
  Loader2,
  Percent,
  Plus,
  Trash2,
  WalletCards,
} from "lucide-react";
import { useWallet } from "@/components/wallet-provider";

type DraftResponse = {
  event?: {
    id: string;
    slug: string;
    title: string;
    status: string;
  };
  collaborators?: Array<{
    id: string;
    displayName: string;
    role: string;
    walletAddress: string;
    splitPercentage: number;
  }>;
  resources?: Array<{
    id: string;
    title: string;
    type: string;
    url: string | null;
  }>;
  error?: string;
  issues?: Array<{ path: string; message: string }>;
};

type CollaboratorFormRow = {
  displayName: string;
  role: string;
  walletAddress: string;
  splitPercentage: string;
};

type ResourceFormRow = {
  title: string;
  description: string;
  type: "link" | "file" | "text";
  url: string;
  sortOrder: string;
};

const inputClass =
  "min-h-11 w-full border border-line bg-background/60 px-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent";
const labelClass = "text-sm font-medium text-foreground";
const sampleCollaboratorWallets = [
  "GDUZJCMDLTUAAPZULJ2CXV2BO7GZLBCJB4UQCUZXS5TYBGBDVGEJ7HZF",
  "GC33PRL24QY6EUIHOJT6ITM34QHBJOIFXO4UBL3AS2RECIDIPFAF6YDH",
  "GBUSN4MX7AE3RKAR4DEJEELBAQ4CZ3Q6PZ4QEU7RW3SQ7OX6ZFSIDGER",
];

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
  const [collaborators, setCollaborators] = useState<CollaboratorFormRow[]>([
    {
      displayName: "Jakarta Stellar Guild",
      role: "Organizer",
      walletAddress: sampleCollaboratorWallets[0],
      splitPercentage: "70",
    },
    {
      displayName: "Soroban Mentor",
      role: "Speaker",
      walletAddress: sampleCollaboratorWallets[1],
      splitPercentage: "20",
    },
    {
      displayName: "SEA Builders",
      role: "Community Partner",
      walletAddress: sampleCollaboratorWallets[2],
      splitPercentage: "10",
    },
  ]);
  const [resources, setResources] = useState<ResourceFormRow[]>([
    {
      title: "Workshop Deck",
      description: "Slides for attendees after pass mint.",
      type: "link",
      url: "https://example.com/deck",
      sortOrder: "1",
    },
    {
      title: "Soroban Starter Repo",
      description: "Private starter repository for the mini workshop.",
      type: "link",
      url: "https://example.com/repo",
      sortOrder: "2",
    },
  ]);
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

  const collaboratorRows = useMemo(
    () =>
      collaborators.map((collaborator, index) =>
        index === 0 && sessionWalletAddress
          ? { ...collaborator, walletAddress: sessionWalletAddress }
          : collaborator,
      ),
    [collaborators, sessionWalletAddress],
  );
  const splitTotal = useMemo(
    () =>
      collaboratorRows.reduce(
        (total, collaborator) => total + Number(collaborator.splitPercentage || 0),
        0,
      ),
    [collaboratorRows],
  );
  const splitReady = Math.abs(splitTotal - 100) < 0.001;
  const canSubmit = Boolean(sessionWalletAddress) && !submitting && splitReady;
  const issueText = useMemo(() => {
    if (!result?.issues?.length) return null;
    return result.issues.map((issue) => issue.message).join(" ");
  }, [result]);

  function updateForm(name: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateCollaborator(
    index: number,
    name: keyof CollaboratorFormRow,
    value: string,
  ) {
    setCollaborators((current) =>
      current.map((collaborator, collaboratorIndex) =>
        collaboratorIndex === index
          ? { ...collaborator, [name]: value }
          : collaborator,
      ),
    );
  }

  function addCollaboratorRow() {
    setCollaborators((current) => [
      ...current,
      {
        displayName: "",
        role: "",
        walletAddress: "",
        splitPercentage: "0",
      },
    ]);
  }

  function removeCollaboratorRow(index: number) {
    setCollaborators((current) =>
      current.length === 1
        ? current
        : current.filter((_, collaboratorIndex) => collaboratorIndex !== index),
    );
  }

  function updateResource(
    index: number,
    name: keyof ResourceFormRow,
    value: string,
  ) {
    setResources((current) =>
      current.map((resource, resourceIndex) =>
        resourceIndex === index ? { ...resource, [name]: value } : resource,
      ),
    );
  }

  function addResourceRow() {
    setResources((current) => [
      ...current,
      {
        title: "",
        description: "",
        type: "link",
        url: "",
        sortOrder: String(current.length + 1),
      },
    ]);
  }

  function removeResourceRow(index: number) {
    setResources((current) =>
      current.length === 1
        ? current
        : current.filter((_, resourceIndex) => resourceIndex !== index),
    );
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
        collaborators: collaboratorRows.map((collaborator) => ({
          ...collaborator,
          splitPercentage: Number(collaborator.splitPercentage),
        })),
        resources: resources.map((resource, index) => ({
          ...resource,
          sortOrder: Number(resource.sortOrder || index + 1),
        })),
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

      <div className="border border-line bg-panel p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-normal text-muted">
              Collaborators
            </p>
            <p className="mt-2 text-2xl font-semibold">Split {splitTotal}%</p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`inline-flex min-h-10 items-center gap-2 border px-3 text-sm font-medium ${
                splitReady
                  ? "border-accent text-accent"
                  : "border-coral text-coral"
              }`}
            >
              <Percent size={16} />
              100% required
            </div>
            <button
              className="inline-flex min-h-10 items-center gap-2 border border-line bg-background/40 px-3 text-sm font-medium transition hover:border-accent hover:text-accent"
              onClick={addCollaboratorRow}
              type="button"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3">
          {collaboratorRows.map((collaborator, index) => (
            <div
              className="grid gap-3 border border-line bg-background/35 p-3 lg:grid-cols-[1fr_0.8fr_1.5fr_0.45fr_auto]"
              key={`${collaborator.role}-${index}`}
            >
              <label className="grid gap-2">
                <span className="font-mono text-[11px] uppercase tracking-normal text-muted">
                  Name
                </span>
                <input
                  className={inputClass}
                  onChange={(event) =>
                    updateCollaborator(index, "displayName", event.target.value)
                  }
                  required
                  value={collaborator.displayName}
                />
              </label>
              <label className="grid gap-2">
                <span className="font-mono text-[11px] uppercase tracking-normal text-muted">
                  Role
                </span>
                <input
                  className={inputClass}
                  onChange={(event) =>
                    updateCollaborator(index, "role", event.target.value)
                  }
                  required
                  value={collaborator.role}
                />
              </label>
              <label className="grid gap-2">
                <span className="font-mono text-[11px] uppercase tracking-normal text-muted">
                  Wallet
                </span>
                <input
                  className={`${inputClass} font-mono text-xs`}
                  onChange={(event) =>
                    updateCollaborator(index, "walletAddress", event.target.value)
                  }
                  readOnly={index === 0 && Boolean(sessionWalletAddress)}
                  required
                  value={collaborator.walletAddress}
                />
              </label>
              <label className="grid gap-2">
                <span className="font-mono text-[11px] uppercase tracking-normal text-muted">
                  Split
                </span>
                <input
                  className={inputClass}
                  min="0"
                  onChange={(event) =>
                    updateCollaborator(
                      index,
                      "splitPercentage",
                      event.target.value,
                    )
                  }
                  required
                  step="0.01"
                  type="number"
                  value={collaborator.splitPercentage}
                />
              </label>
              <div className="flex items-end">
                <button
                  aria-label="Remove collaborator"
                  className="grid min-h-11 w-full place-items-center border border-line bg-panel text-muted transition hover:border-coral hover:text-coral lg:w-11"
                  onClick={() => removeCollaboratorRow(index)}
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-line bg-panel p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-normal text-muted">
              Resources
            </p>
            <p className="mt-2 text-2xl font-semibold">{resources.length} gated</p>
          </div>
          <button
            className="inline-flex min-h-10 items-center gap-2 border border-line bg-background/40 px-3 text-sm font-medium transition hover:border-accent hover:text-accent"
            onClick={addResourceRow}
            type="button"
          >
            <Plus size={16} />
            Add
          </button>
        </div>

        <div className="mt-5 grid gap-3">
          {resources.map((resource, index) => (
            <div
              className="grid gap-3 border border-line bg-background/35 p-3 lg:grid-cols-[1fr_0.8fr_1.3fr_0.4fr_auto]"
              key={`${resource.title}-${index}`}
            >
              <label className="grid gap-2">
                <span className="font-mono text-[11px] uppercase tracking-normal text-muted">
                  Title
                </span>
                <input
                  className={inputClass}
                  onChange={(event) =>
                    updateResource(index, "title", event.target.value)
                  }
                  required
                  value={resource.title}
                />
              </label>
              <label className="grid gap-2">
                <span className="font-mono text-[11px] uppercase tracking-normal text-muted">
                  Type
                </span>
                <select
                  className={inputClass}
                  onChange={(event) =>
                    updateResource(index, "type", event.target.value)
                  }
                  value={resource.type}
                >
                  <option value="link">Link</option>
                  <option value="file">File</option>
                  <option value="text">Text</option>
                </select>
              </label>
              <label className="grid gap-2">
                <span className="font-mono text-[11px] uppercase tracking-normal text-muted">
                  URL
                </span>
                <input
                  className={inputClass}
                  onChange={(event) =>
                    updateResource(index, "url", event.target.value)
                  }
                  type="url"
                  value={resource.url}
                />
              </label>
              <label className="grid gap-2">
                <span className="font-mono text-[11px] uppercase tracking-normal text-muted">
                  Order
                </span>
                <input
                  className={inputClass}
                  min="0"
                  onChange={(event) =>
                    updateResource(index, "sortOrder", event.target.value)
                  }
                  type="number"
                  value={resource.sortOrder}
                />
              </label>
              <div className="flex items-end">
                <button
                  aria-label="Remove resource"
                  className="grid min-h-11 w-full place-items-center border border-line bg-panel text-muted transition hover:border-coral hover:text-coral lg:w-11"
                  onClick={() => removeResourceRow(index)}
                  type="button"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <label className="grid gap-2 lg:col-span-5">
                <span className="font-mono text-[11px] uppercase tracking-normal text-muted">
                  Description
                </span>
                <input
                  className={inputClass}
                  onChange={(event) =>
                    updateResource(index, "description", event.target.value)
                  }
                  value={resource.description}
                />
              </label>
            </div>
          ))}
        </div>
      </div>

      {result?.event ? (
        <div className="grid grid-cols-[auto_1fr] items-center gap-3 border border-accent/60 bg-accent/10 p-4 text-sm">
          <CheckCircle2 className="text-accent" size={20} />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>
              Draft saved:{" "}
              <span className="font-medium">{result.event.title}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-muted">
              <Percent size={14} />
              {result.collaborators?.length ?? 0} collaborators
            </span>
            <span className="inline-flex items-center gap-1 text-muted">
              <FileKey2 size={14} />
              {result.resources?.length ?? 0} resources
            </span>
          </div>
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
