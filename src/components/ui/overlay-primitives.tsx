"use client";

import type React from "react";
import { X } from "lucide-react";
import { Dialog } from "@base-ui/react/dialog";
import { Tooltip } from "@base-ui/react/tooltip";
import { cn } from "@/lib/ui";

type QuorumOverlayProps = {
  actions?: React.ReactNode;
  children: React.ReactNode;
  description?: React.ReactNode;
  drawer?: boolean;
  title: React.ReactNode;
  trigger: React.ReactElement;
};

export function QuorumOverlay({
  actions,
  children,
  description,
  drawer = false,
  title,
  trigger,
}: QuorumOverlayProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger render={trigger} />
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />
        <Dialog.Viewport
          className={cn(
            "fixed inset-0 z-50 flex p-4 sm:p-6",
            drawer ? "justify-end" : "items-center justify-center",
          )}
        >
          <Dialog.Popup
            className={cn(
              "relative flex max-h-full w-full flex-col overflow-y-auto border border-white/12 bg-[#111314] text-foreground shadow-[0_24px_90px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none",
              drawer
                ? "max-w-md rounded-[8px] p-5 data-[ending-style]:translate-x-4 data-[starting-style]:translate-x-4 sm:p-6"
                : "max-w-lg rounded-[8px] p-5 data-[ending-style]:scale-[0.98] data-[starting-style]:scale-[0.98] sm:p-6",
            )}
          >
            <div className="flex items-start justify-between gap-5">
              <div className="min-w-0">
                <Dialog.Title className="font-product text-xl font-medium leading-tight text-foreground">
                  {title}
                </Dialog.Title>
                {description ? (
                  <Dialog.Description className="mt-2 text-sm leading-6 text-muted">
                    {description}
                  </Dialog.Description>
                ) : null}
              </div>
              <Dialog.Close
                aria-label="Close dialog"
                className="grid size-9 shrink-0 place-items-center rounded-[6px] border border-white/10 text-muted transition hover:border-quorum-cyan/40 hover:bg-quorum-cyan/10 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-quorum-cyan"
              >
                <X aria-hidden="true" size={17} />
              </Dialog.Close>
            </div>
            <div className="mt-5 text-sm leading-6 text-muted">{children}</div>
            {actions ? <div className="mt-6 flex flex-wrap justify-end gap-3">{actions}</div> : null}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type QuorumTooltipProps = {
  children: React.ReactNode;
  side?: "bottom" | "left" | "right" | "top";
  trigger: React.ReactElement;
};

export function QuorumTooltip({ children, side = "top", trigger }: QuorumTooltipProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={trigger} />
      <Tooltip.Portal>
        <Tooltip.Positioner side={side} sideOffset={8}>
          <Tooltip.Popup
            className="z-50 max-w-56 rounded-[6px] border border-white/12 bg-[#171a1b] px-3 py-2 text-xs leading-5 text-foreground shadow-[0_18px_50px_rgba(0,0,0,0.35)] transition data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none"
            role="tooltip"
          >
            {children}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}
