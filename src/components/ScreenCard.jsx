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

/** Wide desktop-browser frame for web screens — traffic lights + URL strip. */
export function BrowserFrame({ children, className }) {
  return (
    <div
      className={cn(
        "w-full shrink-0 overflow-hidden rounded-2xl border border-line bg-white",
        "shadow-[0_18px_50px_rgba(0,0,0,0.12)]",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 border-b border-line bg-[#f6f6f7] px-3 py-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-2 rounded-full bg-[#dcdce0]" />
        ))}
        <span className="mx-auto h-3.5 w-2/5 rounded-full bg-[#ececee]" />
      </div>
      <div className="bg-surface">{children}</div>
    </div>
  );
}

/**
 * A DB-backed screen: framed screenshot image with an optional Highlight
 * pill and a bookmark toggle writing to collection_screens. Frame shape
 * follows the screen's platform — phone for ios, browser for web.
 */
export default function ScreenCard({ screen, caption, onClick }) {
  const { isSaved, toggleSave } = useSavedScreens();
  const saved = isSaved(screen.id);
  const isWeb = screen.platform === "web";

  return (
    <div className={cn("group relative shrink-0 pl-2 pt-2", isWeb && "w-full max-w-[460px]")}>
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
        {isWeb ? (
          <BrowserFrame>
            <img
              src={screen.image_url}
              alt={caption ? `${caption} screen` : "App screen"}
              className="block w-full"
              loading="lazy"
            />
          </BrowserFrame>
        ) : (
          <PhoneFrame>
            <img
              src={screen.image_url}
              alt={caption ? `${caption} screen` : "App screen"}
              className="block w-full"
              loading="lazy"
            />
          </PhoneFrame>
        )}
        {caption && (
          <p className="mt-3 pl-1 text-sm font-semibold text-ink">{caption}</p>
        )}
      </div>
    </div>
  );
}
