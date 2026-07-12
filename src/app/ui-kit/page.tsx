import type { Metadata } from "next";
import {
  AlertCircle,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileKey2,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  DataRow,
  FormField,
  ProductSection,
  TaskPanel,
  CompactPageHeader,
  FieldMessage,
} from "@/components/ui/product-primitives";
import { EmptyState, ProductPage } from "@/components/ui/product-layout";
import { Alert, Skeleton } from "@/components/ui/feedback-primitives";
import {
  Input,
  InputGroup,
  InputGroupAddon,
  Select,
  Textarea,
} from "@/components/ui/form-primitives";
import { QuorumButton } from "@/components/ui/quorum-button";
import { StatusPill } from "@/components/ui/status-pill";

export const metadata: Metadata = {
  title: "UI Kit | Quorum",
  robots: {
    follow: false,
    index: false,
  },
};

const statusExamples = [
  { label: "Ready", tone: "ready" as const },
  { label: "Pending", tone: "pending" as const },
  { label: "Confirmed", tone: "success" as const },
  { label: "Review needed", tone: "warning" as const },
  { label: "Unavailable", tone: "blocked" as const },
  { label: "Testnet", tone: "local" as const },
];

export default function UiKitPage() {
  return (
    <AppShell>
      <ProductPage className="space-y-10" maxWidth="content" spacing="default">
        <CompactPageHeader
          description="Internal visual fixtures for Quorum primitives. This route is intentionally excluded from product navigation and search indexing."
          eyebrow="Internal fixture"
          icon={Sparkles}
          title="UI kit and state inventory"
        />

        <ProductSection
          description="Every command keeps its visual hierarchy while loading and disabled states remain stable."
          title="Actions"
        >
          <div className="flex flex-wrap gap-3">
            <QuorumButton icon={<CircleDollarSign size={16} />}>Primary action</QuorumButton>
            <QuorumButton variant="secondary">Secondary action</QuorumButton>
            <QuorumButton variant="subtle">Subtle action</QuorumButton>
            <QuorumButton variant="ghost">Text action</QuorumButton>
            <QuorumButton variant="danger">Destructive action</QuorumButton>
            <QuorumButton loading>Processing</QuorumButton>
          </div>
        </ProductSection>

        <ProductSection
          description="Status always combines a readable label with a tonal cue. No state relies on color alone."
          title="Status"
        >
          <div className="flex flex-wrap gap-2">
            {statusExamples.map((status) => (
              <StatusPill icon={CheckCircle2} key={status.tone} tone={status.tone}>
                {status.label}
              </StatusPill>
            ))}
          </div>
        </ProductSection>

        <ProductSection
          description="These static fixtures define control density, field hierarchy, validation placement, and disabled behavior before production forms are migrated."
          title="Fields"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <FormField
              description="Shown before an organizer has entered a value."
              htmlFor="fixture-event-name"
              label="Event name"
              required
            >
              <Input
                name="fixture-event-name"
                placeholder="APAC Stellar Builder Meetup"
              />
            </FormField>

            <FormField
              description="A known wallet address is always shown in full before it is saved."
              htmlFor="fixture-wallet"
              label="Collaborator wallet"
              required
            >
              <Input
                defaultValue="GBRPYHIL2CI3K3KOLY4X5VHO6CBQ4SZP"
                name="fixture-wallet"
              />
            </FormField>

            <FormField
              error="Enter a whole percentage between 1 and 100."
              htmlFor="fixture-split"
              label="Revenue share"
              required
            >
              <Input
                defaultValue="120"
                inputMode="numeric"
                name="fixture-split"
              />
            </FormField>

            <FormField
              description="Disabled controls retain their label and value for review."
              htmlFor="fixture-network"
              label="Network"
            >
              <Select defaultValue="testnet" disabled name="fixture-network">
                <option value="testnet">Stellar Testnet</option>
              </Select>
            </FormField>

            <FormField
              className="md:col-span-2"
              description="Supporting detail is readable without competing with the field label."
              htmlFor="fixture-description"
              label="Event description"
            >
              <Textarea
                defaultValue="A concise fixture for reviewing multiline product form behavior."
                name="fixture-description"
              />
            </FormField>
          </div>
          <div className="mt-5 max-w-sm">
            <label className="mb-2 block text-sm font-medium text-foreground" htmlFor="fixture-price">
              Ticket price
            </label>
            <InputGroup>
              <Input
                className="pr-16"
                defaultValue="5"
                id="fixture-price"
                inputMode="decimal"
                name="fixture-price"
              />
              <InputGroupAddon position="end">USDC</InputGroupAddon>
            </InputGroup>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <FieldMessage>Draft saved locally. No transaction has been created.</FieldMessage>
            <FieldMessage tone="success">Revenue split adds up to 100%.</FieldMessage>
            <FieldMessage tone="error">The wallet address could not be verified.</FieldMessage>
          </div>
        </ProductSection>

        <ProductSection
          description="Record rows are compact enough for operational workflows, while a focused panel can still carry one meaningful next step."
          title="Surfaces and records"
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(16rem,0.75fr)]">
            <TaskPanel>
              <DataRow detail="Stellar Testnet · updated moments ago" icon={WalletCards} label="Organizer wallet" value="Connected" />
              <DataRow detail="Three recipients are ready to receive their share." icon={CircleDollarSign} label="Revenue split" value="100%" />
              <DataRow detail="Receipt and explorer evidence are available after confirmation." icon={FileKey2} label="Payment proof" value="Ready" />
            </TaskPanel>

            <EmptyState
              action={<QuorumButton href="/discover" variant="secondary">Browse events</QuorumButton>}
              description="Use an empty state to explain what is missing and offer one useful way forward."
              icon={ClipboardCheck}
              title="No passes yet"
            />
          </div>
        </ProductSection>

        <ProductSection
          description="The examples below make state review deterministic without calling a wallet, API, or mutation."
          title="Feedback placement"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <Alert title="Pass issued" tone="success">
              The attendee can now open their receipt and access protected resources.
            </Alert>
            <Alert title="Action needs attention" tone="danger">
              Critical errors stay near the action that caused them; a temporary notice is never the only explanation.
            </Alert>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3" aria-label="Loading skeleton fixtures">
            {["Event title", "Pass card", "Ledger row"].map((label) => (
              <div className="rounded-[8px] border border-white/10 bg-white/[0.03] p-4" key={label}>
                <Skeleton className="h-3 w-24" label={`Loading ${label}`} />
                <Skeleton className="mt-4 h-6 w-4/5" label={`Loading ${label}`} />
                <Skeleton className="mt-3 h-3 w-full" label={`Loading ${label}`} />
              </div>
            ))}
          </div>
        </ProductSection>

        <p className="flex items-center gap-2 border-t border-white/10 pt-6 text-sm leading-6 text-muted">
          <AlertCircle className="shrink-0 text-quorum-cyan-soft" size={16} />
          This fixture route is not a second design system. It is the review surface for components that real Quorum routes adopt in later phases.
        </p>
      </ProductPage>
    </AppShell>
  );
}
