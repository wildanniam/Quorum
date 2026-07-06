import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  FileKey2,
  Fingerprint,
  QrCode,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ProofDisplay } from "@/components/proof-display";
import { getPassByTokenId, listResources } from "@/lib/events/repository";
import { eventCoverStyle, eventThemeStyle } from "@/lib/events/theme";

type PassPageProps = {
  params: Promise<{
    tokenId: string;
  }>;
};

export const dynamic = "force-dynamic";

function shorten(value: string) {
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function sourceLabel(source: string) {
  return source === "free_claim" ? "Free claim" : "Purchase";
}

export default async function PassPage({ params }: PassPageProps) {
  const { tokenId } = await params;
  const proof = await getPassByTokenId(decodeURIComponent(tokenId));

  if (!proof) {
    notFound();
  }

  const { event, pass, purchase } = proof;
  const resources = await listResources(event.id);

  return (
    <AppShell>
      <section
        className="border-b border-foreground/8"
        style={eventThemeStyle(event)}
      >
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
          <Link
            href="/passes"
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent"
          >
            <ArrowLeft size={15} /> Back to passes
          </Link>

          <div className="mt-6 grid gap-5 lg:grid-cols-[390px_minmax(0,1fr)] lg:items-start">
            <aside className="rounded-[8px] border border-foreground/10 bg-background/84 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl">
              <p className="eyebrow">Event access</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">
                Attendee pass
              </h1>
              <p className="mt-4 text-sm leading-6 text-muted">{event.title}</p>

              <div className="mt-6 grid gap-3">
                <div className="flex items-center gap-3 rounded-[8px] border border-foreground/10 bg-foreground/[0.035] p-3 text-sm text-muted">
                  <WalletCards className="text-accent" size={17} />
                  {shorten(pass.ownerWallet)}
                </div>
                <div className="flex items-center gap-3 rounded-[8px] border border-foreground/10 bg-foreground/[0.035] p-3 text-sm text-muted">
                  <ShieldCheck className="text-accent" size={17} />
                  {sourceLabel(pass.source)}
                </div>
                <div className="flex items-center gap-3 rounded-[8px] border border-foreground/10 bg-foreground/[0.035] p-3 text-sm text-muted">
                  <Fingerprint className="text-accent" size={17} />
                  {pass.checkedIn ? "Checked in" : "Not checked in"}
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <Link
                  href={`/events/${event.slug}/resources`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
                >
                  Open resources <ArrowRight size={16} />
                </Link>
                <Link
                  href={`/check-in/${event.id}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.045] px-4 text-sm font-semibold transition hover:border-accent/45 hover:text-accent"
                >
                  <QrCode size={16} /> Verify check-in
                </Link>
              </div>
            </aside>

            <article className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5">
              <div
                className="event-cover min-h-[500px] p-5 lg:p-6"
                style={eventCoverStyle(event)}
              >
                <div className="flex h-full flex-col justify-between gap-10">
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-ink">
                      Unique pass
                    </span>
                    <BadgeCheck className="text-accent" size={28} />
                  </div>
                  <div>
                    <p className="max-w-2xl break-all font-mono text-xs text-accent">
                      {pass.tokenId}
                    </p>
                    <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
                      {event.title}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <ProofDisplay label="Mint tx" value={pass.mintTxHash} />
                <ProofDisplay label="Payment tx" value={purchase?.txHash} />
                <ProofDisplay label="Metadata" value={pass.metadataHash} />
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5">
          <div className="grid gap-4 md:grid-cols-[0.7fr_1.3fr] md:items-start">
            <div>
              <p className="eyebrow">Included resources</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight">
                This pass unlocks the event material.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Resource access is tied to the connected wallet that owns this
                pass.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {resources.map((resource) => (
                <div
                  className="rounded-[8px] border border-foreground/10 bg-background/32 p-4"
                  key={resource.id}
                >
                  <FileKey2 className="text-accent" size={18} />
                  <p className="mt-3 font-medium">{resource.title}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                    {resource.type}
                  </p>
                  {resource.description ? (
                    <p className="mt-2 text-xs leading-5 text-muted">
                      {resource.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
