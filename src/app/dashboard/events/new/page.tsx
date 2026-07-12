import { CalendarPlus, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CreateEventForm } from "@/components/events/create-event-form";
import { ProductPage } from "@/components/ui/product-layout";
import { CompactPageHeader } from "@/components/ui/product-primitives";
import { StatusPill } from "@/components/ui/status-pill";

export default function NewEventPage() {
  return (
    <AppShell>
      <ProductPage maxWidth="content" className="space-y-7" spacing="default">
        <CompactPageHeader
          description="Start with the public event story, then add collaborator wallets and gated resources before publishing."
          eyebrow="Create event"
          icon={CalendarPlus}
          meta={
            <div className="flex flex-wrap gap-2">
              {["Event page", "Revenue split", "Gated access"].map((item) => (
                <StatusPill icon={Sparkles} key={item} tone="cyan">
                  {item}
                </StatusPill>
              ))}
            </div>
          }
          title="Create an event, one decision at a time."
        />
        <CreateEventForm />
      </ProductPage>
    </AppShell>
  );
}
