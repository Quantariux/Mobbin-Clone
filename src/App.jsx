import { useEffect, useState } from "react";
import { cn } from "./lib/utils";
import { supabaseConfigured } from "./lib/supabase";
import TopNav from "./components/TopNav";
import Footer from "./components/Footer";
import BrowseView from "./views/BrowseView";
import DetailView from "./views/DetailView";
import LandingView from "./views/LandingView";
import { LogoMark } from "./components/brand";

const VIEWS = [
  { id: "browse", label: "Browse" },
  { id: "detail", label: "App detail" },
  { id: "landing", label: "Landing" },
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
  const [view, setView] = useState("browse");
  const [appSlug, setAppSlug] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // debounce nav search -> live searchApps query
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // typing a search always lands you on the browse grid
  useEffect(() => {
    if (search && view !== "browse") setView("browse");
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!supabaseConfigured) return <SetupNotice />;

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
          onLogoClick={() => setView("browse")}
          searchValue={searchInput}
          onSearchChange={setSearchInput}
        />
      )}

      <div className="flex-1">
        {view === "browse" && (
          <BrowseView search={search} onClearSearch={clearSearch} onOpenApp={openApp} />
        )}
        {view === "detail" && <DetailView appSlug={appSlug} />}
        {view === "landing" && <LandingView onExplore={() => setView("browse")} />}
      </div>

      <Footer />

      {/* Demo-only view switcher */}
      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 rounded-full bg-ink/90 p-1 shadow-[0_12px_32px_rgba(0,0,0,0.35)] backdrop-blur">
        {VIEWS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            className={cn(
              "cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              view === id ? "bg-white text-ink" : "text-white/70 hover:text-white",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
