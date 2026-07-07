import { useEffect, useState } from "react";
import { cn } from "./lib/utils";
import { supabaseConfigured } from "./lib/supabase";
import { useAuth } from "./lib/auth";
import TopNav from "./components/TopNav";
import Footer from "./components/Footer";
import BrowseView from "./views/BrowseView";
import DetailView from "./views/DetailView";
import LandingView from "./views/LandingView";
import { LogoMark } from "./components/brand";

const PLATFORMS = [
  { id: "ios", label: "iOS" },
  { id: "web", label: "Web" },
  { id: "android", label: "Android", comingSoon: true },
];

function SetupNotice() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <LogoMark className="size-14" />
      <h1 className="text-2xl font-extrabold tracking-tight">Connect Supabase to continue</h1>
      <p className="max-w-md text-[15px] leading-relaxed text-muted">
        Add <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-sm">VITE_SUPABASE_URL</code> and{" "}
        <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-sm">VITE_SUPABASE_ANON_KEY</code> to{" "}
        <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-sm">.env</code>, restart the dev
        server, run <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-sm">supabase/schema.sql</code>{" "}
        in the SQL editor, then seed with{" "}
        <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-sm">node supabase/seed.mjs</code>.
      </p>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();
  const [view, setView] = useState(null); // resolved once auth state is known
  const [platform, setPlatform] = useState("ios");
  const [appSlug, setAppSlug] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // signed-out visitors land on marketing; signed-in users go straight to browse
  useEffect(() => {
    if (!loading && view === null) setView(user ? "browse" : "landing");
  }, [loading, view, user]);

  // signing in from the landing page enters the app
  useEffect(() => {
    if (user && view === "landing") setView("browse");
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // debounce nav search -> live searchApps query
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // typing a search always lands you on the browse grid
  useEffect(() => {
    if (search && view === "detail") setView("browse");
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!supabaseConfigured) return <SetupNotice />;
  if (view === null) return null;

  const openApp = (slug) => {
    setAppSlug(slug);
    setView("detail");
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearch("");
  };

  return (
    <div className="flex min-h-screen flex-col">
      {view !== "landing" && (
        <TopNav
          platform={platform}
          onLogoClick={() => setView("browse")}
          searchValue={searchInput}
          onSearchChange={setSearchInput}
        />
      )}

      <div className="flex-1">
        {view === "browse" && (
          <BrowseView
            platform={platform}
            search={search}
            onClearSearch={clearSearch}
            onOpenApp={openApp}
          />
        )}
        {view === "detail" && <DetailView appSlug={appSlug} platform={platform} />}
        {view === "landing" && <LandingView onExplore={() => setView("browse")} />}
      </div>

      <Footer />

      {/* Global platform switcher — like the real thing: iOS / Web, Android later */}
      {view !== "landing" && (
        <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 rounded-full bg-ink/90 p-1 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur">
          {PLATFORMS.map(({ id, label, comingSoon }) => (
            <button
              key={id}
              type="button"
              disabled={comingSoon}
              title={comingSoon ? "Coming soon" : undefined}
              onClick={() => setPlatform(id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                comingSoon
                  ? "cursor-not-allowed text-white/35"
                  : platform === id
                    ? "cursor-pointer bg-white text-ink"
                    : "cursor-pointer text-white/70 hover:text-white",
              )}
            >
              {label}
              {comingSoon && (
                <span className="rounded-full bg-white/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide">
                  soon
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
