import Link from "next/link";
import { cookies } from "next/headers";
import {
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

  return (
    <AppShell>
      <ProductPage>
        <ProductPageHeader
          actions={<QuorumButton href="/discover">Browse events</QuorumButton>}
          description={
            session
              ? shorten(session.walletAddress)
              : "Connect wallet to view the passes owned by this browser session."
          }
          eyebrow="Event passes"
          icon={TicketCheck}
          title="Your event passes."
        >
          <MetricTile
            className="max-w-xs"
            icon={WalletCards}
            label="passes"
            value={passEntries.length}
          />
        </ProductPageHeader>

        {passEntries.length > 0 ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {passEntries.map(({ event, pass }) => (
              <Link
                className="group grid overflow-hidden rounded-[8px] border border-foreground/10 bg-foreground/[0.045] transition hover:border-accent/45 hover:shadow-[0_18px_70px_rgba(0,0,0,0.28)] md:grid-cols-[0.72fr_1.28fr]"
                href={pass.tokenId ? `/passes/${pass.tokenId}` : "/passes"}
                key={pass.id}
                style={eventThemeStyle(event)}
              >
                <div
                  className="event-cover grid min-h-56 place-items-center border-b border-foreground/10 p-5 md:border-b-0 md:border-r"
                  style={eventCoverStyle(event)}
                >
                  <BadgeCheck
                    className="text-accent drop-shadow-[0_0_24px_var(--event-glow)] transition group-hover:scale-105"
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
                  <h2 className="mt-5 text-3xl font-semibold leading-tight tracking-tight group-hover:text-accent">
                    {event.title}
                  </h2>
                  <p className="mt-3 break-all font-mono text-xs leading-5 text-muted">
                    {pass.tokenId}
                  </p>
                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-[8px] border border-foreground/10 bg-background/32 p-3">
                      <ShieldCheck className="text-accent" size={17} />
                      <p className="mt-2 text-xs text-muted">
                        Non-transferable
                      </p>
                    </div>
                    <div className="rounded-[8px] border border-foreground/10 bg-background/32 p-3">
                      <FileKey2 className="text-accent" size={17} />
                      <p className="mt-2 text-xs text-muted">Resource access</p>
                    </div>
                  </div>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm text-accent">
                    Open pass <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : !session ? (
          <WalletGate className="mt-5" />
        ) : (
          <EmptyState
            action={<QuorumButton href="/discover">Browse events</QuorumButton>}
            className="mt-5"
            description="Published events can issue one unique, non-transferable pass per wallet."
            icon={TicketCheck}
            title="No passes yet"
          />
        )}
      </ProductPage>
    </AppShell>
  );
}
