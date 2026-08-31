import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  getLiveQueue,
  callNextTokenServer,
  completeServiceServer,
  markNoShowServer,
  recallTokenServer,
  updateCounterServer,
  transferTokenServer,
} from "@/lib/queue.functions";
import { LIVE_FACILITIES, playQueueChime, speakAnnouncement } from "@/lib/queue-store";
import type { LiveFacilityState, LiveCounter, LiveToken } from "@/lib/types";

export const Route = createFileRoute("/counter")({
  component: CounterTerminal,
});

function CounterTerminal() {
  const [facilityId, setFacilityId] = useState("hospital");
  const [selectedCounterId, setSelectedCounterId] = useState<string>("");
  const [facilityState, setFacilityState] = useState<LiveFacilityState | null>(null);
  const [busy, setBusy] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [serviceTimer, setServiceTimer] = useState(0);
  const [transferDeskId, setTransferDeskId] = useState("");
  const [showTransferModal, setShowTransferModal] = useState(false);

  const fetchState = useServerFn(getLiveQueue);
  const callNextFn = useServerFn(callNextTokenServer);
  const completeFn = useServerFn(completeServiceServer);
  const noShowFn = useServerFn(markNoShowServer);
  const recallFn = useServerFn(recallTokenServer);
  const updateCounterFn = useServerFn(updateCounterServer);
  const transferFn = useServerFn(transferTokenServer);

  // Load state
  async function refresh(targetFacility = facilityId) {
    try {
      const state = await fetchState({ data: { facilityId: targetFacility } });
      setFacilityState(state);
      if (!selectedCounterId && state.counters.length > 0) {
        setSelectedCounterId(state.counters[0]!.id);
      }
    } catch (err) {
      console.error("Failed to load queue state:", err);
    }
  }

  useEffect(() => {
    refresh();
    const iv = setInterval(() => {
      refresh();
    }, 3000);
    return () => clearInterval(iv);
  }, [facilityId]);

  // Service timer for active serving token
  useEffect(() => {
    const currentCounter = facilityState?.counters.find((c) => c.id === selectedCounterId);
    if (!currentCounter?.currentServingTokenId) {
      setServiceTimer(0);
      return;
    }
    const iv = setInterval(() => {
      setServiceTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(iv);
  }, [selectedCounterId, facilityState?.counters]);

  const activeFacility = LIVE_FACILITIES.find((f) => f.id === facilityId) ?? LIVE_FACILITIES[0]!;
  const currentCounter: LiveCounter | undefined = facilityState?.counters.find(
    (c) => c.id === selectedCounterId,
  );
  const currentDesk = activeFacility.desks.find((d) => d.id === currentCounter?.pointId);
  const waitingTokens: LiveToken[] =
    facilityState?.tokens.filter(
      (t) => t.status === "waiting" && t.pointId === currentCounter?.pointId,
    ) ?? [];
  const currentServingToken = facilityState?.tokens.find(
    (t) => t.id === currentCounter?.currentServingTokenId,
  );

  async function handleCallNext() {
    if (!selectedCounterId) return;
    setBusy(true);
    try {
      const token = await callNextFn({
        data: { facilityId, counterId: selectedCounterId },
      });
      if (token) {
        playQueueChime();
        if (voiceEnabled) {
          speakAnnouncement(
            `Token ${token.tokenNumber}, please proceed to ${currentCounter?.name || "the counter"}`,
          );
        }
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleComplete() {
    if (!selectedCounterId) return;
    setBusy(true);
    try {
      await completeFn({ data: { facilityId, counterId: selectedCounterId } });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleNoShow() {
    if (!selectedCounterId) return;
    setBusy(true);
    try {
      await noShowFn({ data: { facilityId, counterId: selectedCounterId } });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleRecall() {
    if (!selectedCounterId || !currentCounter?.currentServingTokenNumber) return;
    setBusy(true);
    try {
      await recallFn({ data: { facilityId, counterId: selectedCounterId } });
      playQueueChime();
      if (voiceEnabled) {
        speakAnnouncement(
          `Repeat call: Token ${currentCounter.currentServingTokenNumber}, please proceed to ${currentCounter.name}`,
        );
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusToggle(status: "open" | "paused" | "closed") {
    if (!selectedCounterId) return;
    setBusy(true);
    try {
      await updateCounterFn({
        data: { facilityId, counterId: selectedCounterId, status },
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDeskReassign(newDeskId: string) {
    if (!selectedCounterId) return;
    setBusy(true);
    try {
      await updateCounterFn({
        data: { facilityId, counterId: selectedCounterId, pointId: newDeskId },
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleTransfer() {
    if (!currentServingToken || !transferDeskId) return;
    setBusy(true);
    try {
      await transferFn({
        data: {
          facilityId,
          tokenId: currentServingToken.id,
          targetPointId: transferDeskId,
        },
      });
      await completeFn({ data: { facilityId, counterId: selectedCounterId } });
      setShowTransferModal(false);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const formatSecs = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="hero-surface p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="chip">
                <span className="pulse-dot" /> Counter Operator Terminal
              </span>
              <span className="chip font-mono text-[11px]">Real-Time Active Desk</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight">Staff Service Terminal</h1>
            <p className="text-sm text-muted-foreground">
              Call, serve, transfer, or mark no-show for visitors waiting in your assigned service
              lane.
            </p>
          </div>

          {/* Facility & Counter Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={facilityId}
              onChange={(e) => {
                setFacilityId(e.target.value);
                setSelectedCounterId("");
              }}
              className="rounded-md border border-border bg-surface-2 px-3 py-2 text-xs font-semibold text-foreground"
            >
              {LIVE_FACILITIES.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCounterId}
              onChange={(e) => setSelectedCounterId(e.target.value)}
              className="rounded-md border border-primary bg-primary/10 px-3 py-2 text-xs font-bold text-primary"
            >
              {facilityState?.counters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.status.toUpperCase()}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`rounded-md border px-3 py-2 text-xs font-semibold ${
                voiceEnabled
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground"
              }`}
            >
              {voiceEnabled ? "🔊 Voice Calls: ON" : "🔇 Voice Calls: OFF"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Terminal Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Active Call & Service Operations */}
        <div className="space-y-6 lg:col-span-2">
          {/* Active Calling Box */}
          <div className="card-signal p-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Station
                </span>
                <h2 className="text-xl font-bold text-foreground">
                  {currentCounter?.name ?? "Counter Station"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Operator:{" "}
                  <span className="font-semibold text-foreground">
                    {currentCounter?.operatorName ?? "Staff"}
                  </span>{" "}
                  · Desk: <span className="font-semibold text-primary">{currentDesk?.name}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    currentCounter?.status === "open"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : currentCounter?.status === "paused"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                  }`}
                >
                  ● {currentCounter?.status?.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Now Serving Card */}
            <div className="my-6 rounded-xl border border-border/70 bg-surface-2/60 p-6 text-center">
              {currentCounter?.currentServingTokenNumber ? (
                <div>
                  <span className="chip mb-2">
                    <span className="pulse-dot" /> Now at Counter
                  </span>
                  <div className="text-5xl font-black tracking-tight text-primary sm:text-6xl">
                    {currentCounter.currentServingTokenNumber}
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className="badge badge-accent uppercase">
                      {currentCounter.currentPriority} Priority
                    </span>
                    <span>·</span>
                    <span>Service Duration:</span>
                    <span className="font-mono text-sm font-bold text-foreground">
                      {formatSecs(serviceTimer)}
                    </span>
                  </div>

                  {currentServingToken?.notes && (
                    <div className="mx-auto mt-3 max-w-sm rounded bg-amber-500/10 p-2 text-xs text-amber-400">
                      ⚠️ Note: {currentServingToken.notes}
                    </div>
                  )}

                  {/* Operational Action Buttons */}
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleComplete}
                      className="btn btn-primary px-6 py-2.5 text-sm font-bold"
                    >
                      ✓ Complete Service
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleRecall}
                      className="btn btn-secondary px-4 py-2.5 text-sm"
                    >
                      🔔 Recall Token (Chime)
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setShowTransferModal(true)}
                      className="btn border border-border bg-surface px-4 py-2.5 text-sm text-foreground hover:border-primary"
                    >
                      ⇄ Transfer Desk
                    </button>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleNoShow}
                      className="btn border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/20"
                    >
                      ✕ Mark No-Show
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8">
                  <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-2xl text-primary">
                    🎟️
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Station is Ready</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {waitingTokens.length > 0
                      ? `${waitingTokens.length} visitor(s) waiting in your lane. Click below to call the next token.`
                      : "No visitors currently waiting for this desk. You can relax or reassign to another desk."}
                  </p>

                  <div className="mt-6">
                    <button
                      type="button"
                      disabled={
                        busy || waitingTokens.length === 0 || currentCounter?.status !== "open"
                      }
                      onClick={handleCallNext}
                      className="btn btn-primary px-8 py-3 text-base font-bold shadow-lg"
                    >
                      📣 Call Next Token ({waitingTokens[0]?.tokenNumber ?? "Queue Empty"})
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Station Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground">Station Status:</span>
                <button
                  type="button"
                  onClick={() => handleStatusToggle("open")}
                  className={`rounded px-2.5 py-1 font-semibold ${
                    currentCounter?.status === "open"
                      ? "bg-emerald-500 text-black font-bold"
                      : "bg-surface-2 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusToggle("paused")}
                  className={`rounded px-2.5 py-1 font-semibold ${
                    currentCounter?.status === "paused"
                      ? "bg-amber-500 text-black font-bold"
                      : "bg-surface-2 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Break / Pause
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusToggle("closed")}
                  className={`rounded px-2.5 py-1 font-semibold ${
                    currentCounter?.status === "closed"
                      ? "bg-rose-500 text-white font-bold"
                      : "bg-surface-2 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Close
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-semibold text-muted-foreground">Reassign Service Desk:</span>
                <select
                  value={currentCounter?.pointId ?? ""}
                  onChange={(e) => handleDeskReassign(e.target.value)}
                  className="rounded border border-border bg-surface-2 px-2 py-1 text-xs text-foreground"
                >
                  {activeFacility.desks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Today's Counter Performance Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="hero-surface p-4 text-center">
              <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                Tokens Served Today
              </span>
              <div className="mt-1 font-mono text-2xl font-bold text-foreground">
                {currentCounter?.tokensServedToday ?? 0}
              </div>
            </div>
            <div className="hero-surface p-4 text-center">
              <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                Target SLA
              </span>
              <div className="mt-1 font-mono text-2xl font-bold text-primary">
                {currentDesk?.slaMinutes ?? 15}m
              </div>
            </div>
            <div className="hero-surface p-4 text-center">
              <span className="text-[11px] font-semibold uppercase text-muted-foreground">
                Avg Service Time
              </span>
              <div className="mt-1 font-mono text-2xl font-bold text-foreground">
                {Math.round((currentCounter?.avgServiceSeconds ?? 180) / 60)}m
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Waiting Queue for this Service Desk */}
        <div className="space-y-4">
          <div className="hero-surface p-5">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <div>
                <h3 className="font-bold text-foreground">Waiting Queue</h3>
                <p className="text-xs text-muted-foreground">{currentDesk?.name}</p>
              </div>
              <span className="badge badge-primary font-mono text-xs">
                {waitingTokens.length} waiting
              </span>
            </div>

            <div className="mt-4 max-h-[480px] space-y-2 overflow-y-auto pr-1">
              {waitingTokens.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No visitors currently in queue.
                </div>
              ) : (
                waitingTokens.map((tok, idx) => (
                  <div
                    key={tok.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      idx === 0
                        ? "border-primary/50 bg-primary/10"
                        : "border-border/60 bg-surface-2/40"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-bold text-foreground">
                          {tok.tokenNumber}
                        </span>
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
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Wait: ~{tok.estimatedWaitMinutes}m · Pos #{tok.queuePosition}
                      </p>
                    </div>

                    {idx === 0 && !currentCounter?.currentServingTokenNumber && (
                      <button
                        type="button"
                        onClick={handleCallNext}
                        className="btn btn-primary px-3 py-1 text-xs font-bold"
                      >
                        Call Now
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Desk Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl">
            <h3 className="text-lg font-bold">Transfer Token to Another Desk</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Re-route Token{" "}
              <span className="font-bold text-primary">
                {currentCounter?.currentServingTokenNumber}
              </span>{" "}
              to a specialist desk with retained queue credit.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block text-xs font-semibold uppercase text-muted-foreground">
                Target Service Desk
              </label>
              <select
                value={transferDeskId}
                onChange={(e) => setTransferDeskId(e.target.value)}
                className="w-full rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground"
              >
                <option value="">-- Select Destination Desk --</option>
                {activeFacility.desks
                  .filter((d) => d.id !== currentCounter?.pointId)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} (SLA: {d.slaMinutes}m)
                    </option>
                  ))}
              </select>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="btn border border-border bg-surface px-4 py-2 text-xs text-muted-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!transferDeskId || busy}
                onClick={handleTransfer}
                className="btn btn-primary px-4 py-2 text-xs font-bold"
              >
                Confirm Transfer & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
