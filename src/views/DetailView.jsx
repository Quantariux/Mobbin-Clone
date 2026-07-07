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
import ScreenCard from "../components/ScreenCard";

const CONTENT_TABS = ["Screens", "UI Elements", "Flows"];
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
          <div key={i} className="h-[500px] w-[236px] rounded-[36px] bg-surface" />
        ))}
      </div>
    </div>
  );
}

export default function DetailView({ appSlug }) {
  const [tab, setTab] = useState("Screens");
  const [sort, setSort] = useState("Latest");

  const { data: app, isLoading, isError, error } = useQuery({
    queryKey: ["app", appSlug],
    queryFn: () => getAppBySlug(appSlug),
    enabled: Boolean(appSlug),
  });

  const sortedScreens = useMemo(() => {
    if (!app?.screens) return [];
    const screens = [...app.screens].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
    return sort === "Oldest" ? screens.reverse() : screens;
  }, [app, sort]);

  // screens grouped by UI element tag (from the single app fetch)
  const elementGroups = useMemo(() => {
    const groups = new Map();
    for (const screen of app?.screens ?? []) {
      for (const tag of screen.screen_ui_elements ?? []) {
        const name = tag.ui_elements?.name;
        if (!name) continue;
        if (!groups.has(name)) groups.set(name, []);
        groups.get(name).push(screen);
      }
    }
    return [...groups.entries()];
  }, [app]);

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

          {/* Sub-nav */}
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

            <div className="flex flex-1 gap-7">
              {CONTENT_TABS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setTab(label)}
                  className={cn(
                    "cursor-pointer pb-3 text-[15px] transition-colors",
                    tab === label
                      ? "-mb-px border-b-2 border-ink font-bold text-ink"
                      : "border-b-2 border-transparent font-medium text-muted hover:text-ink",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              aria-label="Filter screens"
              className="mb-3 flex size-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-surface"
            >
              <ListFilter className="size-[18px]" strokeWidth={2} />
            </button>
          </section>

          {/* Content */}
          <section className="mt-8 pb-16">
            {tab === "Screens" && (
              <div className="flex flex-wrap gap-6">
                {sortedScreens.map((screen) => (
                  <ScreenCard key={screen.id} screen={screen} />
                ))}
              </div>
            )}

            {tab === "UI Elements" &&
              (elementGroups.length === 0 ? (
                <p className="py-12 text-center text-muted">No tagged UI elements yet.</p>
              ) : (
                <div className="space-y-12">
                  {elementGroups.map(([name, screens]) => (
                    <div key={name}>
                      <h3 className="text-lg font-bold">{name}</h3>
                      <div className="mt-4 flex flex-wrap gap-6">
                        {screens.map((screen) => (
                          <ScreenCard key={`${name}-${screen.id}`} screen={screen} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}

            {tab === "Flows" &&
              ((app.flows ?? []).length === 0 ? (
                <p className="py-12 text-center text-muted">No flows recorded yet.</p>
              ) : (
                <div className="space-y-12">
                  {app.flows.map((flow) => (
                    <div key={flow.id}>
                      <h3 className="text-lg font-bold">{flow.name}</h3>
                      <div className="mt-4 flex flex-wrap gap-6">
                        {[...flow.flow_screens]
                          .sort((a, b) => a.position - b.position)
                          .map((fs) => (
                            <ScreenCard key={fs.screens.id} screen={fs.screens} />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </section>
        </>
      )}
    </main>
  );
}
