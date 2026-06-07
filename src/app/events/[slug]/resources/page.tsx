import Link from "next/link";
import { LockKeyhole, UnlockKeyhole } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { demoEvent } from "@/lib/demo-data";

export default function ResourcesPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        <div className="border border-line bg-panel p-6">
          <p className="font-mono text-xs uppercase tracking-normal text-accent">
            Gated resources
          </p>
          <h1 className="mt-2 text-4xl font-semibold">{demoEvent.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            This page will unlock after contract ownership confirms the connected
            wallet holds the event pass NFT.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {demoEvent.resources.map((resource) => (
            <div className="border border-line bg-panel p-5" key={resource.title}>
              <UnlockKeyhole className="text-accent" size={20} />
              <p className="mt-4 font-mono text-xs text-muted">
                {resource.type}
              </p>
              <p className="mt-2 text-lg font-semibold">{resource.title}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 border border-line bg-panel p-5">
          <div className="flex items-center gap-3 text-muted">
            <LockKeyhole size={18} />
            <p className="text-sm">
              Non-owner wallets will see a locked state and a path back to the
              event checkout.
            </p>
          </div>
          <Link
            href={`/events/${demoEvent.slug}`}
            className="mt-4 inline-flex min-h-10 items-center border border-line px-4 text-sm transition hover:border-accent hover:text-accent"
          >
            Event page
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
