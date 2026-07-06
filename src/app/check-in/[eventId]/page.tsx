import Link from "next/link";
import { ArrowLeft, BadgeCheck, QrCode, TicketCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CheckInPanel } from "@/components/events/check-in-panel";
import { ProofDisplay } from "@/components/proof-display";
import { ProofSurface } from "@/components/ui/proof-surface";
import { StatusPill } from "@/components/ui/status-pill";
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
  searchParams?: Promise<{
    token?: string | string[];
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

function firstQueryValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? null;

  return value ?? null;
}

export default async function CheckInPage({
  params,
  searchParams,
}: CheckInPageProps) {
  const { eventId } = await params;
  const query = searchParams ? await searchParams : {};
  const initialTokenId = firstQueryValue(query.token);
  const event = await getEventOrNull(eventId);

  if (!event || event.status !== "published") {
    notFound();
  }

  const metrics = await getEventDashboardMetrics(event.id);
  const recentCheckIns = (await listCheckInsForEvent(event.id)).slice(0, 5);

  return (
    <AppShell>
      <section
        className="quorum-proof-shell border-b border-white/10"
        style={eventThemeStyle(event)}
      >
        <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8 lg:py-12">
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-quorum-cyan-soft"
          >
            <ArrowLeft size={15} /> Back to event
          </Link>

          <div className="mt-6 grid gap-5 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <ProofSurface className="quorum-cyan-ring lg:p-6" elevated>
              <StatusPill icon={QrCode} tone="cyan">
                Organizer check-in
              </StatusPill>
              <h1 className="mt-4 font-product text-3xl font-medium leading-[1.08] tracking-normal md:text-6xl">
                {event.title}
              </h1>
              <p className="mt-3 text-sm leading-6 text-muted">
                Verify a Quorum pass at the door. Pass QR links can pre-fill
                the token field for faster check-in.
                <span className="hidden sm:inline">
                  {" "}
                  Local proof records now and maps to QuorumCore check-in once
                  live contract IDs are configured.
                </span>
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-[12px] border border-white/10 bg-white/[0.035] p-3 sm:p-4">
                  <p className="font-mono text-3xl text-quorum-cyan-soft">
                    {metrics.checkedInCount}
                  </p>
                  <p className="mt-2 text-sm text-muted">Checked in</p>
                </div>
                <div className="rounded-[12px] border border-white/10 bg-white/[0.035] p-3 sm:p-4">
                  <p className="font-mono text-3xl text-cyan">
                    {metrics.passCount}
                  </p>
                  <p className="mt-2 text-sm text-muted">Passes minted</p>
                </div>
              </div>
            </ProofSurface>

            <div className="grid gap-5">
              <CheckInPanel eventId={event.id} initialTokenId={initialTokenId} />

              <div className="grid gap-4 md:grid-cols-[0.72fr_1.28fr]">
                <div className="grid min-h-56 place-items-center rounded-[16px] border border-quorum-cyan/24 bg-quorum-grey-800">
                  <QrCode
                    className="text-quorum-cyan-soft"
                    size={92}
                    strokeWidth={1.3}
                  />
                </div>
                <ProofSurface className="p-5">
                  <BadgeCheck className="text-quorum-cyan-soft" size={22} />
                  <p className="mt-4 font-product text-2xl font-medium">
                    QR links pre-fill the token.
                  </p>
                  <p className="mt-3 font-mono text-sm text-muted">
                    /check-in/{event.id}?token=qpass...
                  </p>
                  <Link
                    href="/dashboard"
                    className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-4 text-sm transition hover:border-quorum-cyan/45 hover:text-quorum-cyan-soft"
                  >
                    Dashboard
                  </Link>
                </ProofSurface>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <ProofSurface>
          <StatusPill icon={TicketCheck} tone="muted">
            Recent check-ins
          </StatusPill>
          <div className="mt-5 grid gap-3">
            {recentCheckIns.length > 0 ? (
              recentCheckIns.map((checkIn) => (
                <div
                  className="grid gap-3 rounded-[12px] border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[auto_1fr_auto]"
                  key={checkIn.id}
                >
                  <TicketCheck className="text-quorum-cyan-soft" size={18} />
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
              <div className="rounded-[12px] border border-white/10 bg-white/[0.035] p-4 text-sm leading-6 text-muted">
                No check-ins recorded yet.
              </div>
            )}
          </div>
        </ProofSurface>
      </section>
    </AppShell>
  );
}
