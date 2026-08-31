import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { staffSignIn } from "@/lib/gate.functions";

export const Route = createFileRoute("/staff-login")({
  head: () => ({
    meta: [
      { title: "Staff Sign In — QueueSense.ai Control Room" },
      {
        name: "description",
        content:
          "Secure staff sign-in for the QueueSense.ai control room: forecasts, counter allocation and escalation tools for facility supervisors.",
      },
      { property: "og:title", content: "Staff Sign In — QueueSense.ai" },
      {
        property: "og:description",
        content: "Supervisor access to the queue and crowd optimization control room.",
      },
    ],
  }),
  component: StaffLogin,
});

function StaffLogin() {
  const router = useRouter();
  const signIn = useServerFn(staffSignIn);
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const passcode = String(new FormData(e.currentTarget).get("passcode") ?? "");
    setBusy(true);
    setError(false);
    const res = await signIn({ data: { passcode } });
    setBusy(false);
    if (res.ok) {
      await router.invalidate();
      await router.navigate({ to: "/" });
    } else {
      setError(true);
    }
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <section className="hero-surface p-6">
        <span className="chip">
          <span className="pulse-dot" /> Restricted area
        </span>
        <h1 className="mt-3 text-2xl font-bold">Staff sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The control room holds live forecasts, staffing recommendations and escalation controls.
          Supervisors sign in with the facility passcode.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Facility passcode
          </label>
          <input
            name="passcode"
            type="password"
            autoComplete="current-password"
            required
            className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
            placeholder="Enter staff passcode"
          />
          {error && (
            <p className="text-sm" style={{ color: "var(--color-danger)" }}>
              Incorrect passcode. Please try again.
            </p>
          )}
          <button className="btn btn-primary w-full" type="submit" disabled={busy}>
            {busy ? "Verifying…" : "Enter control room"}
          </button>
        </form>

        <p className="mt-4 text-xs text-muted-foreground">
          Visitor? No sign-in needed —{" "}
          <Link to="/token" className="font-semibold text-primary">
            get your token and live wait time
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
