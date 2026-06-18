"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type DialogContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const DialogContext = React.createContext<DialogContextValue | null>(null);

function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <DialogContext.Provider value={{ open, setOpen: onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(DialogContext);
  if (!ctx?.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => ctx.setOpen(false)}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-xl border bg-background p-6 shadow-lg",
          className
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          className="absolute right-3 top-3"
          onClick={() => ctx.setOpen(false)}
        >
          <X className="size-4" />
        </Button>
        {children}
      </div>
    </div>
  );
}

function DialogHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mb-4 flex flex-col gap-1 pr-8", className)}>{children}</div>;
}

function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={cn("text-lg font-semibold", className)}>{children}</h2>;
}

function DialogDescription({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>;
}

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription };