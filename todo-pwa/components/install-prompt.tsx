"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      ("standalone" in navigator &&
        (navigator as Navigator & { standalone?: boolean }).standalone === true);

    if (standalone) return;

    const dismissed = sessionStorage.getItem("todo-install-dismissed");
    if (dismissed) return;

    setShow(true);
  }, []);

  if (!show) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/10 px-4 py-3">
      <Download className="mt-0.5 size-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1 text-sm leading-relaxed">
        <p className="font-semibold text-foreground">Install Todo on your phone</p>
        <p className="mt-0.5 text-muted-foreground">
          <strong className="font-medium text-foreground/90">iPhone:</strong> Share
          → Add to Home Screen.{" "}
          <strong className="font-medium text-foreground/90">Android:</strong>{" "}
          browser menu → Install app.
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        onClick={() => {
          sessionStorage.setItem("todo-install-dismissed", "1");
          setShow(false);
        }}
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
