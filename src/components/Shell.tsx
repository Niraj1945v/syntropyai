import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import type { ReactNode } from "react";
import { staffSignOut } from "@/lib/gate.functions";

export function Shell({ children, signedIn = false }: { children: ReactNode; signedIn?: boolean }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const signOut = useServerFn(staffSignOut);
  const tabs = [
    { to: "/", label: "Control Room" },
    { to: "/counter", label: "Counter Terminal" },
    { to: "/display", label: "Public Display" },
    { to: "/token", label: "Visitor Token" },
    { to: "/about", label: "Architecture" },
  ];

  async function handleSignOut() {
    try {
      await signOut({});
      await router.invalidate();
    } finally {
      window.location.href = "/staff-login";
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span
              className="grid h-8 w-8 place-items-center rounded-lg font-display text-sm font-bold text-primary-foreground"
              style={{ backgroundImage: "var(--gradient-signal)" }}
            >
              Q
            </span>
            <span className="font-display text-sm font-bold tracking-tight sm:text-base">
              QueueSense<span className="text-primary">.ai</span>
            </span>
          </Link>
          <nav className="ml-auto flex gap-1 rounded-full border border-border bg-surface p-1">
            {tabs.map((tb) => {
              const active = path === tb.to;
              return (
                <Link
                  key={tb.to}
                  to={tb.to}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tb.label}
                </Link>
              );
            })}
          </nav>
          {signedIn ? (
            <div className="flex items-center gap-2">
              <span className="chip">Staff session</span>
              <button
                onClick={handleSignOut}
                className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/staff-login"
              className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Staff sign in
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 pt-4 text-xs text-muted-foreground">
        Privacy-conscious by design — anonymous token codes and aggregate occupancy counts only. No
        faces, names or identifiers are stored. Simulated data for demonstration.
      </footer>
    </div>
  );
}
