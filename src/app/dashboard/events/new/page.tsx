import { AppShell } from "@/components/app-shell";
import { CreateEventForm } from "@/components/events/create-event-form";

export default function NewEventPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-5 py-10 lg:px-8 lg:py-14">
        <div className="mb-5 rounded-[8px] border border-foreground/10 bg-foreground/[0.045] p-6 shadow-[0_24px_90px_rgba(0,0,0,0.22)]">
          <p className="eyebrow">Create event</p>
          <h1 className="mt-3 max-w-3xl text-5xl font-semibold leading-tight tracking-tight md:text-7xl">
            Build the page, split, and access in one draft.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
            Start with the public event story, then add collaborator wallets and
            gated resources before publishing.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Event page", "Revenue split", "Gated access"].map((item) => (
              <span
                className="rounded-full border border-foreground/10 bg-background/45 px-3 py-1.5 text-xs font-medium text-muted"
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <CreateEventForm />
      </section>
    </AppShell>
  );
}
