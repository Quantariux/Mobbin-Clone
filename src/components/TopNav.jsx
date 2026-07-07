import { useState } from "react";
import { Ban, Bell, Bookmark, Scan, Search } from "lucide-react";
import { Logo } from "./brand";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { useAuth } from "../lib/auth";
import { cn } from "../lib/utils";

function IconButton({ icon: Icon, label }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-10 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-surface"
    >
      <Icon className="size-[19px]" strokeWidth={1.8} />
    </button>
  );
}

export default function TopNav({ onLogoClick, searchValue, onSearchChange }) {
  const [section, setSection] = useState("Apps");
  const { user, openAuth, signOut } = useAuth();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-white">
      <div className="flex h-[68px] items-center gap-6 px-6">
        {/* Left: logo + section tabs */}
        <div className="flex items-center gap-8">
          <button
            type="button"
            onClick={onLogoClick}
            className="cursor-pointer"
            aria-label="Loupe home"
          >
            <Logo wordClassName="hidden" />
          </button>
          <nav className="flex items-center gap-6">
            {["Apps", "Sites"].map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setSection(label)}
                className={cn(
                  "cursor-pointer text-[15px] transition-colors",
                  section === label
                    ? "font-bold text-ink"
                    : "font-medium text-muted hover:text-ink",
                )}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Center: search (live — drives searchApps against Supabase) */}
        <div className="flex flex-1 justify-center">
          <div className="flex h-11 w-full max-w-[460px] items-center gap-3 rounded-full bg-surface px-4 transition-colors focus-within:bg-[#ebebec] hover:bg-[#ebebec]">
            <Search className="size-[18px] shrink-0 text-muted" strokeWidth={2} />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={`Search on ${section === "Apps" ? "iOS" : "Web"}...`}
              className="w-full bg-transparent text-[15px] text-ink outline-none placeholder:text-muted"
            />
            <button
              type="button"
              aria-label="Search by image"
              className="cursor-pointer text-muted transition-colors hover:text-ink"
            >
              <Scan className="size-[18px]" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Right: icon buttons + auth */}
        <div className="flex items-center gap-1.5">
          <IconButton icon={Bookmark} label="Saved collections" />
          <IconButton icon={Ban} label="Hidden apps" />
          <IconButton icon={Bell} label="Notifications" />

          {user ? (
            <>
              <button
                type="button"
                className="ml-2.5 cursor-pointer rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/80"
              >
                Invite member
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="ml-3 cursor-pointer outline-none" aria-label="Account">
                    <Avatar>
                      <AvatarFallback>
                        {(user.email?.[0] ?? "?").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-3 py-2 text-xs text-muted">{user.email}</div>
                  <DropdownMenuItem onSelect={() => signOut()}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => openAuth("signin")}
                className="ml-2.5 cursor-pointer rounded-full border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-surface"
              >
                Log in
              </button>
              <button
                type="button"
                onClick={() => openAuth("signup")}
                className="cursor-pointer rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-black/80"
              >
                Sign up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
