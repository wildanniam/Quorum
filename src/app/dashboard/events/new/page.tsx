import { AppShell } from "@/components/app-shell";
import { demoEvent } from "@/lib/demo-data";

const fields = [
  "Event title",
  "Type",
  "Price / free mode",
  "Capacity",
  "Location",
  "Collaborators",
  "Resources",
];

export default function NewEventPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        <div className="border border-line bg-panel p-6">
          <p className="font-mono text-xs uppercase tracking-normal text-accent">
            Draft event
          </p>
          <h1 className="mt-2 text-4xl font-semibold">
            Create collaborative access
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Phase 3 will replace this scaffold with the full draft workflow and
            split validation.
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {fields.map((field) => (
            <div className="border border-line bg-panel p-4" key={field}>
              <p className="text-sm font-medium">{field}</p>
              <div className="mt-3 h-11 border border-line bg-background/40" />
            </div>
          ))}
        </div>

        <div className="mt-5 border border-line bg-panel p-5">
          <p className="font-mono text-xs uppercase tracking-normal text-muted">
            Demo default
          </p>
          <p className="mt-2 text-2xl font-semibold">{demoEvent.title}</p>
          <p className="mt-2 text-sm text-muted">
            {demoEvent.price} · {demoEvent.capacity} capacity · 70/20/10 split
          </p>
        </div>
      </section>
    </AppShell>
  );
}
