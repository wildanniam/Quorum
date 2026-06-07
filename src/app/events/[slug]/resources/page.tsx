import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowLeft,
  ArrowUpRight,
  FileKey2,
  LockKeyhole,
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
      <section className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-accent"
        >
          <ArrowLeft size={15} /> Event
        </Link>

        <div className="mt-6 border border-line bg-panel p-6">
          <p className="font-mono text-xs uppercase tracking-normal text-accent">
            Gated resources
          </p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-semibold leading-tight">
                {event.title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                {hasAccess
                  ? "Connected wallet owns a Quorum pass for this event."
                  : "Connect the wallet that owns the event pass to unlock resources."}
              </p>
            </div>
            <div className="flex items-center gap-3 border border-line bg-background/35 px-4 py-3 text-sm text-muted">
              {hasAccess ? (
                <UnlockKeyhole className="text-accent" size={18} />
              ) : (
                <LockKeyhole className="text-coral" size={18} />
              )}
              {hasAccess ? "Unlocked" : "Locked"}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {resources.map((resource) => (
            <div className="border border-line bg-panel p-5" key={resource.id}>
              <FileKey2 className="text-accent" size={20} />
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
                      className="mt-4 inline-flex min-h-10 items-center gap-2 border border-line px-4 text-sm transition hover:border-accent hover:text-accent"
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
          <div className="mt-5 border border-line bg-panel p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3 text-muted">
                <LockKeyhole size={18} />
                <p className="text-sm">
                  One wallet can hold one non-transferable pass for this event.
                </p>
              </div>
              <Link
                href={`/events/${event.slug}/checkout`}
                className="inline-flex min-h-10 items-center justify-center gap-2 bg-accent px-4 text-sm font-semibold text-accent-ink transition hover:bg-foreground"
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
