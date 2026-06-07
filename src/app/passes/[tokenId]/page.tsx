import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  BadgeCheck,
  FileKey2,
  Fingerprint,
  QrCode,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import type { EventRecord } from "@/lib/db/models";
import { getPassByTokenId, listResources } from "@/lib/events/repository";

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

function coverStyle(event: EventRecord) {
  const imageUrl =
    event.coverImageUrl ??
    "https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&w=1600&q=80";

  return {
    backgroundImage: `linear-gradient(135deg, rgba(16, 18, 15, 0.24), rgba(16, 18, 15, 0.82)), url("${imageUrl}")`,
  };
}

export default async function PassPage({ params }: PassPageProps) {
  const { tokenId } = await params;
  const proof = getPassByTokenId(decodeURIComponent(tokenId));

  if (!proof) {
    notFound();
  }

  const { event, pass, purchase } = proof;
  const resources = listResources(event.id);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8">
        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent"
        >
          <ArrowLeft size={15} /> Event
        </Link>

        <div className="mt-6 grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
          <div className="border border-line bg-panel p-5">
            <p className="font-mono text-xs uppercase tracking-normal text-accent">
              QuorumPassNFT
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight">
              Attendee pass
            </h1>
            <p className="mt-4 text-sm leading-6 text-muted">
              {event.title}
            </p>

            <div className="mt-6 grid gap-3">
              <div className="flex items-center gap-3 border border-line bg-background/35 p-3 text-sm text-muted">
                <WalletCards className="text-accent" size={17} />
                {shorten(pass.ownerWallet)}
              </div>
              <div className="flex items-center gap-3 border border-line bg-background/35 p-3 text-sm text-muted">
                <ShieldCheck className="text-accent" size={17} />
                {sourceLabel(pass.source)}
              </div>
              <div className="flex items-center gap-3 border border-line bg-background/35 p-3 text-sm text-muted">
                <Fingerprint className="text-accent" size={17} />
                {pass.checkedIn ? "Checked in" : "Not checked in"}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Link
                href={`/events/${event.slug}/resources`}
                className="inline-flex min-h-11 items-center justify-center gap-2 bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
              >
                Open resources <ArrowUpRight size={16} />
              </Link>
              <Link
                href={`/check-in/${event.id}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 border border-line bg-panel-strong px-4 text-sm font-semibold transition hover:border-accent hover:text-accent"
              >
                <QrCode size={16} /> Verify
              </Link>
            </div>
          </div>

          <div className="border border-line bg-panel-strong p-5">
            <div
              className="event-cover min-h-[430px] border border-line p-5"
              style={coverStyle(event)}
            >
              <div className="flex h-full flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <span className="border border-accent bg-accent px-2.5 py-1 font-mono text-xs font-semibold uppercase tracking-normal text-accent-ink">
                    Unique pass
                  </span>
                  <BadgeCheck className="text-accent" size={28} />
                </div>
                <div>
                  <p className="font-mono text-xs uppercase tracking-normal text-accent">
                    {pass.tokenId}
                  </p>
                  <h2 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight md:text-6xl">
                    {event.title}
                  </h2>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="border border-line bg-background/35 p-4">
                <p className="font-mono text-xs uppercase tracking-normal text-muted">
                  Mint tx
                </p>
                <p className="mt-2 break-all font-mono text-xs text-foreground">
                  {pass.mintTxHash ?? "Pending"}
                </p>
              </div>
              <div className="border border-line bg-background/35 p-4">
                <p className="font-mono text-xs uppercase tracking-normal text-muted">
                  Payment tx
                </p>
                <p className="mt-2 break-all font-mono text-xs text-foreground">
                  {purchase?.txHash ?? "Pending"}
                </p>
              </div>
              <div className="border border-line bg-background/35 p-4">
                <p className="font-mono text-xs uppercase tracking-normal text-muted">
                  Metadata
                </p>
                <p className="mt-2 break-all font-mono text-xs text-foreground">
                  {pass.metadataHash ?? "Pending"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 border border-line bg-panel p-5">
          <p className="font-mono text-xs uppercase tracking-normal text-muted">
            Included resources
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {resources.map((resource) => (
              <div
                className="border border-line bg-background/35 p-4"
                key={resource.id}
              >
                <FileKey2 className="text-accent" size={18} />
                <p className="mt-3 font-medium">{resource.title}</p>
                <p className="mt-2 font-mono text-xs uppercase tracking-normal text-muted">
                  {resource.type}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
