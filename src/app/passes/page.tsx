import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowUpRight,
  ArrowRight,
  BadgeCheck,
  ShieldCheck,
  TicketCheck,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  EmptyState,
  ProductPage,
  WalletGate,
} from "@/components/ui/product-layout";
import { CompactPageHeader, ProductSection } from "@/components/ui/product-primitives";
import { QuorumButton } from "@/components/ui/quorum-button";
import { StatusPill } from "@/components/ui/status-pill";
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
    ? await Promise.all(
        (await listPassesByOwner(session.walletAddress)).map(async (pass) => ({
          event: await getEventById(pass.eventId),
          pass,
        })),
      )
    : [];
  const checkedInCount = passEntries.filter(({ pass }) => pass.checkedIn).length;

  return (
    <AppShell>
      <ProductPage className="space-y-8" spacing="default">
        <CompactPageHeader
          actions={
            <QuorumButton href="/discover" icon={<ArrowUpRight size={16} />}>
              Browse events
            </QuorumButton>
          }
          description={
            session
              ? `Showing passes owned by ${shorten(session.walletAddress)}.`
              : "Connect wallet to view the passes owned by this browser session."
          }
          eyebrow="Event passes"
          icon={TicketCheck}
          meta={
            session ? (
              <p className="text-sm text-muted">
                {passEntries.length - checkedInCount} active · {checkedInCount} used
              </p>
            ) : null
          }
          title="Your event passes."
        />

        {passEntries.length > 0 ? (
          <ProductSection
            description="Open a pass to show its door QR, access status, and receipt evidence."
            eyebrow={`${passEntries.length} owned`}
            title="Ready for your next event"
          >
          <div className="grid gap-3 lg:grid-cols-2">
            {passEntries.map(({ event, pass }) => (
              <Link
                className="group grid overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.035] transition hover:border-quorum-cyan/45 hover:bg-white/[0.055] md:grid-cols-[0.42fr_0.58fr]"
                href={pass.tokenId ? `/passes/${pass.tokenId}` : "/passes"}
                key={pass.id}
                style={eventThemeStyle(event)}
              >
                <div
                  className="event-cover grid min-h-44 place-items-center border-b border-white/10 p-5 md:min-h-full md:border-b-0 md:border-r md:border-white/10"
                  style={eventCoverStyle(event)}
                >
                  <div className="grid h-16 w-16 place-items-center rounded-[10px] border border-quorum-cyan/35 bg-background/55 shadow-[0_0_42px_var(--event-glow)] backdrop-blur-xl transition group-hover:scale-105">
                    <BadgeCheck
                      className="text-quorum-cyan-soft"
                      size={38}
                      strokeWidth={1.35}
                    />
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    <StatusPill tone={pass.checkedIn ? "success" : "cyan"}>
                      {pass.checkedIn ? "Checked in" : "Active"}
                    </StatusPill>
                    <span className="rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 font-product text-xs text-muted">
                      {sourceLabel(pass.source)}
                    </span>
                  </div>
                  <h2 className="mt-4 font-product text-2xl font-medium leading-tight tracking-normal group-hover:text-quorum-cyan-soft">
                    {event.title}
                  </h2>
                  <p className="mt-3 text-sm text-muted">
                    {pass.checkedIn ? "Used for check-in. Receipt remains available." : "Show this pass at the door to check in."}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                    <span className="inline-flex items-center gap-2 text-xs text-muted">
                      <ShieldCheck size={14} /> Wallet-bound access
                    </span>
                    <span className="inline-flex items-center gap-2 text-sm text-quorum-cyan-soft">
                    Open receipt <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          </ProductSection>
        ) : !session ? (
          <WalletGate />
        ) : (
          <EmptyState
            action={<QuorumButton href="/discover">Browse events</QuorumButton>}
            description="Published events can issue one unique, non-transferable pass per wallet."
            icon={TicketCheck}
            title="No passes yet"
          />
        )}
      </ProductPage>
    </AppShell>
  );
}
