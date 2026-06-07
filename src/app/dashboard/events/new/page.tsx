import { AppShell } from "@/components/app-shell";
import { CreateEventForm } from "@/components/events/create-event-form";

export default function NewEventPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-5xl px-5 py-8 lg:px-8">
        <div className="mb-5 border border-line bg-panel p-6">
          <p className="font-mono text-xs uppercase tracking-normal text-accent">
            Draft event
          </p>
          <h1 className="mt-2 text-4xl font-semibold">
            Create collaborative access
          </h1>
        </div>
        <CreateEventForm />
      </section>
    </AppShell>
  );
}
