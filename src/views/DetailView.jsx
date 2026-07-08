import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ListFilter, MoreHorizontal, Star } from "lucide-react";
import { cn } from "../lib/utils";
import { getAppBySlug } from "../lib/queries";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "../components/ui/dropdown-menu";
import ScreenCard, { ScreensGrid } from "../components/ScreenCard";

const SORT_OPTIONS = ["Latest", "Oldest"];

const PLATFORM_LABELS = { ios: "iOS", android: "Android", web: "Web" };

function RatingStars({ rating, count }) {
  const full = Math.round(rating ?? 0);
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex text-ink">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={cn("size-4", i <= full ? "fill-current" : "text-line")}
            strokeWidth={i <= full ? 0 : 2}
          />
        ))}
      </span>
      <span className="font-bold">{rating ?? "—"}</span>
      <span className="font-bold">({count})</span>
    </span>
  );
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse pt-12">
      <div className="size-24 rounded-[22%] bg-surface" />
      <div className="mt-8 h-10 w-2/5 rounded-full bg-surface" />
      <div className="mt-4 h-10 w-1/4 rounded-full bg-surface" />
      <div className="mt-16 flex gap-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[420px] w-[236px] rounded-[36px] bg-surface" />
        ))}
      </div>
    </div>
  );
}

export default function DetailView({ appSlug, platform }) {
  const [sort, setSort] = useState("Latest");

  const { data: app, isLoading, isError, error } = useQuery({
    queryKey: ["app", appSlug],
    queryFn: () => getAppBySlug(appSlug),
    enabled: Boolean(appSlug),
  });

  // screens of the selected platform, newest first (or oldest)
  const screens = useMemo(() => {
    if (!app?.screens) return [];
    const filtered = app.screens
      .filter((s) => s.platform === platform)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return sort === "Oldest" ? filtered.reverse() : filtered;
  }, [app, platform, sort]);

  if (!appSlug) {
    return (
      <main className="px-6 pt-[68px]">
        <p className="py-24 text-center text-muted">
          Pick an app from the browse page to see its screens.
        </p>
      </main>
    );
  }

  return (
    <main className="px-6 pt-[68px]">
      {isLoading && <DetailSkeleton />}

      {isError && (
        <div className="mt-12 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          <p className="font-bold">Couldn't load “{appSlug}” from Supabase</p>
          <p className="mt-1">{error.message}</p>
        </div>
      )}

      {app && (
        <>
          {/* App header */}
          <section className="pt-12">
            {app.icon_url && (
              <img src={app.icon_url} alt={`${app.name} icon`} className="size-24 rounded-[22%]" />
            )}
            <h1 className="mt-8 max-w-3xl text-[44px] font-extrabold leading-[1.15] tracking-tight">
              {app.name} — <br />
              {app.tagline}
            </h1>

            <div className="mt-10 grid max-w-3xl grid-cols-2 gap-8 sm:grid-cols-4">
              <div>
                <p className="text-sm text-muted">Platform</p>
                <p className="mt-2 text-[15px] font-bold">
                  {app.platform.map((p) => PLATFORM_LABELS[p] ?? p).join(", ")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Rating</p>
                <div className="mt-2 text-[15px] font-bold">
                  <RatingStars rating={app.rating} count={app.review_count} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted">Category</p>
                <p className="mt-2 text-[15px] font-bold">
                  {app.app_categories.map((ac) => ac.categories.name).join(", ") || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted">Site</p>
                <p className="mt-2 truncate text-[15px] font-bold">
                  {app.website_url ? (
                    <a
                      href={app.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {app.website_url.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    "—"
                  )}
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2.5">
              <button
                type="button"
                className="cursor-pointer rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/80"
              >
                Save
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-full border border-line px-6 py-2.5 text-sm font-semibold transition-colors hover:bg-surface"
              >
                Rate
              </button>
              <button
                type="button"
                aria-label="More actions"
                className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-line transition-colors hover:bg-surface"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          </section>

          {/* Sub-nav — screens only */}
          <section className="mt-12 flex items-center gap-8 border-b border-line">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="mb-3 flex cursor-pointer items-center gap-1.5 text-[15px] font-semibold outline-none hover:opacity-70"
                >
                  {sort}
                  <ChevronDown className="size-4" strokeWidth={2.5} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {SORT_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    selected={option === sort}
                    onSelect={() => setSort(option)}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <p className="flex-1 pb-3 text-[15px] font-medium text-muted">
              {screens.length} {PLATFORM_LABELS[platform]} screen
              {screens.length === 1 ? "" : "s"}
            </p>

            <button
              type="button"
              aria-label="Filter screens"
              className="mb-3 flex size-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-surface"
            >
              <ListFilter className="size-[18px]" strokeWidth={2} />
            </button>
          </section>

          {/* Screens */}
          <section className="mt-8 pb-16">
            {screens.length === 0 ? (
              <p className="py-12 text-center text-muted">
                No {PLATFORM_LABELS[platform]} screens for {app.name} yet — try
                switching platform below.
              </p>
            ) : (
              <ScreensGrid platform={platform}>
                {screens.map((screen) => (
                  <ScreenCard key={screen.id} screen={screen} app={app} />
                ))}
              </ScreensGrid>
            )}
          </section>
        </>
      )}
    </main>
  );
}
