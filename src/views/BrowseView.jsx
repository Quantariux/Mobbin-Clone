import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "../lib/utils";
import { GITHUB_URL } from "../lib/constants";
import {
  getApps,
  getAppsByCategory,
  getCategories,
  getScreensByScreenType,
  getScreenTypes,
  searchApps,
} from "../lib/queries";
import ScreenCard, { PhoneFrame, ScreensGrid, WebScreenImage } from "../components/ScreenCard";

const SORT_TABS = [
  { label: "Latest", key: "latest", column: "created_at" },
  { label: "Most popular", key: "popular", column: "review_count" },
  { label: "Top rated", key: "rated", column: "rating" },
];

function PanelColumn({ label, items, isLoading, activeSlug, onSelect }) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      {isLoading ? (
        <div className="mt-5 space-y-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 w-3/4 animate-pulse rounded-full bg-surface" />
          ))}
        </div>
      ) : (
        <ul className="mt-5 space-y-3.5">
          {(items ?? []).map((item) => (
            <li key={item.slug}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className={cn(
                  "cursor-pointer text-left text-[17px] font-bold tracking-tight hover:opacity-70",
                  activeSlug === item.slug ? "underline underline-offset-4" : "text-ink",
                )}
              >
                {item.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AppCard({ app, platform, onOpen }) {
  const platformScreens = (app.screens ?? []).filter((s) => s.platform === platform);
  const preview =
    platformScreens.find((s) => s.is_highlight) ?? platformScreens[0] ?? null;
  const isWeb = platform === "web";

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open ${app.name}`}
      className="cursor-pointer text-left"
    >
      <div
        className={cn(
          "flex justify-center overflow-hidden rounded-2xl bg-surface transition-colors hover:bg-[#ebebec]",
          isWeb ? "h-[300px] items-center p-6" : "h-[440px] p-6 pb-0",
        )}
      >
        {preview ? (
          isWeb ? (
            <WebScreenImage
              src={preview.image_url}
              alt={`${app.name} screen`}
              className="w-full max-w-[520px] self-center"
            />
          ) : (
            <PhoneFrame className="mt-2 h-[520px]">
              <img src={preview.image_url} alt={`${app.name} screen`} className="block w-full" loading="lazy" />
            </PhoneFrame>
          )
        ) : (
          <div className="flex items-center justify-center text-sm text-muted">
            No {isWeb ? "web" : "iOS"} screens yet
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-3 px-1">
        {app.icon_url && (
          <img src={app.icon_url} alt="" className="size-9 rounded-[22%]" />
        )}
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold">{app.name}</p>
          <p className="truncate text-sm text-muted">{app.tagline}</p>
        </div>
      </div>
    </button>
  );
}

function CardSkeletons({ isWeb }) {
  return (
    <div
      className={cn(
        "grid gap-8",
        isWeb ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
      )}
    >
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn("animate-pulse rounded-2xl bg-surface", isWeb ? "h-[300px]" : "h-[440px]")}
        />
      ))}
    </div>
  );
}

export default function BrowseView({ platform, search, onClearSearch, onOpenApp }) {
  const [sortKey, setSortKey] = useState("latest");
  const [filter, setFilter] = useState(null); // { kind, slug, name } | null

  const searching = search.trim().length >= 2;
  useEffect(() => {
    if (searching) setFilter(null);
  }, [searching]);

  const categories = useQuery({ queryKey: ["categories"], queryFn: getCategories });
  const screenTypes = useQuery({ queryKey: ["screen-types"], queryFn: getScreenTypes });

  const results = useQuery({
    queryKey: [
      "browse",
      searching ? `search:${search}` : filter ? `${filter.kind}:${filter.slug}` : "apps",
      platform,
      sortKey,
    ],
    queryFn: () => {
      if (searching) return searchApps(search, platform);
      if (!filter) return getApps({ platform, sort: sortKey });
      if (filter.kind === "category") return getAppsByCategory(filter.slug, platform);
      return getScreensByScreenType(filter.slug, platform);
    },
  });

  const showingScreens = filter?.kind === "screen-type" && !searching;
  const isWeb = platform === "web";

  const sortedApps = useMemo(() => {
    if (showingScreens || !results.data) return results.data;
    const { column } = SORT_TABS.find((t) => t.key === sortKey) ?? SORT_TABS[0];
    return [...results.data].sort((a, b) => ((b[column] ?? 0) > (a[column] ?? 0) ? 1 : -1));
  }, [results.data, showingScreens, sortKey]);

  const selectFilter = (kind) => (item) => {
    onClearSearch();
    setFilter({ kind, slug: item.slug, name: item.name });
  };

  return (
    <main className="px-6 pt-[68px]">
      {/* Filter panel — categories and screen types, DB-backed */}
      <section className="grid max-w-3xl grid-cols-2 gap-x-12 gap-y-10 py-10">
        <PanelColumn
          label="Categories"
          items={categories.data}
          isLoading={categories.isLoading}
          activeSlug={filter?.kind === "category" ? filter.slug : null}
          onSelect={selectFilter("category")}
        />
        <PanelColumn
          label="Screens"
          items={screenTypes.data}
          isLoading={screenTypes.isLoading}
          activeSlug={filter?.kind === "screen-type" ? filter.slug : null}
          onSelect={selectFilter("screen-type")}
        />
      </section>

      {/* Toolbar */}
      <section className="flex items-center gap-8 pb-5 pt-4">
        <div className="flex flex-1 items-center gap-7">
          {SORT_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setSortKey(tab.key)}
              className={cn(
                "cursor-pointer pb-1 text-[15px] transition-colors",
                sortKey === tab.key
                  ? "border-b-2 border-ink font-bold text-ink"
                  : "border-b-2 border-transparent font-medium text-muted hover:text-ink",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {(filter || searching) && (
          <button
            type="button"
            onClick={() => {
              setFilter(null);
              onClearSearch();
            }}
            className="flex cursor-pointer items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black/80"
          >
            {searching ? `“${search.trim()}”` : filter.name}
            <X className="size-3.5" strokeWidth={2.5} />
          </button>
        )}

        <button
          type="button"
          className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold transition-colors hover:bg-surface"
        >
          <SlidersHorizontal className="size-4" strokeWidth={2} />
          Filter
        </button>
      </section>

      {/* Open-source banner */}
      <section className="flex items-center gap-3 rounded-xl bg-surface px-4 py-2.5">
        <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold tracking-wide text-white">
          OPEN SOURCE
        </span>
        <p className="text-sm text-ink">
          Loupe is open source and free forever — every app and screen included.{" "}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="font-semibold underline underline-offset-2 hover:opacity-70"
          >
            Star it on GitHub
          </a>
        </p>
      </section>

      {/* Results */}
      <section className="mt-8 pb-16">
        {results.isLoading && <CardSkeletons isWeb={isWeb} />}

        {results.isError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
            <p className="font-bold">Couldn't load data from Supabase</p>
            <p className="mt-1">{results.error.message}</p>
          </div>
        )}

        {results.isSuccess && results.data.length === 0 && (
          <p className="py-12 text-center text-muted">
            Nothing on {isWeb ? "Web" : "iOS"} matches
            {searching ? ` “${search.trim()}”` : " this filter"} yet.
          </p>
        )}

        {results.isSuccess && !showingScreens && sortedApps.length > 0 && (
          <div
            className={cn(
              "grid gap-x-6 gap-y-10",
              isWeb
                ? "grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            )}
          >
            {sortedApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                platform={platform}
                onOpen={() => onOpenApp(app.slug)}
              />
            ))}
          </div>
        )}

        {results.isSuccess && showingScreens && results.data.length > 0 && (
          <ScreensGrid platform={platform}>
            {results.data.map((screen) => (
              <ScreenCard
                key={screen.id}
                screen={screen}
                caption={screen.apps?.name}
                onClick={() => screen.apps && onOpenApp(screen.apps.slug)}
              />
            ))}
          </ScreensGrid>
        )}
      </section>
    </main>
  );
}
