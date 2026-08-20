import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const tabs = [
    { to: "/", label: "Control room" },
    { to: "/token", label: "Visitor token" },
    { to: "/about", label: "How it works" },
  ];

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
