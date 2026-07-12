"use client";

import { CircleHelp, PanelsTopLeft, SquareStack } from "lucide-react";
import { QuorumOverlay, QuorumTooltip } from "@/components/ui/overlay-primitives";
import { quorumToast } from "@/components/ui/quorum-toaster";
import { QuorumButton } from "@/components/ui/quorum-button";

export function OverlayFixtures() {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <QuorumOverlay
          description="A modal keeps the user in one focused decision and returns focus to its trigger when closed."
          title="Review event settings"
          trigger={<QuorumButton icon={<PanelsTopLeft size={16} />} variant="secondary">Open dialog</QuorumButton>}
        >
          Use a dialog when completing the current page inline would make the decision unclear or unsafe.
        </QuorumOverlay>

        <QuorumOverlay
          description="The same accessible dialog foundation becomes a right-side panel when the task benefits from more vertical room."
          drawer
          title="Event setup notes"
          trigger={<QuorumButton icon={<SquareStack size={16} />} variant="subtle">Open drawer</QuorumButton>}
        >
          A drawer is useful for supplementary editing or context. It is not a substitute for a clear primary workflow.
        </QuorumOverlay>

        <QuorumTooltip
          trigger={
            <button
              aria-label="Learn when to use a tooltip"
              className="grid size-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-muted transition hover:border-quorum-cyan/40 hover:bg-quorum-cyan/10 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-quorum-cyan"
              type="button"
            >
              <CircleHelp aria-hidden="true" size={17} />
            </button>
          }
        >
          Use a tooltip for short clarification, never for critical instructions or errors.
        </QuorumTooltip>

        <QuorumButton
          onClick={() =>
            quorumToast.success(
              "Draft saved",
              "A persistent field message is still required for information that affects the next decision.",
            )
          }
          variant="primary"
        >
          Show toast
        </QuorumButton>
      </div>
    </>
  );
}
