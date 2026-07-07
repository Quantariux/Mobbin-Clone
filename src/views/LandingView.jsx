import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Aperture, Hexagon, Leaf, Orbit, Triangle } from "lucide-react";
import { Logo } from "../components/brand";
import { useAuth } from "../lib/auth";
import { getStats } from "../lib/queries";
import { GITHUB_URL } from "../lib/constants";

/* Invented grayscale "customer" wordmarks — generic names, no real companies. */
const WORDMARKS = [
  { name: "Nordlys", Icon: null, className: "text-[22px] font-bold tracking-tight" },
  { name: "fernway", Icon: Leaf, className: "text-[20px] font-semibold" },
  { name: "OPTICA", Icon: Aperture, className: "text-[17px] font-bold tracking-[0.18em]" },
  { name: "halcyon", Icon: null, className: "text-[21px] font-extrabold tracking-tight" },
  { name: "Vantage", Icon: Triangle, className: "text-[20px] font-bold italic" },
  { name: "loopwork", Icon: Orbit, className: "text-[20px] font-semibold tracking-tight" },
  { name: "Quanta", Icon: Hexagon, className: "text-[20px] font-bold" },
];

/** Invented hero product icon — violet squircle with a white spark. */
function HeroIcon() {
  return (
    <svg viewBox="0 0 96 96" className="size-24" aria-hidden="true">
      <rect width="96" height="96" rx="21" className="fill-violet-600" />
      <path
        d="M48 18 C51 34, 62 45, 78 48 C62 51, 51 62, 48 78 C45 62, 34 51, 18 48 C34 45, 45 34, 48 18 Z"
        className="fill-white"
      />
    </svg>
  );
}

export default function LandingView({ onExplore }) {
  const { user, openAuth } = useAuth();
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: getStats });

  return (
    <main className="flex min-h-screen flex-col">
      {/* Floating pill nav */}
      <div className="flex justify-center px-6 pt-7">
        <div className="flex w-full max-w-2xl items-center justify-between rounded-full bg-surface py-2.5 pl-5 pr-6">
          <Logo markClassName="size-7" wordClassName="text-[19px]" />
          <nav className="flex items-center gap-7 text-[15px] font-medium">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="text-ink hover:opacity-70"
            >
              GitHub
            </a>
            <button
              type="button"
              onClick={() => (user ? onExplore() : openAuth("signin"))}
              className="cursor-pointer text-ink hover:opacity-70"
            >
              Log in
            </button>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="mx-auto flex max-w-3xl flex-col items-center px-6 pt-24 text-center">
        <HeroIcon />

        <h1 className="mt-12 text-6xl font-extrabold leading-[1.08] tracking-tight">
          The design library
          <br />
          for real products.
        </h1>

        <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
          {stats
            ? `Featuring ${stats.iosScreens.toLocaleString()} iOS and ${stats.webScreens.toLocaleString()} web screens across ${stats.apps.toLocaleString()} apps`
            : "A live library of iOS and web screens"}{" "}
          — open source and free forever.
        </p>

        <div className="mt-10 flex items-center gap-3">
          <button
            type="button"
            onClick={() => (user ? onExplore() : openAuth("signup"))}
            className="cursor-pointer rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-black/80"
          >
            Join for free
          </button>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-6 py-3 text-[15px] font-semibold transition-colors hover:bg-surface"
          >
            View on GitHub
            <ArrowRight className="size-4" strokeWidth={2} />
          </a>
        </div>

        <p className="mt-24 text-sm text-muted">Trusted by design teams at</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-neutral-400">
          {WORDMARKS.map(({ name, Icon, className }) => (
            <span key={name} className="flex items-center gap-1.5">
              {Icon && <Icon className="size-5" strokeWidth={2.2} />}
              <span className={className}>{name}</span>
            </span>
          ))}
        </div>
      </section>

      {/* Teaser panel peeking from the fold */}
      <div className="mt-24 flex-1 px-6 pb-16">
        <div className="mx-auto h-64 max-w-6xl rounded-3xl bg-surface" />
      </div>
    </main>
  );
}
