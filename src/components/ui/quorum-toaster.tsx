"use client";

import type React from "react";
import { Toaster, toast } from "sonner";

type ToastDescription = React.ReactNode;

function toastOptions(description?: ToastDescription) {
  return description ? { description } : undefined;
}

export const quorumToast = {
  error: (title: React.ReactNode, description?: ToastDescription) =>
    toast.error(title, toastOptions(description)),
  info: (title: React.ReactNode, description?: ToastDescription) =>
    toast.info(title, toastOptions(description)),
  success: (title: React.ReactNode, description?: ToastDescription) =>
    toast.success(title, toastOptions(description)),
  warning: (title: React.ReactNode, description?: ToastDescription) =>
    toast.warning(title, toastOptions(description)),
};

export function QuorumToaster() {
  return (
    <Toaster
      closeButton
      containerAriaLabel="Quorum notifications"
      position="top-right"
      theme="dark"
      toastOptions={{
        classNames: {
          closeButton:
            "!absolute !right-2 !top-2 !left-auto !z-10 !size-7 !border-white/10 !bg-[#171a1b] !text-muted hover:!border-quorum-cyan/40 hover:!bg-quorum-cyan/10 hover:!text-foreground",
          description: "!text-muted",
          error: "!border-coral/45",
          info: "!border-quorum-cyan/35",
          success: "!border-success/40",
          toast:
            "!rounded-[8px] !border !border-white/12 !bg-[#111314] !p-4 !pr-12 !text-foreground !shadow-[0_24px_90px_rgba(0,0,0,0.4)]",
          title: "!font-product !font-medium !text-foreground",
          warning: "!border-amber/45",
        },
      }}
    />
  );
}
