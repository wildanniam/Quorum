import Link from "next/link";
import { cookies } from "next/headers";
import {
  ArrowLeft,
  ArrowRight,
  FileKey2,
  LockKeyhole,
  ShieldCheck,
  TicketCheck,
  UnlockKeyhole,
  WalletCards,
} from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import {
  EmptyState,
  ProductPage,
} from "@/components/ui/product-layout";
import {
  CompactPageHeader,
  DataRow,
  ProductSection,
  TaskPanel,
} from "@/components/ui/product-primitives";
import { QuorumButton } from "@/components/ui/quorum-button";
import { StatusPill } from "@/components/ui/status-pill";
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
  const event = await getEventBySlug(slug);

  if (!event || event.status !== "published") {
    notFound();
  }

  const cookieStore = await cookies();
  const session = readSessionToken(cookieStore.get(SESSION_COOKIE)?.value);
  const pass = session
    ? await getPassByEventAndOwner(event.id, session.walletAddress)
    : null;
  const hasAccess = Boolean(pass);
  const resources = await listResources(event.id);
  const accessTitle = hasAccess
    ? "Resources unlocked"
    : session
      ? "This wallet does not own the pass"
      : "Connect the pass wallet";
  const accessDescription = hasAccess
    ? "The connected wallet owns a Quorum pass for this event. Private links and files can be opened below."
    : session
      ? "You are connected, but this wallet does not hold the non-transferable pass for this event. Switch to the wallet that bought or claimed the pass."
      : "Connect the wallet that owns this event pass to reveal gated resources.";

  return (
    <AppShell>
      <ProductPage className="space-y-7" spacing="default">
        <Link
          className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-quorum-cyan-soft"
          href={`/events/${event.slug}`}
        >
          <ArrowLeft size={15} /> Back to event
        </Link>

        <CompactPageHeader
          actions={
            hasAccess ? (
              <StatusPill icon={UnlockKeyhole} tone="success">
                UNLOCKED
              </StatusPill>
            ) : (
              <>
                <StatusPill icon={LockKeyhole} tone="blocked">
                  LOCKED
                </StatusPill>
                <QuorumButton href={`/events/${event.slug}/checkout`}>
                  Get pass
                </QuorumButton>
              </>
            )
          }
          description={accessDescription}
          eyebrow="Resources"
          icon={hasAccess ? UnlockKeyhole : LockKeyhole}
          title={accessTitle}
        />

        <TaskPanel tone={hasAccess ? "ready" : "muted"}>
          <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div
              className="event-cover min-h-48 rounded-[6px] bg-cover bg-center lg:min-h-[260px]"
              style={eventCoverStyle(event)}
            />
            <div>
              <p className="text-sm font-medium text-foreground">{event.title}</p>
              <div className="mt-3">
                {[
                  {
                    icon: FileKey2,
                    label: "resources",
                    value: resources.length,
                  },
                  {
                    icon: WalletCards,
                    label: "wallet",
                    value: session ? "Connected" : "Connect",
                  },
                  {
                    icon: TicketCheck,
                    label: "pass",
                    value: hasAccess ? "Verified" : "Locked",
                  },
                ].map((item) => {
                  const Icon = item.icon;

                  return (
                    <DataRow
                      icon={Icon}
                      key={item.label}
                      label={item.label}
                      value={item.value}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </TaskPanel>
      </ProductPage>

      <ProductPage spacing="default">
        <ProductSection
          description="Resources stay listed so attendees know what the pass unlocks. Private URLs only appear for the wallet that owns the pass."
          eyebrow="Access library"
          title={event.title}
        >
          {resources.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
            {resources.map((resource) => (
              <article
                className="rounded-[14px] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                key={resource.id}
                style={eventThemeStyle(event)}
              >
                <div className="flex items-start justify-between gap-4">
                  <FileKey2 className="text-quorum-cyan-soft" size={20} />
                  <StatusPill tone={hasAccess ? "success" : "muted"}>
                    {resource.type}
                  </StatusPill>
                </div>
                <h2 className="mt-5 font-product text-xl font-medium tracking-normal">
                  {resource.title}
                </h2>
                {resource.description ? (
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {resource.description}
                  </p>
                ) : null}

                {hasAccess ? (
                  resource.url ? (
                    <Link
                      className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full border border-quorum-cyan/45 bg-quorum-cyan/10 px-4 font-product text-sm font-medium text-quorum-cyan-soft transition hover:border-quorum-cyan-soft hover:bg-quorum-cyan/16"
                      href={resource.url}
                    >
                      Open resource <ArrowRight size={14} />
                    </Link>
                  ) : (
                    <p className="mt-5 rounded-[10px] border border-white/10 bg-quorum-grey-900/42 p-3 text-sm text-muted">
                      This resource is text-only and will be shown by the
                      organizer.
                    </p>
                  )
                ) : (
                  <p className="mt-5 rounded-[10px] border border-white/10 bg-quorum-grey-900/42 p-3 text-sm text-muted">
                    {session
                      ? "Switch to the pass owner wallet to open this resource."
                      : "Connect the pass owner wallet to open this resource."}
                  </p>
                )}
              </article>
            ))}
            </div>
          ) : (
            <EmptyState
            action={
              <QuorumButton href={`/events/${event.slug}`} variant="secondary">
                Back to event
              </QuorumButton>
            }
            description="This event does not have gated links, files, or text resources yet. A pass can still be used for check-in."
            icon={FileKey2}
            title="No resources attached"
            />
          )}

          {!hasAccess && resources.length > 0 ? (
            <div className="mt-5 rounded-[8px] border border-white/10 bg-white/[0.04] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3 text-muted">
                {session ? (
                  <ShieldCheck className="mt-0.5 text-amber" size={18} />
                ) : (
                  <LockKeyhole className="mt-0.5 text-coral" size={18} />
                )}
                <p className="text-sm leading-6">
                  {session
                    ? "A pass is non-transferable. Use the wallet that bought or claimed it."
                    : "A wallet session is required before Quorum can check pass ownership."}
                </p>
              </div>
              <QuorumButton
                href={`/events/${event.slug}/checkout`}
                variant={session ? "secondary" : "primary"}
              >
                {session ? "Get another pass" : "Get pass"}
              </QuorumButton>
            </div>
            </div>
          ) : null}
        </ProductSection>
      </ProductPage>
    </AppShell>
  );
}
