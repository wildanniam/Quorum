import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowLeft,
  ArrowUpRight,
  FileKey2,
  LockKeyhole,
  ShieldCheck,
  UnlockKeyhole,
} from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { SESSION_COOKIE, readSessionToken } from "@/lib/auth/session";
import {
  getEventBySlug,
  getPassByEventAndOwner,
  listResources,
} from "@/lib/events/repository";
import { eventThemeStyle } from "@/lib/events/theme";

type ResourcesPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function ResourcesPage({ params }: ResourcesPageProps) {
  const { slug } = await params;
  const event = getEventBySlug(slug);

  if (!event || event.status !== "published") {
    notFound();
  }

  const cookieStore = await cookies();
  const session = readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  const pass = session
    ? getPassByEventAndOwner(event.id, session.walletAddress)
    : null;
  const hasAccess = Boolean(pass);
  const resources = listResources(event.id);

  return (
    <AppShell>
      <section className="border-b border-line/70" style={eventThemeStyle(event)}>
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-event-accent"
          >
            <ArrowLeft size={15} /> Back to event
          </Link>

          <div className="mt-6 rounded-[8px] border border-line bg-panel/88 p-5 shadow-[0_20px_90px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:p-6">
            <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
              <div>
                <div
                  className={`inline-flex min-h-8 items-center gap-2 rounded-[8px] border px-3 font-mono text-xs font-semibold uppercase tracking-normal ${
                    hasAccess
                      ? "border-event-accent/45 bg-event-accent/10 text-event-accent"
                      : "border-coral/45 bg-coral/10 text-coral"
                  }`}
                >
                  {hasAccess ? (
                    <UnlockKeyhole size={14} />
                  ) : (
                    <LockKeyhole size={14} />
                  )}
                  {hasAccess ? "Unlocked" : "Locked"}
                </div>
                <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
                  {event.title}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
                  {hasAccess
                    ? "Connected wallet owns a Quorum pass for this event."
                    : "Connect the wallet that owns the event pass to unlock resources."}
                </p>
              </div>
              <div className="flex items-center gap-3 rounded-[8px] border border-line bg-background/32 px-4 py-3 text-sm text-muted">
                {hasAccess ? (
                  <ShieldCheck className="text-event-accent" size={18} />
                ) : (
                  <LockKeyhole className="text-coral" size={18} />
                )}
                {resources.length} resources
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="grid gap-4 md:grid-cols-3">
          {resources.map((resource) => (
            <div className="rounded-[8px] border border-line bg-panel p-5" key={resource.id}>
              <FileKey2 className="text-event-accent" size={20} />
              <p className="mt-4 font-mono text-xs uppercase tracking-normal text-muted">
                {resource.type}
              </p>
              <p className="mt-2 text-lg font-semibold">{resource.title}</p>
              {hasAccess ? (
                <>
                  {resource.description ? (
                    <p className="mt-3 text-sm leading-6 text-muted">
                      {resource.description}
                    </p>
                  ) : null}
                  {resource.url ? (
                    <Link
                      href={resource.url}
                      className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-[8px] border border-line px-4 text-sm transition hover:border-event-accent hover:text-event-accent"
                    >
                      Open <ArrowUpRight size={14} />
                    </Link>
                  ) : null}
                </>
              ) : (
                <p className="mt-3 text-sm leading-6 text-muted">
                  Requires this event pass.
                </p>
              )}
            </div>
          ))}
        </div>

        {!hasAccess ? (
          <div className="mt-5 rounded-[8px] border border-line bg-panel p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3 text-muted">
                <LockKeyhole size={18} />
                <p className="text-sm">
                  One wallet can hold one non-transferable pass for this event.
                </p>
              </div>
              <Link
                href={`/events/${event.slug}/checkout`}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[8px] bg-event-accent px-4 text-sm font-semibold text-event-ink transition hover:bg-foreground"
              >
                Get pass <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
