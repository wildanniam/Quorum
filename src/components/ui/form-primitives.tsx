import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react";
import { cn } from "@/lib/ui";

export const productInputClassName =
  "min-h-11 w-full rounded-[6px] border border-white/12 bg-background/70 px-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-quorum-cyan focus:bg-background disabled:cursor-not-allowed disabled:opacity-60";

export const Input = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<"input">>(
  ({ className, ...props }, ref) => (
    <input className={cn(productInputClassName, className)} ref={ref} {...props} />
  ),
);

Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  ComponentPropsWithoutRef<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(productInputClassName, "min-h-28 py-3", className)}
    ref={ref}
    {...props}
  />
));

Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, ComponentPropsWithoutRef<"select">>(
  ({ className, ...props }, ref) => (
    <select className={cn(productInputClassName, className)} ref={ref} {...props} />
  ),
);

Select.displayName = "Select";

type InputGroupProps = {
  children: ReactNode;
  className?: string;
};

export function InputGroup({ children, className }: InputGroupProps) {
  return <div className={cn("relative", className)}>{children}</div>;
}

type InputGroupAddonProps = {
  children: ReactNode;
  className?: string;
  position?: "end" | "start";
};

export function InputGroupAddon({
  children,
  className,
  position = "start",
}: InputGroupAddonProps) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute inset-y-0 flex items-center text-muted",
        position === "start" ? "left-3" : "right-3",
        className,
      )}
    >
      {children}
    </span>
  );
}
