import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowUpRight,
  BadgeCheck,
  FileKey2,
  ShieldCheck,
  TicketCheck,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import { getEventById, listPassesByOwner } from "@/lib/events/repository";
import { eventCoverStyle, eventThemeStyle } from "@/lib/events/theme";

export const dynamic = "force-dynamic";

function shorten(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function sourceLabel(source: string) {
  return source === "free_claim" ? "Free claim" : "Purchase";
}

export default async function PassesPage() {
  const cookieStore = await cookies();
  const session = readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  const passEntries = session
    ? listPassesByOwner(session.walletAddress).map((pass) => ({
        event: getEventById(pass.eventId),
        pass,
      }))
    : [];

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="rounded-[8px] border border-line bg-panel/88 p-5 shadow-[0_20px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:p-6">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <div className="inline-flex min-h-8 items-center gap-2 rounded-[8px] border border-accent/45 bg-accent/10 px-3 font-mono text-xs font-semibold uppercase tracking-normal text-accent">
                <TicketCheck size={14} />
                Event passes
              </div>
              <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-6xl">
                My Quorum passes
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
                {session
                  ? shorten(session.walletAddress)
                  : "Connect wallet to view owned event passes."}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-[8px] border border-line bg-background/32 px-4 py-3 text-sm text-muted">
              <WalletCards className="text-accent" size={18} />
              {passEntries.length} passes
            </div>
          </div>
        </div>

        {passEntries.length > 0 ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {passEntries.map(({ event, pass }) => (
              <Link
                className="group grid overflow-hidden rounded-[8px] border border-line bg-panel transition hover:border-event-accent hover:shadow-[0_18px_70px_rgba(0,0,0,0.28)] md:grid-cols-[0.72fr_1.28fr]"
                href={pass.tokenId ? `/passes/${pass.tokenId}` : "/passes"}
                key={pass.id}
                style={eventThemeStyle(event)}
              >
                <div
                  className="event-cover grid min-h-56 place-items-center border-b border-line p-5 md:border-b-0 md:border-r"
                  style={eventCoverStyle(event)}
                >
                  <BadgeCheck
                    className="text-event-accent drop-shadow-[0_0_24px_var(--event-glow)] transition group-hover:scale-105"
                    size={72}
                    strokeWidth={1.35}
                  />
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-[6px] border border-line px-2.5 py-1 font-mono text-xs text-muted">
                      {sourceLabel(pass.source)}
                    </span>
                    <span className="rounded-[6px] border border-line px-2.5 py-1 font-mono text-xs text-muted">
                      {pass.checkedIn ? "Checked in" : "Active"}
                    </span>
                  </div>
                  <h2 className="mt-5 text-3xl font-semibold leading-tight group-hover:text-event-accent">
                    {event.title}
                  </h2>
                  <p className="mt-3 break-all font-mono text-xs leading-5 text-muted">
                    {pass.tokenId}
                  </p>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-[8px] border border-line bg-background/32 p-3">
                      <ShieldCheck className="text-event-accent" size={17} />
                      <p className="mt-2 text-xs text-muted">
                        Non-transferable
                      </p>
                    </div>
                    <div className="rounded-[8px] border border-line bg-background/32 p-3">
                      <FileKey2 className="text-event-accent" size={17} />
                      <p className="mt-2 text-xs text-muted">Resource access</p>
                    </div>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm text-event-accent">
                    Open pass <ArrowUpRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[8px] border border-line bg-panel p-6">
            <TicketCheck className="text-accent" size={24} />
            <h2 className="mt-4 text-2xl font-semibold">
              {session ? "No passes yet" : "Wallet session required"}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Published events can issue one unique, non-transferable pass per
              wallet.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-[8px] bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
            >
              Browse marketplace <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
      </section>
    </AppShell>
  );
}
