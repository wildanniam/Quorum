import type React from "react";
import { cn } from "@/lib/ui";

type SectionLabelProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionLabel({ children, className }: SectionLabelProps) {
  return <p className={cn("landing-label", className)}>{children}</p>;
}
