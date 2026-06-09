import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowLeft,
  ArrowRight,
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
import { eventCoverStyle, eventThemeStyle } from "@/lib/events/theme";

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
      <section
        className="border-b border-foreground/8"
        style={eventThemeStyle(event)}
      >
        <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent"
          >
            <ArrowLeft size={15} /> Back to event
          </Link>

          <div className="mt-6 overflow-hidden rounded-[8px] border border-foreground/10 bg-foreground/[0.045] shadow-[0_24px_90px_rgba(0,0,0,0.24)]">
            <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
              <div
                className="event-cover min-h-64 lg:min-h-[420px]"
                style={eventCoverStyle(event)}
              />
              <div className="flex flex-col justify-between p-5 lg:p-7">
                <div
                  className={`inline-flex min-h-8 w-fit items-center gap-2 rounded-full border px-3 text-xs font-semibold uppercase tracking-[0.1em] ${
                    hasAccess
                      ? "border-accent/45 bg-accent/10 text-accent"
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
                <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
                  {event.title}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
                  {hasAccess
                    ? "Connected wallet owns a Quorum pass for this event."
                    : "Connect the wallet that owns the event pass to unlock resources."}
                </p>
                <div className="mt-8 flex w-fit items-center gap-3 rounded-full border border-foreground/10 bg-background/32 px-4 py-3 text-sm text-muted">
                  {hasAccess ? (
                    <ShieldCheck className="text-accent" size={18} />
                  ) : (
                    <LockKeyhole className="text-coral" size={18} />
                  )}
                  {resources.length} resources
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {resources.map((resource) => (
            <div
              className="rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5"
              key={resource.id}
            >
              <FileKey2 className="text-accent" size={20} />
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                {resource.type}
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight">
                {resource.title}
              </p>
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
                      className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-foreground/10 px-4 text-sm transition hover:border-accent/45 hover:text-accent"
                    >
                      Open <ArrowRight size={14} />
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
          <div className="mt-5 rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3 text-muted">
                <LockKeyhole size={18} />
                <p className="text-sm">
                  One wallet can hold one non-transferable pass for this event.
                </p>
              </div>
              <Link
                href={`/events/${event.slug}/checkout`}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
              >
                Get pass <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </AppShell>
  );
}
