import { cn } from "../lib/utils";

/**
 * Original "Loupe" brand mark — a squircle holding an abstract lens-and-handle
 * glyph. Invented for this practice project; not any real company's logo.
 */
export function LogoMark({ className, inverted = false }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={cn("size-8", className)}
      aria-hidden="true"
    >
      <rect
        width="40"
        height="40"
        rx="11"
        className={inverted ? "fill-white" : "fill-ink"}
      />
      <circle
        cx="17.5"
        cy="17.5"
        r="7.5"
        className={inverted ? "stroke-footer" : "stroke-white"}
        strokeWidth="4"
        fill="none"
      />
      <path
        d="M23.5 23.5 L30 30"
        className={inverted ? "stroke-footer" : "stroke-white"}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({ className }) {
  return (
    <span className={cn("text-[22px] font-extrabold tracking-tight", className)}>
      loupe
    </span>
  );
}

export function Logo({ className, inverted = false, markClassName, wordClassName }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark inverted={inverted} className={markClassName} />
      <Wordmark className={cn(inverted && "text-white", wordClassName)} />
    </span>
  );
}
