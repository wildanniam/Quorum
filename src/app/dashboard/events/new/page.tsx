import { CalendarPlus, FileKey2, Percent, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CreateEventForm } from "@/components/events/create-event-form";
import {
  MetricTile,
  ProductPage,
  ProductPageHeader,
} from "@/components/ui/product-layout";
import { StatusPill } from "@/components/ui/status-pill";

export default function NewEventPage() {
  return (
    <AppShell>
      <ProductPage maxWidth="content" className="space-y-5">
        <ProductPageHeader
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
          title="Build the page, split, and access in one draft."
        >
          <div className="grid gap-3 md:grid-cols-3">
            <MetricTile
              detail="Title, description, schedule, and location."
              icon={CalendarPlus}
              label="Step 1"
              value="Story"
            />
            <MetricTile
              detail="Wallet collaborators must total 100%."
              icon={Percent}
              label="Step 2"
              value="Split"
            />
            <MetricTile
              detail="Resources unlock after pass ownership."
              icon={FileKey2}
              label="Step 3"
              value="Access"
            />
          </div>
        </ProductPageHeader>
        <CreateEventForm />
      </ProductPage>
    </AppShell>
  );
}
