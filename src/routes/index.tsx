import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { requireStaff } from "@/lib/gate.functions";
import {
  getLiveQueue,
  updateCounterServer,
  broadcastNoticeServer,
  bumpPriorityServer,
  transferTokenServer,
  cancelTokenServer,
  issueTokenServer,
} from "@/lib/queue.functions";
import {
  LIVE_FACILITIES,
  getFacilityState,
  updateCounter,
  broadcastPublicNotice,
  bumpTokenPriority,
  cancelLiveToken,
  issueLiveToken,
} from "@/lib/queue-store";
import type { LiveFacilityState, Priority, LiveDesk, LiveToken } from "@/lib/types";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    await requireStaff();
  },
  head: () => ({
    meta: [
      { title: "Live Operations Control Room — QueueSense.ai" },
      {
        name: "description",
        content:
          "Real-time queue monitoring, dynamic counter rebalancing, priority equity tracking, and emergency surge escalation.",
      },
    ],
  }),
  component: ControlRoomDashboard,
});

function ControlRoomDashboard() {
  const [facilityId, setFacilityId] = useState("hospital");
  const [facilityState, setFacilityState] = useState<LiveFacilityState | null>(null);
  const [selectedDeskId, setSelectedDeskId] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastLevel, setBroadcastLevel] = useState<"info" | "warning" | "critical">("info");
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickIssueDesk, setQuickIssueDesk] = useState("");
  const [quickIssuePriority, setQuickIssuePriority] = useState<Priority>("general");

  const fetchState = useServerFn(getLiveQueue);
  const updateCounterFn = useServerFn(updateCounterServer);
  const broadcastFn = useServerFn(broadcastNoticeServer);
  const bumpPriorityFn = useServerFn(bumpPriorityServer);
  const transferFn = useServerFn(transferTokenServer);
  const cancelFn = useServerFn(cancelTokenServer);
  const issueFn = useServerFn(issueTokenServer);

  async function refresh(targetFacility = facilityId) {
    try {
      let state: LiveFacilityState | null = null;
      try {
        state = await fetchState({ data: { facilityId: targetFacility } });
      } catch {
        // static fallback
      }
      if (!state || !state.facility) {
        state = getFacilityState(targetFacility);
      }
      setFacilityState(state);
    } catch (err) {
      console.error("Control room state fetch failed:", err);
      const fallback = getFacilityState(targetFacility);
      if (fallback) setFacilityState(fallback);
    }
  }

  useEffect(() => {
    if (!quickIssueDesk && facilityState?.facility.desks.length) {
      setQuickIssueDesk(facilityState.facility.desks[0]!.id);
    }
  }, [facilityState?.facility.desks, quickIssueDesk]);

  useEffect(() => {
    refresh();
    const iv = setInterval(() => refresh(), 3000);
    return () => clearInterval(iv);
  }, [facilityId]);

  const activeFacility = LIVE_FACILITIES.find((f) => f.id === facilityId) ?? LIVE_FACILITIES[0]!;

  // Counter management
  async function adjustCountersForDesk(desk: LiveDesk, delta: number) {
    if (!facilityState) return;
    setBusy(true);
    try {
      const deskCounters = facilityState.counters.filter((c) => c.pointId === desk.id);
      if (delta > 0) {
        // Open a closed/paused counter or add an active one
        const inactive = deskCounters.find((c) => c.status !== "open");
        if (inactive) {
          try {
            await updateCounterFn({
              data: { facilityId, counterId: inactive.id, status: "open" },
            });
          } catch {
            updateCounter(facilityId, inactive.id, { status: "open" });
          }
        }
      } else {
        // Close an open counter
        const active = deskCounters.find((c) => c.status === "open" && !c.currentServingTokenId);
        if (active) {
          try {
            await updateCounterFn({
              data: { facilityId, counterId: active.id, status: "closed" },
            });
          } catch {
            updateCounter(facilityId, active.id, { status: "closed" });
          }
        }
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  // Token actions
  async function handleBumpPriority(tok: LiveToken, newPrio: Priority) {
    setBusy(true);
    try {
      try {
        await bumpPriorityFn({
          data: { facilityId, tokenId: tok.id, priority: newPrio },
        });
      } catch {
        bumpTokenPriority(facilityId, tok.id, newPrio);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelToken(tok: LiveToken) {
    if (!confirm(`Cancel Token ${tok.tokenNumber}?`)) return;
    setBusy(true);
    try {
      try {
        await cancelFn({ data: { facilityId, tokenId: tok.id } });
      } catch {
        cancelLiveToken(facilityId, tok.id);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleQuickIssue() {
    if (!quickIssueDesk) return;
    setBusy(true);
    try {
      try {
        await issueFn({
          data: {
            facilityId,
            pointId: quickIssueDesk,
            priority: quickIssuePriority,
          },
        });
      } catch {
        issueLiveToken(facilityId, quickIssueDesk, quickIssuePriority);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleBroadcast() {
    if (!broadcastText.trim()) return;
    setBusy(true);
    try {
      try {
        await broadcastFn({
          data: {
            facilityId,
            text: broadcastText.trim(),
            level: broadcastLevel,
          },
        });
      } catch {
        broadcastPublicNotice(facilityId, broadcastText.trim(), broadcastLevel);
      }
      setBroadcastText("");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  // Export handlers
  function exportCSV() {
    if (!facilityState) return;
    const headers = [
      "TokenNumber",
      "ServiceDesk",
      "Priority",
      "Status",
      "WaitEstimatedMin",
      "CreatedAt",
      "CounterAssigned",
      "Operator",
    ];
    const rows = facilityState.tokens.map((t) => [
      t.tokenNumber,
      `"${t.pointName}"`,
      t.priority,
      t.status,
      t.estimatedWaitMinutes,
      new Date(t.createdAt).toISOString(),
      t.counterName || "Unassigned",
      t.operatorName || "N/A",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `QueueSense_${facilityId}_Shift_Audit.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function exportJSON() {
    if (!facilityState) return;
    const blob = new Blob([JSON.stringify(facilityState, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `QueueSense_${facilityId}_State.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const metrics = facilityState?.metrics;
  const filteredTokens = (facilityState?.tokens ?? []).filter((tok) => {
    if (selectedDeskId !== "all" && tok.pointId !== selectedDeskId) return false;
    if (selectedPriority !== "all" && tok.priority !== selectedPriority) return false;
    if (searchQuery && !tok.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Facility Selector */}
      <div className="hero-surface p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="chip">
                <span className="pulse-dot" /> Live Operations Room
              </span>
              <span className="chip font-mono text-[11px]">Real-Time Active System</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              {activeFacility.name}
            </h1>
            <p className="text-xs text-muted-foreground">
              {activeFacility.kind} · Real-time queue telemetry, dynamic desk allocation, SLA
              compliance, and public display sync.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={facilityId}
              onChange={(e) => setFacilityId(e.target.value)}
              className="rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-bold text-foreground"
            >
              {LIVE_FACILITIES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            <a
              href="/counter"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary text-xs px-3 py-2"
            >
              ↗ Open Counter Terminal
            </a>
            <a
              href="/display"
              target="_blank"
              rel="noreferrer"
              className="btn btn-primary text-xs px-3 py-2 font-bold"
            >
              ↗ Open Public TV Display
            </a>
          </div>
        </div>
      </div>

      {/* Primary Telemetry Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
        <div className="card-signal p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Waiting in Queue
          </span>
          <div className="mt-1 font-mono text-3xl font-black text-foreground">
            {metrics?.totalWaiting ?? 0}
          </div>
          <span className="text-[10px] text-muted-foreground">Across all desks</span>
        </div>

        <div className="card-signal p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Now Serving
          </span>
          <div className="mt-1 font-mono text-3xl font-black text-primary">
            {metrics?.totalServing ?? 0}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {metrics?.openCountersCount ?? 0} Counters Open
          </span>
        </div>

        <div className="card-signal p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            SLA Adherence
          </span>
          <div
            className="mt-1 font-mono text-3xl font-black"
            style={{
              color:
                (metrics?.slaAdherencePercent ?? 100) >= 85
                  ? "var(--color-ok)"
                  : "var(--color-warn)",
            }}
          >
            {metrics?.slaAdherencePercent ?? 100}%
          </div>
          <span className="text-[10px] text-muted-foreground">Target &gt; 85%</span>
        </div>

        <div className="card-signal p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Avg Wait Time
          </span>
          <div className="mt-1 font-mono text-3xl font-black text-foreground">
            {metrics?.avgWaitMinutes ?? 0}m
          </div>
          <span className="text-[10px] text-muted-foreground">Live rolling avg</span>
        </div>

        <div className="card-signal p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Fairness Index
          </span>
          <div className="mt-1 font-mono text-3xl font-black text-foreground">
            {metrics?.fairnessScore ?? 100}
            <span className="text-sm font-normal text-muted-foreground">/100</span>
          </div>
          <span className="text-[10px] text-muted-foreground">
            Equity Gap: {metrics?.equityGapMinutes ?? 0}m
          </span>
        </div>

        <div className="card-signal p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Shift Completed
          </span>
          <div className="mt-1 font-mono text-3xl font-black text-foreground">
            {metrics?.totalCompleted ?? 0}
          </div>
          <span className="text-[10px] text-muted-foreground">
            {metrics?.totalNoShow ?? 0} No-Shows
          </span>
        </div>
      </div>

      {/* Middle Section: Desk Staffing & Real Counter Allocation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Live Service Desks & Staff Counters
            </h2>
            <p className="text-xs text-muted-foreground">
              Adjust open counters in real-time to match live demand and maintain SLA compliance.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={exportCSV}
              className="btn border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary"
            >
              📥 Export CSV Audit
            </button>
            <button
              type="button"
              onClick={exportJSON}
              className="btn border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary"
            >
              📥 Export JSON State
            </button>
          </div>
        </div>

        {/* Desks Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {activeFacility.desks.map((desk) => {
            const deskCounters = facilityState?.counters.filter((c) => c.pointId === desk.id) ?? [];
            const openCount = deskCounters.filter((c) => c.status === "open").length;
            const waitingCount =
              facilityState?.tokens.filter((t) => t.status === "waiting" && t.pointId === desk.id)
                .length ?? 0;
            const isBottleneck = waitingCount > openCount * 4;

            return (
              <div
                key={desk.id}
                className={`rounded-xl border p-4 transition-all ${
                  isBottleneck
                    ? "border-amber-500/60 bg-amber-500/10"
                    : "border-border bg-surface-2/60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{desk.name}</h3>
                    <span className="text-[11px] text-muted-foreground">
                      SLA: <strong className="text-primary">{desk.slaMinutes}m</strong> · Target:{" "}
                      {desk.ratePerHour}/hr
                    </span>
                  </div>
                  {isBottleneck && (
                    <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-black uppercase text-black">
                      Surge Alert
                    </span>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 border-y border-border/40 py-2 text-center">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground">Waiting</span>
                    <div className="font-mono text-xl font-bold text-foreground">
                      {waitingCount}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground">
                      Active Desks
                    </span>
                    <div className="font-mono text-xl font-bold text-primary">{openCount}</div>
                  </div>
                </div>

                {/* Counter Stepper */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">
                    Staff Allocation:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={busy || openCount <= 1}
                      onClick={() => adjustCountersForDesk(desk, -1)}
                      className="grid h-7 w-7 place-items-center rounded bg-surface border border-border text-sm font-bold hover:border-primary disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="font-mono text-sm font-bold px-2">{openCount}</span>
                    <button
                      type="button"
                      disabled={busy || openCount >= desk.maxCounters}
                      onClick={() => adjustCountersForDesk(desk, 1)}
                      className="grid h-7 w-7 place-items-center rounded bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Dual Grid: Live Queue Management (Left) & Controls/Broadcast (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Live Queue Inspection & Actions */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-lg">
            <div className="flex flex-col justify-between gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-base font-bold text-foreground">Live Queue Manager</h2>
                <p className="text-xs text-muted-foreground">
                  View and manage real visitor tokens across all lanes.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search token..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-md border border-border bg-surface-2 px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground outline-none"
                />

                <select
                  value={selectedDeskId}
                  onChange={(e) => setSelectedDeskId(e.target.value)}
                  className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-foreground"
                >
                  <option value="all">All Desks</option>
                  {activeFacility.desks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="rounded-md border border-border bg-surface-2 px-2 py-1 text-xs text-foreground"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="priority">Priority</option>
                  <option value="general">General</option>
                </select>
              </div>
            </div>

            {/* Tokens Table */}
            <div className="mt-4 max-h-[460px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-2 font-semibold">Token</th>
                    <th className="pb-2 font-semibold">Desk</th>
                    <th className="pb-2 font-semibold">Priority</th>
                    <th className="pb-2 font-semibold">Status</th>
                    <th className="pb-2 font-semibold">Wait Time</th>
                    <th className="pb-2 text-right font-semibold">Supervisor Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredTokens.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No matching tokens found in queue.
                      </td>
                    </tr>
                  ) : (
                    filteredTokens.map((tok) => (
                      <tr key={tok.id} className="hover:bg-surface-2/40">
                        <td className="py-2.5 font-mono font-bold text-foreground">
                          {tok.tokenNumber}
                        </td>
                        <td className="py-2.5 text-foreground max-w-[140px] truncate">
                          {tok.pointName}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase ${
                              tok.priority === "critical"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                                : tok.priority === "priority"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                  : "bg-surface-2 text-muted-foreground"
                            }`}
                          >
                            {tok.priority}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              tok.status === "serving" || tok.status === "called"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : tok.status === "completed"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-surface text-muted-foreground"
                            }`}
                          >
                            {tok.status}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-muted-foreground">
                          {tok.status === "waiting" ? `~${tok.estimatedWaitMinutes}m` : "—"}
                        </td>
                        <td className="py-2.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {tok.status === "waiting" && tok.priority !== "critical" && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleBumpPriority(tok, "critical")}
                                className="rounded bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-400 hover:bg-rose-500/20"
                                title="Fast-track to Critical Priority"
                              >
                                ⚡ Urgent
                              </button>
                            )}

                            {tok.status === "waiting" && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleCancelToken(tok)}
                                className="rounded bg-surface-2 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-rose-400"
                                title="Cancel Token"
                              >
                                ✕ Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Dispense, Public Broadcast, & Decision Audit Log */}
        <div className="space-y-4">
          {/* Quick Dispense at Desk */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-lg">
            <h3 className="text-sm font-bold text-foreground">Issue Token at Desk</h3>
            <p className="text-xs text-muted-foreground">
              Generate token on behalf of a walk-in visitor.
            </p>

            <div className="mt-3 space-y-2.5">
              <select
                value={quickIssueDesk}
                onChange={(e) => setQuickIssueDesk(e.target.value)}
                className="w-full rounded border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-foreground"
              >
                {activeFacility.desks.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

              <div className="flex gap-1.5">
                {(["general", "priority", "critical"] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQuickIssuePriority(p)}
                    className={`flex-1 rounded py-1 text-[11px] font-bold uppercase transition-all ${
                      quickIssuePriority === p
                        ? "bg-primary text-primary-foreground shadow"
                        : "bg-surface-2 text-muted-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={handleQuickIssue}
                className="btn btn-primary w-full py-2 text-xs font-bold"
              >
                + Dispense Walk-In Token
              </button>
            </div>
          </div>

          {/* Multilingual Public Broadcast Bar */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-lg">
            <h3 className="text-sm font-bold text-foreground">Public Screen Announcement</h3>
            <p className="text-xs text-muted-foreground">
              Broadcast a live banner alert to all visitor phones and waiting displays.
            </p>

            <div className="mt-3 space-y-2.5">
              <textarea
                rows={2}
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="Type public notice (e.g. Please have original ID cards ready for Document Verification)..."
                className="w-full rounded border border-border bg-surface-2 p-2 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
              />

              <div className="flex items-center justify-between gap-2">
                <select
                  value={broadcastLevel}
                  onChange={(e) =>
                    setBroadcastLevel(e.target.value as "info" | "warning" | "critical")
                  }
                  className="rounded border border-border bg-surface-2 px-2 py-1 text-[11px] text-foreground"
                >
                  <option value="info">Info Notice</option>
                  <option value="warning">Warning Alert</option>
                  <option value="critical">Critical Surge</option>
                </select>

                <button
                  type="button"
                  disabled={busy || !broadcastText.trim()}
                  onClick={handleBroadcast}
                  className="btn btn-primary px-3 py-1 text-xs font-bold"
                >
                  📣 Send Broadcast
                </button>
              </div>
            </div>
          </div>

          {/* Supervisor Decision & Audit Feed */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-lg">
            <h3 className="text-sm font-bold text-foreground">Shift Audit Log</h3>
            <div className="mt-3 max-h-[220px] space-y-2 overflow-y-auto pr-1">
              {facilityState?.decisionLog.slice(0, 8).map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-border/50 bg-surface-2/40 p-2 text-xs"
                >
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="font-mono font-bold text-primary">{log.time}</span>
                    <span className="uppercase">{log.type.replace("_", " ")}</span>
                  </div>
                  <p className="mt-1 text-foreground">{log.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
