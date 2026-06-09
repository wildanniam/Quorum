import Link from "next/link";
import { ArrowLeft, BadgeCheck, QrCode, TicketCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CheckInPanel } from "@/components/events/check-in-panel";
import { ProofDisplay } from "@/components/proof-display";
import {
  getEventById,
  getEventDashboardMetrics,
  listCheckInsForEvent,
} from "@/lib/events/repository";
import { eventThemeStyle } from "@/lib/events/theme";

type CheckInPageProps = {
  params: Promise<{
    eventId: string;
  }>;
};

export const dynamic = "force-dynamic";

async function getEventOrNull(eventId: string) {
  try {
    return await getEventById(eventId);
  } catch {
    return null;
  }
}

function shorten(value: string) {
  if (value.length <= 18) return value;
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export default async function CheckInPage({ params }: CheckInPageProps) {
  const { eventId } = await params;
  const event = await getEventOrNull(eventId);

  if (!event || event.status !== "published") {
    notFound();
  }

  const metrics = await getEventDashboardMetrics(event.id);
  const recentCheckIns = (await listCheckInsForEvent(event.id)).slice(0, 5);

  return (
    <AppShell>
      <section className="border-b border-line/70" style={eventThemeStyle(event)}>
        <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8 lg:py-12">
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-event-accent"
          >
            <ArrowLeft size={15} /> Back to event
          </Link>

          <div className="mt-6 grid gap-5 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <div className="rounded-[8px] border border-line bg-panel/88 p-4 shadow-[0_20px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:p-6">
              <p className="eyebrow">Organizer check-in</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight md:text-6xl">
                {event.title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted">
                Verify a Quorum pass at the door.
                <span className="hidden sm:inline">
                  {" "}
                  Local proof records now and maps to QuorumCore check-in once
                  live contract IDs are configured.
                </span>
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-[8px] border border-line bg-background/32 p-3 sm:p-4">
                  <p className="font-mono text-3xl text-event-accent">
                    {metrics.checkedInCount}
                  </p>
                  <p className="mt-2 text-sm text-muted">Checked in</p>
                </div>
                <div className="rounded-[8px] border border-line bg-background/32 p-3 sm:p-4">
                  <p className="font-mono text-3xl text-cyan">
                    {metrics.passCount}
                  </p>
                  <p className="mt-2 text-sm text-muted">Passes minted</p>
                </div>
              </div>
            </div>

            <div className="grid gap-5">
              <CheckInPanel eventId={event.id} />

              <div className="grid gap-4 md:grid-cols-[0.72fr_1.28fr]">
                <div className="grid min-h-56 place-items-center rounded-[8px] border border-line bg-panel">
                  <QrCode
                    className="text-event-accent"
                    size={92}
                    strokeWidth={1.3}
                  />
                </div>
                <div className="rounded-[8px] border border-line bg-panel p-5">
                  <BadgeCheck className="text-event-accent" size={22} />
                  <p className="mt-4 text-2xl font-semibold">
                    Valid pass format
                  </p>
                  <p className="mt-3 font-mono text-sm text-muted">
                    QuorumPassNFT / one event / one owner wallet
                  </p>
                  <Link
                    href="/dashboard"
                    className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[8px] border border-line px-4 text-sm transition hover:border-event-accent hover:text-event-accent"
                  >
                    Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="rounded-[8px] border border-line bg-panel p-5">
          <p className="eyebrow">Recent check-ins</p>
          <div className="mt-5 grid gap-3">
            {recentCheckIns.length > 0 ? (
              recentCheckIns.map((checkIn) => (
                <div
                  className="grid gap-3 rounded-[8px] border border-line bg-background/32 p-4 md:grid-cols-[auto_1fr_auto]"
                  key={checkIn.id}
                >
                  <TicketCheck className="text-event-accent" size={18} />
                  <div>
                    <p className="break-all font-mono text-sm">
                      {checkIn.tokenId}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      owner {shorten(checkIn.ownerWallet)}
                    </p>
                  </div>
                  <ProofDisplay
                    align="right"
                    className="md:min-w-64"
                    compact
                    label="Check-in proof"
                    value={checkIn.txHash}
                  />
                </div>
              ))
            ) : (
              <div className="rounded-[8px] border border-line bg-background/32 p-4 text-sm leading-6 text-muted">
                No check-ins recorded yet.
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
