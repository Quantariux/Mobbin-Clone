import { useState } from "react";
import { Bookmark } from "lucide-react";
import { cn } from "../lib/utils";
import { useSavedScreens } from "../lib/useSavedScreens";

export function PhoneFrame({ children, className }) {
  return (
    <div
      className={cn(
        "w-[236px] shrink-0 overflow-hidden rounded-[36px] border border-line bg-white p-2",
        "shadow-[0_18px_50px_rgba(0,0,0,0.14)]",
        className,
      )}
    >
      <div className="h-full overflow-hidden rounded-[28px] bg-surface">{children}</div>
    </div>
  );
}

/**
 * Plain rounded web screenshot at a fixed ~1.6:1 aspect ratio with a
 * hairline inset border — no fake browser chrome.
 */
export function WebScreenImage({ src, alt, className }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl", className)}>
      <img
        src={src}
        alt={alt}
        className="aspect-[1.6/1] size-full bg-surface object-cover object-top"
        loading="lazy"
      />
      <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-ink/10" />
    </div>
  );
}

/**
 * Per-platform results layout. iOS wraps phone cards; web is an auto-fill
 * grid capped at 3 columns with viewport-stepped minimum column widths
 * (300px, then 384px at 840px, then 500px at 1024px) and 12px gaps that
 * grow to 24px at 720px — the column width formula guarantees the cap.
 */
export function ScreensGrid({ platform, children }) {
  if (platform !== "web") {
    return <div className="flex flex-wrap gap-6">{children}</div>;
  }
  return (
    <div
      className={cn(
        "grid content-start",
        "[--col-gap:12px] min-[720px]:[--col-gap:24px]",
        "gap-x-(--col-gap) gap-y-3 min-[720px]:gap-y-6",
        "[--min-col:300px] min-[840px]:[--min-col:384px] min-[1024px]:[--min-col:500px]",
        "[--max-col:calc((100%-2*var(--col-gap))/3)]",
        "grid-cols-[repeat(auto-fill,minmax(max(var(--min-col),var(--max-col)),1fr))]",
      )}
    >
      {children}
    </div>
  );
}

function GlassBadge({ children, className }) {
  return (
    <span
      className={cn(
        "rounded-lg bg-black/40 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Web cell: hover overlay + glass badge + slide-up Save/Copy actions. */
function WebScreenCard({ screen, caption, onClick }) {
  const { isSaved, toggleSave } = useSavedScreens();
  const saved = isSaved(screen.id);
  const [copied, setCopied] = useState(false);

  const copy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(screen.image_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.open(screen.image_url, "_blank", "noreferrer");
    }
  };

  return (
    <div className="group relative">
      <div
        className={cn("relative overflow-hidden rounded-xl", onClick && "cursor-pointer")}
        onClick={onClick}
      >
        <img
          src={screen.image_url}
          alt={caption ? `${caption} screen` : "App screen"}
          className="aspect-[1.6/1] size-full bg-surface object-cover object-top"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-ink/10" />

        {/* hover-darkening overlay */}
        <div className="pointer-events-none absolute inset-0 rounded-xl bg-black/25 opacity-0 transition-opacity ease-out group-focus-within:opacity-100 group-hover:opacity-100" />

        {screen.is_highlight && (
          <GlassBadge className="absolute left-4 top-4 transition-opacity ease-out group-focus-within:opacity-0 group-hover:opacity-0">
            Highlight
          </GlassBadge>
        )}

        {/* slide-up action row */}
        <div className="absolute inset-x-4 bottom-4 grid translate-y-4 grid-cols-2 gap-2 opacity-0 transition-[transform,opacity] duration-300 ease-out group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSave(screen.id);
            }}
            className="h-11 cursor-pointer truncate rounded-full bg-white px-4 text-[15px] font-bold text-ink transition-colors ease-out hover:bg-white/90"
          >
            {saved ? "Saved" : "Save"}
          </button>
          <button
            type="button"
            onClick={copy}
            className="h-11 cursor-pointer truncate rounded-full bg-white/25 px-4 text-[15px] font-bold text-white backdrop-blur transition-colors ease-out hover:bg-white/35"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {caption && <p className="mt-3 text-sm font-semibold text-ink">{caption}</p>}
    </div>
  );
}

/** iOS cell: phone frame with corner Highlight pill and bookmark toggle. */
function PhoneScreenCard({ screen, caption, onClick }) {
  const { isSaved, toggleSave } = useSavedScreens();
  const saved = isSaved(screen.id);

  return (
    <div className="group relative shrink-0 pl-2 pt-2">
      {screen.is_highlight && (
        <span className="absolute left-0 top-0 z-10 rounded-lg bg-neutral-400/90 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
          Highlight
        </span>
      )}

      <button
        type="button"
        aria-label={saved ? "Remove from collection" : "Save to collection"}
        onClick={(e) => {
          e.stopPropagation();
          toggleSave(screen.id);
        }}
        className={cn(
          "absolute right-2 top-6 z-10 flex size-9 cursor-pointer items-center justify-center rounded-full bg-white shadow-md transition-all hover:scale-105",
          saved ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <Bookmark className={cn("size-4", saved && "fill-ink")} strokeWidth={2} />
      </button>

      <div className={onClick ? "cursor-pointer" : undefined} onClick={onClick}>
        <PhoneFrame>
          <img
            src={screen.image_url}
            alt={caption ? `${caption} screen` : "App screen"}
            className="block w-full"
            loading="lazy"
          />
        </PhoneFrame>
        {caption && (
          <p className="mt-3 pl-1 text-sm font-semibold text-ink">{caption}</p>
        )}
      </div>
    </div>
  );
}

export default function ScreenCard({ screen, caption, onClick }) {
  return screen.platform === "web" ? (
    <WebScreenCard screen={screen} caption={caption} onClick={onClick} />
  ) : (
    <PhoneScreenCard screen={screen} caption={caption} onClick={onClick} />
  );
}
