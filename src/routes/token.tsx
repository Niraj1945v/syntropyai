import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { LANGS, t, type Lang } from "@/lib/i18n";
import {
  LIVE_FACILITIES,
  playQueueChime,
  getFacilityState,
  issueLiveToken,
  cancelLiveToken,
} from "@/lib/queue-store";
import { issueTokenServer, getLiveQueue, cancelTokenServer } from "@/lib/queue.functions";
import type { LiveFacilityState, LiveToken, Priority } from "@/lib/types";

export const Route = createFileRoute("/token")({
  head: () => ({
    meta: [
      { title: "Visitor Token & Live Wait Time — QueueSense.ai" },
      {
        name: "description",
        content:
          "Live zero-PII visitor token with real-time queue position, estimated waiting time, accessible priority lanes, and audio updates in multiple languages.",
      },
      { property: "og:title", content: "Visitor Token & Live Wait Time" },
      {
        property: "og:description",
        content:
          "Check your live queue position and estimated wait in your own language — no personal data required.",
      },
    ],
  }),
  component: TokenPage,
});

function TokenPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [facilityId, setFacilityId] = useState("hospital");
  const [pointId, setPointId] = useState("");
  const [priority, setPriority] = useState<Priority>("general");
  const [activeTokenId, setActiveTokenId] = useState<string | null>(null);
  const [facilityState, setFacilityState] = useState<LiveFacilityState | null>(null);
  const [busy, setBusy] = useState(false);
  const [hasChimedForCall, setHasChimedForCall] = useState(false);

  const issueFn = useServerFn(issueTokenServer);
  const fetchState = useServerFn(getLiveQueue);
  const cancelFn = useServerFn(cancelTokenServer);

  // Restore saved token from local storage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("queuesense_active_token_id");
      if (saved) setActiveTokenId(saved);
    } catch (e) {
      console.warn("Storage not available:", e);
    }
  }, []);

  // Poll state
  async function refresh(targetFacility = facilityId) {
    try {
      let state: LiveFacilityState | null = null;
      try {
        state = await fetchState({ data: { facilityId: targetFacility } });
      } catch {
        // Fallback for static hosting
      }
      if (!state || !state.facility) {
        state = getFacilityState(targetFacility);
      }
      setFacilityState(state);
    } catch (err) {
      console.error("Token state refresh error:", err);
      const fallback = getFacilityState(targetFacility);
      if (fallback) setFacilityState(fallback);
    }
  }

  useEffect(() => {
    refresh();
    const iv = setInterval(() => refresh(), 2500);
    return () => clearInterval(iv);
  }, [facilityId]);

  const activeFacility = LIVE_FACILITIES.find((f) => f.id === facilityId) ?? LIVE_FACILITIES[0]!;

  // Default pointId
  useEffect(() => {
    if (!pointId && activeFacility.desks.length > 0) {
      setPointId(activeFacility.desks[0]!.id);
    }
  }, [activeFacility, pointId]);

  // Find active live token
  const liveToken: LiveToken | undefined = facilityState?.tokens.find(
    (t) => t.id === activeTokenId,
  );

  // If called/serving, trigger audio chime once
  useEffect(() => {
    if ((liveToken?.status === "called" || liveToken?.status === "serving") && !hasChimedForCall) {
      setHasChimedForCall(true);
      playQueueChime();
    }
  }, [liveToken?.status, hasChimedForCall]);

  async function handleIssueToken() {
    if (!pointId) return;
    setBusy(true);
    try {
      let token: LiveToken | null = null;
      try {
        token = await issueFn({
          data: {
            facilityId,
            pointId,
            priority,
          },
        });
      } catch {
        // Fallback for static hosting
      }
      if (!token) {
        token = issueLiveToken(facilityId, pointId, priority);
      }
      setActiveTokenId(token.id);
      setHasChimedForCall(false);
      try {
        localStorage.setItem("queuesense_active_token_id", token.id);
      } catch (e) {
        console.warn("Storage not available:", e);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelToken() {
    if (!activeTokenId) return;
    setBusy(true);
    try {
      try {
        await cancelFn({ data: { facilityId, tokenId: activeTokenId } });
      } catch {
        cancelLiveToken(facilityId, activeTokenId);
      }
      setActiveTokenId(null);
      try {
        localStorage.removeItem("queuesense_active_token_id");
      } catch (e) {
        console.warn("Storage not available:", e);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const laneKey =
    priority === "critical"
      ? "criticalLane"
      : priority === "priority"
        ? "priorityLane"
        : "generalLane";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Top Header */}
      <section className="hero-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="chip">
              <span className="pulse-dot" /> Live Visitor Portal
            </span>
            <h1 className="mt-2 text-xl font-bold sm:text-2xl">{activeFacility.name}</h1>
          </div>
          <div className="flex flex-wrap gap-1">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  lang === l.code
                    ? "bg-primary text-primary-foreground font-bold"
                    : "border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Ticket Generator (when no active token) */}
      {!liveToken && (
        <section className="panel space-y-4 p-6 shadow-xl">
          <div>
            <h2 className="font-display text-lg font-bold">{t(lang, "getToken")}</h2>
            <p className="text-xs text-muted-foreground">
              Generate an anonymous, zero-PII pass for on-demand queuing.
            </p>
          </div>

          <Field label="Facility">
            <select
              className="btn w-full justify-start text-xs font-semibold"
              value={facilityId}
              onChange={(e) => {
                const f = LIVE_FACILITIES.find((x) => x.id === e.target.value)!;
                setFacilityId(f.id);
                setPointId(f.desks[0]!.id);
              }}
            >
              {LIVE_FACILITIES.map((f) => (
                <option key={f.id} value={f.id} className="bg-surface">
                  {f.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t(lang, "service")}>
            <select
              className="btn w-full justify-start text-xs font-semibold"
              value={pointId}
              onChange={(e) => setPointId(e.target.value)}
            >
              {activeFacility.desks.map((d) => (
                <option key={d.id} value={d.id} className="bg-surface">
                  {d.name} (SLA: {d.slaMinutes}m)
                </option>
              ))}
            </select>
          </Field>

          <Field label={t(lang, "needs")}>
            <div className="space-y-2">
              {(["general", "priority", "critical"] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition-all ${
                    priority === p
                      ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/40"
                      : "border-border bg-surface-2/60 hover:bg-surface-2"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-foreground">{t(lang, p)}</span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        p === "critical"
                          ? "bg-rose-500/20 text-rose-400"
                          : p === "priority"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-surface text-muted-foreground"
                      }`}
                    >
                      {p}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Field>

          <button
            className="btn btn-primary w-full py-3 text-sm font-bold shadow-lg"
            disabled={busy}
            onClick={handleIssueToken}
          >
            {busy ? "Generating Token…" : t(lang, "issue")}
          </button>
          <p className="text-center text-xs text-muted-foreground">{t(lang, "privacy")}</p>
        </section>
      )}

      {/* Active Live Token Display */}
      {liveToken && (
        <div className="space-y-5">
          {/* Called Banner */}
          {(liveToken.status === "called" || liveToken.status === "serving") && (
            <div className="animate-pulse rounded-xl border-2 border-emerald-500 bg-emerald-500/20 p-5 text-center shadow-2xl">
              <span className="inline-block rounded-full bg-emerald-500 px-3 py-1 text-xs font-black uppercase text-black">
                🔔 IT'S YOUR TURN NOW!
              </span>
              <h2 className="mt-2 text-2xl font-black text-emerald-400 sm:text-3xl">
                Please proceed to {liveToken.counterName ?? "Assigned Counter"}
              </h2>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                Staff member{" "}
                <span className="font-bold text-foreground">
                  {liveToken.operatorName ?? "Desk Officer"}
                </span>{" "}
                is ready to assist you.
              </p>
            </div>
          )}

          {/* Ticket Card */}
          <section className="panel p-6 text-center shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t(lang, "yourToken")}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold uppercase ${
                  liveToken.status === "serving" || liveToken.status === "called"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : liveToken.status === "completed"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-primary/20 text-primary border border-primary/40"
                }`}
              >
                ● {liveToken.status.toUpperCase()}
              </span>
            </div>

            <p className="my-4 font-mono text-5xl font-black tracking-tight text-primary sm:text-6xl">
              {liveToken.tokenNumber}
            </p>

            <div className="flex items-center justify-center gap-2">
              <span
                className="chip"
                style={{
                  color: `var(--color-${liveToken.priority === "critical" ? "danger" : liveToken.priority === "priority" ? "warn" : "primary"})`,
                }}
              >
                {t(lang, laneKey)}
              </span>
            </div>

            {/* Waiting Metrics */}
            {liveToken.status === "waiting" && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/60 bg-surface-2 p-4 text-center">
                  <p className="stat-value">{liveToken.queuePosition}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t(lang, "peopleAhead")}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-surface-2 p-4 text-center">
                  <p className="stat-value text-primary">~{liveToken.estimatedWaitMinutes}m</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t(lang, "estWait")} ({t(lang, "minutes")})
                  </p>
                </div>
              </div>
            )}

            {/* Details Table */}
            <div className="mt-6 space-y-2 rounded-xl border border-border/50 bg-surface-2/50 p-4 text-left text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Desk:</span>
                <span className="font-bold text-foreground">{liveToken.pointName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Facility:</span>
                <span className="font-semibold text-foreground">{activeFacility.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issued At:</span>
                <span className="font-mono text-muted-foreground">
                  {new Date(liveToken.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {liveToken.counterName && (
                <div className="flex justify-between border-t border-border/50 pt-2 font-bold text-primary">
                  <span>Assigned Counter:</span>
                  <span>{liveToken.counterName}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTokenId(null);
                  try {
                    localStorage.removeItem("queuesense_active_token_id");
                  } catch (e) {
                    console.warn("Storage not available:", e);
                  }
                }}
                className="btn border border-border bg-surface px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                + Issue Another Token
              </button>

              {liveToken.status === "waiting" && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleCancelToken}
                  className="btn border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/20"
                >
                  Cancel My Token
                </button>
              )}
            </div>
          </section>

          {/* Live Notice / Updates Feed */}
          <section className="panel p-5">
            <h2 className="font-display text-base font-bold">{t(lang, "updates")}</h2>
            <ul className="mt-3 space-y-2 text-xs">
              <li className="flex gap-3 rounded-lg bg-surface-2 p-3">
                <span className="font-mono font-bold text-primary">Live</span>
                <span className="text-foreground">
                  {facilityState?.notices[0]?.text ??
                    "Priority scheduling active. Please remain in the waiting area."}
                </span>
              </li>
              <li className="flex gap-3 rounded-lg bg-surface-2 p-3">
                <span className="font-mono font-bold text-muted-foreground">Audio</span>
                <span className="text-muted-foreground">
                  Your token will chime automatically when called by the counter officer.
                </span>
              </li>
            </ul>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {t(lang, "fairnessNote")}
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
