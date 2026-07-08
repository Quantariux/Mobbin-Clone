import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ExternalLink, X } from "lucide-react";
import { cn } from "../lib/utils";
import { buildScreenPrompt } from "../lib/prompt";
import { useSavedScreens } from "../lib/useSavedScreens";

/**
 * Expanded screen preview — Mobbin-style dialog: app header, letterboxed
 * screenshot, action row (Save / Copy prompt / Description) and screen info.
 * "Copy prompt" puts an AI-coding-agent brief on the clipboard;
 * "Description" reveals the page's own captured title + meta description.
 */
export default function ScreenModal({ app, screen, open, onOpenChange }) {
  const { isSaved, toggleSave } = useSavedScreens();
  const [showDescription, setShowDescription] = useState(false);
  const [copied, setCopied] = useState(false);

  const saved = isSaved(screen.id);
  const isWeb = screen.platform === "web";

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(buildScreenPrompt(app, screen));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[70] bg-black/50" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[80] flex max-h-[92dvh] w-[min(1080px,calc(100vw-40px))]",
            "-translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white shadow-2xl outline-none",
          )}
        >
          {/* Header */}
          <header className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="flex min-w-0 items-center gap-3">
              {app?.icon_url && (
                <img src={app.icon_url} alt="" className="size-9 rounded-[22%]" />
              )}
              <Dialog.Title className="truncate text-[15px] font-bold text-ink">
                {app?.name ?? "Screen"}
                {screen.title ? ` — ${screen.title}` : ""}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface text-muted transition-colors hover:bg-line hover:text-ink"
              >
                <X className="size-4" strokeWidth={2.5} />
              </button>
            </Dialog.Close>
          </header>

          {/* Screen */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6">
            <div
              className={cn(
                "relative mx-auto overflow-hidden rounded-xl",
                isWeb ? "w-full" : "w-full max-w-[380px]",
              )}
            >
              <img
                src={screen.image_url}
                alt={screen.title ?? "App screen"}
                className="block w-full bg-surface"
              />
              <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-ink/10" />
            </div>

            {showDescription && (
              <div className="mx-auto mt-4 max-w-2xl rounded-2xl bg-surface p-5">
                {screen.title && (
                  <p className="text-[15px] font-bold text-ink">{screen.title}</p>
                )}
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {screen.description ??
                    "No description captured for this screen yet. Run supabase/migrations/003_screen_metadata.sql, then `node capture/backfill-metadata.mjs` to fill it from the crawl metadata."}
                </p>
                {screen.page_url && (
                  <a
                    href={screen.page_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink underline underline-offset-2 hover:opacity-70"
                  >
                    Visit live page
                    <ExternalLink className="size-3.5" strokeWidth={2} />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6 py-5">
            <div />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleSave(screen.id)}
                className="h-11 cursor-pointer rounded-full bg-ink px-6 text-[15px] font-bold text-white transition-colors hover:bg-black/80"
              >
                {saved ? "Saved" : "Save"}
              </button>
              <button
                type="button"
                onClick={copyPrompt}
                className="h-11 cursor-pointer rounded-full bg-surface px-6 text-[15px] font-bold text-ink transition-colors hover:bg-line"
              >
                {copied ? "Copied!" : "Copy prompt"}
              </button>
              <button
                type="button"
                onClick={() => setShowDescription((v) => !v)}
                aria-pressed={showDescription}
                className={cn(
                  "h-11 cursor-pointer rounded-full px-6 text-[15px] font-bold transition-colors",
                  showDescription ? "bg-ink text-white" : "bg-surface text-ink hover:bg-line",
                )}
              >
                Description
              </button>
            </div>
            <div className="justify-self-end text-right text-sm text-muted">
              {isWeb ? "Desktop (1440×900)" : "iOS (390×844)"}
            </div>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
