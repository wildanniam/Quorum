import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowUpRight, BadgeCheck, TicketCheck, WalletCards } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import { getEventById, listPassesByOwner } from "@/lib/events/repository";

export const dynamic = "force-dynamic";

function shorten(address: string) {
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
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
      <section className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <div className="border border-line bg-panel p-6">
          <p className="font-mono text-xs uppercase tracking-normal text-accent">
            Event passes
          </p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold leading-tight">
                My Quorum passes
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                {session
                  ? shorten(session.walletAddress)
                  : "Connect wallet to view owned event passes."}
              </p>
            </div>
            <div className="flex items-center gap-3 border border-line bg-background/35 px-4 py-3 text-sm text-muted">
              <WalletCards className="text-accent" size={18} />
              {passEntries.length} passes
            </div>
          </div>
        </div>

        {passEntries.length > 0 ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {passEntries.map(({ event, pass }) => (
              <Link
                className="group grid border border-line bg-panel transition hover:border-accent md:grid-cols-[0.72fr_1.28fr]"
                href={pass.tokenId ? `/passes/${pass.tokenId}` : "/passes"}
                key={pass.id}
              >
                <div className="grid min-h-52 place-items-center border-b border-line bg-background/35 md:border-b-0 md:border-r">
                  <BadgeCheck
                    className="text-accent transition group-hover:scale-105"
                    size={70}
                    strokeWidth={1.3}
                  />
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="border border-line px-2.5 py-1 font-mono text-xs text-muted">
                      {pass.source === "free_claim" ? "Free claim" : "Purchase"}
                    </span>
                    <span className="border border-line px-2.5 py-1 font-mono text-xs text-muted">
                      {pass.checkedIn ? "Checked in" : "Active"}
                    </span>
                  </div>
                  <h2 className="mt-5 text-3xl font-semibold leading-tight">
                    {event.title}
                  </h2>
                  <p className="mt-3 break-all font-mono text-xs text-muted">
                    {pass.tokenId}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm text-accent">
                    Open pass <ArrowUpRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 border border-line bg-panel p-6">
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
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
            >
              Browse marketplace <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
      </section>
    </AppShell>
  );
}
