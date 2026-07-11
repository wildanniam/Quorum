"use client";

import { useState } from "react";
import { Check, Copy, Send } from "lucide-react";
import type { MoneyGramWithdrawalTransferInstructions } from "@/lib/anchor/moneygram/sep24";

type MoneyGramTransferInstructionsProps = {
  instructions: MoneyGramWithdrawalTransferInstructions;
};

function CopyValueButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  const Icon = copied ? Check : Copy;

  return (
    <button
      aria-label={`Copy ${label}`}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-white/12 text-muted transition hover:border-quorum-cyan/45 hover:text-quorum-cyan-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-quorum-cyan"
      onClick={handleCopy}
      title={`Copy ${label}`}
      type="button"
    >
      <Icon size={13} />
    </button>
  );
}

export function MoneyGramTransferInstructions({
  instructions,
}: MoneyGramTransferInstructionsProps) {
  const rows = [
    {
      copyValue: instructions.amountUsdc,
      label: "Amount",
      value: `${instructions.amountUsdc} ${instructions.assetCode}`,
    },
    {
      copyValue: instructions.destination,
      label: "Destination",
      value: instructions.destination,
    },
    { copyValue: instructions.memo, label: "Memo ID", value: instructions.memo },
    { copyValue: null, label: "Network", value: "Stellar Testnet" },
  ];

  return (
    <div className="border-t border-white/10 pt-4">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-quorum-cyan/35 bg-quorum-cyan/10 text-quorum-cyan-soft">
          <Send size={15} />
        </span>
        <div>
          <p className="font-product text-sm font-medium text-foreground">
            Wallet transfer ready
          </p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Send the exact testnet USDC amount from this wallet and include the
            memo ID. MoneyGram uses both values to match the cash-out.
          </p>
        </div>
      </div>

      <dl className="mt-4 divide-y divide-white/10 border-y border-white/10">
        {rows.map((row) => (
          <div
            className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 py-3 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center"
            key={row.label}
          >
            <dt className="col-span-2 text-xs text-muted sm:col-span-1">
              {row.label}
            </dt>
            <dd className="min-w-0 break-all font-mono text-xs leading-5 text-foreground">
              {row.value}
            </dd>
            {row.copyValue ? (
              <CopyValueButton label={row.label} value={row.copyValue} />
            ) : null}
          </div>
        ))}
      </dl>
    </div>
  );
}
