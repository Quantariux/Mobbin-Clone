import { Logo } from "./brand";
import { GITHUB_URL } from "../lib/constants";

export default function Footer() {
  return (
    <footer className="flex items-center justify-between bg-footer px-6 py-4">
      <Logo
        inverted
        markClassName="size-6"
        wordClassName="text-[17px] text-white"
      />
      <div className="flex items-center gap-6">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-white/70 transition-colors hover:text-white"
        >
          Open source on GitHub
        </a>
        <div className="flex items-center gap-2.5">
          <span className="text-sm text-white/70">curated by</span>
          <Logo
            inverted
            markClassName="size-6"
            wordClassName="text-[17px] text-white"
          />
        </div>
      </div>
    </footer>
  );
}
