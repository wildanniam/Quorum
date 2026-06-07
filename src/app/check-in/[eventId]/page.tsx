import Link from "next/link";
import { BadgeCheck, QrCode, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { demoEvent } from "@/lib/demo-data";

export default function CheckInPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="border border-line bg-panel p-6">
            <p className="font-mono text-xs uppercase tracking-normal text-accent">
              Check-in
            </p>
            <h1 className="mt-2 text-4xl font-semibold">{demoEvent.title}</h1>
            <p className="mt-4 text-sm leading-6 text-muted">
              Organizer verification records attendance status in QuorumCore.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="border border-line bg-background/35 p-4">
                <p className="font-mono text-3xl text-accent">
                  {demoEvent.checkedIn}
                </p>
                <p className="mt-2 text-sm text-muted">Checked in</p>
              </div>
              <div className="border border-line bg-background/35 p-4">
                <p className="font-mono text-3xl text-cyan">{demoEvent.sold}</p>
                <p className="mt-2 text-sm text-muted">Passes minted</p>
              </div>
            </div>
          </div>

          <div className="border border-line bg-panel p-5">
            <div className="flex items-center gap-3 border border-line bg-background/35 p-4">
              <Search className="text-accent" size={18} />
              <div className="h-6 flex-1 border-b border-line" />
              <span className="font-mono text-xs text-muted">token #012</span>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-[0.72fr_1.28fr]">
              <div className="grid min-h-56 place-items-center border border-line bg-background/35">
                <QrCode className="text-accent" size={92} strokeWidth={1.3} />
              </div>
              <div className="border border-line bg-background/35 p-5">
                <BadgeCheck className="text-accent" size={22} />
                <p className="mt-4 text-2xl font-semibold">Valid event pass</p>
                <p className="mt-3 font-mono text-sm text-muted">
                  QuorumPassNFT · token #012 · GDQO...7N2K
                </p>
                <button className="mt-5 inline-flex min-h-11 w-full items-center justify-center bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground">
                  Mark checked in
                </button>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="mt-5 inline-flex min-h-10 items-center border border-line px-4 text-sm transition hover:border-accent hover:text-accent"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
