import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowLeft,
  ArrowUpRight,
  BanknoteArrowUp,
  CircleDollarSign,
  Handshake,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import {
  getCollaboratorLedgerSummary,
  listCollaboratorLedger,
} from "@/lib/ledger/repository";

export const dynamic = "force-dynamic";

function shorten(value: string) {
  return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function CollaboratorLedgerPage() {
  const cookieStore = await cookies();
  const session = readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  const entries = session
    ? await listCollaboratorLedger(session.walletAddress)
    : [];
  const summary = session
    ? await getCollaboratorLedgerSummary(session.walletAddress)
    : {
        entryCount: 0,
        eventCount: 0,
        totalEarnedUsdc: "0",
        totalWithdrawnUsdc: "0",
        withdrawableUsdc: "0",
      };

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent"
        >
          <ArrowLeft size={15} /> Back to Studio
        </Link>

        <div className="mt-6 rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-xl lg:p-6">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-accent/45 bg-accent/10 px-3 text-xs font-semibold uppercase tracking-[0.1em] text-accent">
                <Handshake size={14} />
                Collaborator ledger
              </div>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
                Credits and withdrawals, tied to proof.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
                {session
                  ? shorten(session.walletAddress)
                  : "Connect the collaborator wallet to see only its related event ledger."}
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-full border border-foreground/10 bg-background/32 px-4 py-3 text-sm text-muted">
              <WalletCards className="text-accent" size={18} />
              {summary.entryCount} ledger rows
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            {[
              {
                icon: CircleDollarSign,
                label: "earned",
                value: `${summary.totalEarnedUsdc} USDC`,
              },
              {
                icon: BanknoteArrowUp,
                label: "withdrawn",
                value: `${summary.totalWithdrawnUsdc} USDC`,
              },
              {
                icon: Handshake,
                label: "withdrawable",
                value: `${summary.withdrawableUsdc} USDC`,
              },
              {
                icon: WalletCards,
                label: "events",
                value: String(summary.eventCount),
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  className="rounded-[8px] border border-foreground/10 bg-background/32 p-4"
                  key={item.label}
                >
                  <Icon className="text-accent" size={18} />
                  <p className="mt-4 break-all font-mono text-xl text-foreground">
                    {item.value}
                  </p>
                  <p className="mt-2 text-sm text-muted">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {session ? (
          entries.length > 0 ? (
            <div className="mt-5 overflow-hidden rounded-[8px] border border-foreground/10">
              {entries.map((entry) => (
                <article
                  className="grid gap-4 border-b border-foreground/10 bg-foreground/[0.045] p-4 last:border-b-0 lg:grid-cols-[1fr_auto] lg:items-center"
                  key={entry.id}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-[6px] border border-foreground/10 bg-background/32 px-2.5 py-1 font-mono text-xs uppercase tracking-normal ${
                          entry.kind === "credit"
                            ? "text-success"
                            : "text-coral"
                        }`}
                      >
                        {entry.kind}
                      </span>
                      <span className="rounded-[6px] border border-foreground/10 bg-background/32 px-2.5 py-1 font-mono text-xs text-foreground">
                        {entry.amountUsdc} {entry.asset}
                      </span>
                      <span className="rounded-[6px] border border-foreground/10 bg-background/32 px-2.5 py-1 font-mono text-xs text-muted">
                        balance {entry.balanceAfterUsdc} USDC
                      </span>
                    </div>
                    <h2 className="mt-3 truncate text-lg font-semibold">
                      {entry.eventTitle}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {entry.sourceLabel} / {formatDate(entry.occurredAt)} UTC
                    </p>
                    <p className="mt-2 break-all font-mono text-xs leading-5 text-muted">
                      {entry.txHash ?? entry.sourceId}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <Link
                      className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full border border-foreground/10 px-3 text-sm text-muted transition hover:border-accent/45 hover:text-accent"
                      href={`/events/${entry.eventSlug}/proof`}
                    >
                      Proof <ArrowUpRight size={13} />
                    </Link>
                    {entry.explorerUrl ? (
                      <Link
                        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-full bg-accent px-3 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
                        href={entry.explorerUrl}
                        target="_blank"
                      >
                        Explorer <ArrowUpRight size={13} />
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-6">
              <Handshake className="text-accent" size={24} />
              <h2 className="mt-4 text-2xl font-semibold">
                No collaborator ledger yet
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                Checkout split credits and withdrawal debits will appear here
                when this wallet is a collaborator on a paid event.
              </p>
            </div>
          )
        ) : (
          <div className="mt-5 rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-6">
            <WalletCards className="text-accent" size={24} />
            <h2 className="mt-4 text-2xl font-semibold">
              Wallet session required
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              Connect the collaborator wallet to resolve its event relationships
              and ledger entries.
            </p>
          </div>
        )}
      </section>
    </AppShell>
  );
}
