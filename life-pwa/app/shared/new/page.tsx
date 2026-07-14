"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SharedPage } from "@/modules/shared/components/shared-page";
import type { SaveLinkDraft } from "@/modules/shared/components/save-link-modal";
import {
  resolveSharedTitle,
  resolveSharedUrl,
} from "@/modules/shared/tags";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";

function SharedNewInner() {
  const search = useSearchParams();
  const router = useRouter();

  const initialDraft = useMemo((): SaveLinkDraft => {
    const title = search.get("title");
    const text = search.get("text");
    const url = search.get("url");
    return {
      url: resolveSharedUrl({ url, text }),
      title: resolveSharedTitle({ title, text, url }),
      tag: "other",
      share_text: text,
    };
  }, [search]);

  const clearInitialDraft = useCallback(() => {
    router.replace("/shared");
  }, [router]);

  return (
    <SharedPage
      initialDraft={initialDraft}
      clearInitialDraft={clearInitialDraft}
    />
  );
}

export default function SharedNewPage() {
  return (
    <Suspense
      fallback={
        <AppShell title="Shared">
          <p className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Opening…
          </p>
        </AppShell>
      }
    >
      <SharedNewInner />
    </Suspense>
  );
}
