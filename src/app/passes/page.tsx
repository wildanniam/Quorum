import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowUpRight,
  ArrowRight,
  BadgeCheck,
  FileKey2,
  ShieldCheck,
  TicketCheck,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  EmptyState,
  MetricTile,
  ProductPage,
  ProductPageHeader,
  WalletGate,
} from "@/components/ui/product-layout";
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
      <ProductPage className="space-y-5">
        <ProductPageHeader
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
          title="Wallet-bound passes and receipts."
        >
          <div className="grid gap-3 md:grid-cols-3">
            <MetricTile
              icon={WalletCards}
              label="owned passes"
              value={passEntries.length}
            />
            <MetricTile
              icon={BadgeCheck}
              label="active"
              tone="success"
              value={passEntries.length - checkedInCount}
            />
            <MetricTile
              icon={ShieldCheck}
              label="checked in"
              value={checkedInCount}
            />
          </div>
        </ProductPageHeader>

        {passEntries.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {passEntries.map(({ event, pass }) => (
              <Link
                className="group grid overflow-hidden rounded-[12px] border border-white/10 bg-quorum-grey-700/76 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition hover:border-quorum-cyan/45 hover:shadow-[0_24px_90px_rgba(0,0,0,0.32)] md:grid-cols-[0.72fr_1.28fr]"
                href={pass.tokenId ? `/passes/${pass.tokenId}` : "/passes"}
                key={pass.id}
                style={eventThemeStyle(event)}
              >
                <div
                  className="event-cover grid min-h-56 place-items-center border-b border-white/10 p-5 md:border-b-0 md:border-r md:border-white/10"
                  style={eventCoverStyle(event)}
                >
                  <div className="grid h-24 w-24 place-items-center rounded-[24px] border border-quorum-cyan/35 bg-background/55 shadow-[0_0_60px_var(--event-glow)] backdrop-blur-xl transition group-hover:scale-105">
                    <BadgeCheck
                      className="text-quorum-cyan-soft"
                      size={58}
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
                  <h2 className="mt-5 font-product text-3xl font-medium leading-tight tracking-normal group-hover:text-quorum-cyan-soft">
                    {event.title}
                  </h2>
                  <div className="mt-4 rounded-[12px] border border-white/10 bg-background/36 p-3">
                    <p className="font-product text-xs text-muted">Token ID</p>
                    <p className="mt-2 break-all font-mono text-xs leading-5 text-quorum-cyan-soft">
                      {pass.tokenId ?? pass.id}
                    </p>
                  </div>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-[10px] border border-white/10 bg-white/[0.035] p-3">
                      <ShieldCheck className="text-quorum-cyan-soft" size={17} />
                      <p className="mt-2 text-xs text-muted">
                        Non-transferable
                      </p>
                    </div>
                    <div className="rounded-[10px] border border-white/10 bg-white/[0.035] p-3">
                      <FileKey2 className="text-quorum-cyan-soft" size={17} />
                      <p className="mt-2 text-xs text-muted">Resource access</p>
                    </div>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm text-quorum-cyan-soft">
                    Open receipt <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
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
