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
 * A DB-backed screen: phone-framed screenshot image with an optional
 * Highlight pill and a bookmark toggle writing to collection_screens.
 */
export default function ScreenCard({ screen, caption, onClick }) {
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
        <Bookmark
          className={cn("size-4", saved && "fill-ink")}
          strokeWidth={2}
        />
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
