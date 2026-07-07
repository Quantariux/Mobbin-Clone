import { useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { LogoMark } from "./brand";

export default function AuthModal({ mode: initialMode = "signin", onClose }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.user && !data.session) {
          setNotice("Check your inbox — confirm your email, then sign in.");
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <LogoMark className="size-10" />
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="cursor-pointer rounded-full p-1.5 text-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </div>

        <h2 className="mt-5 text-2xl font-extrabold tracking-tight">
          {mode === "signup" ? "Join Loupe for free" : "Welcome back"}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {mode === "signup"
            ? "Save screens into your own collections."
            : "Sign in to get back to your collections."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-xl border border-line px-4 py-2.5 text-[15px] outline-none placeholder:text-muted focus:border-ink"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6 characters)"
            className="w-full rounded-xl border border-line px-4 py-2.5 text-[15px] outline-none placeholder:text-muted focus:border-ink"
          />

          {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
          {notice && <p className="text-sm font-medium text-emerald-600">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full cursor-pointer rounded-full bg-ink py-3 text-[15px] font-semibold text-white transition-colors hover:bg-black/80 disabled:opacity-50"
          >
            {busy ? "One moment..." : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          {mode === "signup" ? "Already have an account?" : "New to Loupe?"}{" "}
          <button
            type="button"
            onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
            className="cursor-pointer font-semibold text-ink underline underline-offset-2"
          >
            {mode === "signup" ? "Sign in" : "Create account"}
          </button>
        </p>
      </div>
    </div>
  );
}
