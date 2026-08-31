import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState, useRef } from "react";
import { getLiveQueue } from "@/lib/queue.functions";
import { LIVE_FACILITIES, playQueueChime, speakAnnouncement } from "@/lib/queue-store";
import type { LiveFacilityState, PublicAnnouncement } from "@/lib/types";

export const Route = createFileRoute("/display")({
  component: PublicDisplayScreen,
});

function PublicDisplayScreen() {
  const [facilityId, setFacilityId] = useState("hospital");
  const [facilityState, setFacilityState] = useState<LiveFacilityState | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [lastAnnId, setLastAnnId] = useState<string>("");
  const [flashingToken, setFlashingToken] = useState<string>("");
  const [currentTime, setCurrentTime] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchState = useServerFn(getLiveQueue);

  // Clock
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      );
    };
    updateTime();
    const iv = setInterval(updateTime, 1000);
    return () => clearInterval(iv);
  }, []);

  // Poll state
  async function refresh(targetFacility = facilityId) {
    try {
      const state = await fetchState({ data: { facilityId: targetFacility } });
      setFacilityState(state);

      // Check if there is a new announcement to chime & speak
      const latestAnn: PublicAnnouncement | undefined = state.announcements[0];
      if (latestAnn && latestAnn.id !== lastAnnId) {
        setLastAnnId(latestAnn.id);
        setFlashingToken(latestAnn.tokenNumber);
        playQueueChime();
        if (voiceEnabled) {
          speakAnnouncement(latestAnn.message);
        }
        setTimeout(() => setFlashingToken(""), 6000);
      }
    } catch (err) {
      console.error("Display screen refresh failed:", err);
    }
  }

  useEffect(() => {
    refresh();
    const iv = setInterval(() => refresh(), 2500);
    return () => clearInterval(iv);
  }, [facilityId, lastAnnId, voiceEnabled]);

  const activeFacility = LIVE_FACILITIES.find((f) => f.id === facilityId) ?? LIVE_FACILITIES[0]!;

  const activeServingCounters =
    facilityState?.counters.filter((c) => c.status === "open" && c.currentServingTokenNumber) ?? [];

  const waitingTokens = facilityState?.tokens.filter((t) => t.status === "waiting") ?? [];

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }

  return (
    <div ref={containerRef} className="space-y-4">
      {/* Display Screen Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface-2 p-4">
        <div className="flex items-center gap-3">
          <span
            className="grid h-10 w-10 place-items-center rounded-xl font-display text-lg font-bold text-primary-foreground shadow-md"
            style={{ backgroundImage: "var(--gradient-signal)" }}
          >
            Q
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold tracking-tight text-foreground">
                {activeFacility.name}
              </span>
              <span className="chip text-[11px] font-bold text-primary">Live Display Board</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Public Waiting Area Calling Screen · Please proceed when your token appears
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-border bg-surface px-3 py-1.5 font-mono text-sm font-bold text-foreground">
            {currentTime}
          </div>

          <select
            value={facilityId}
            onChange={(e) => setFacilityId(e.target.value)}
            className="rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground"
          >
            {LIVE_FACILITIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
              voiceEnabled
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground"
            }`}
          >
            {voiceEnabled ? "🔊 Chime & Voice: ON" : "🔇 Audio: OFF"}
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="btn border border-border bg-surface px-3 py-1.5 text-xs font-semibold hover:text-primary"
          >
            ⛶ Fullscreen TV Mode
          </button>
        </div>
      </div>

      {/* Main Screen Split: Active Calls (Left) and Upcoming Queues (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: NOW SERVING BIG CARDS */}
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-primary/40 bg-surface p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="pulse-dot" />
                <h2 className="text-lg font-black uppercase tracking-wider text-foreground">
                  Now Serving / टोकन बुलाए गए
                </h2>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {activeServingCounters.length} Counters Active
              </span>
            </div>

            {/* Calling Cards Grid */}
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {activeServingCounters.length === 0 ? (
                <div className="col-span-2 py-16 text-center text-muted-foreground">
                  <div className="text-3xl">⏳</div>
                  <p className="mt-2 text-sm font-semibold">Counters are preparing calls</p>
                  <p className="text-xs">Your token number will be announced here shortly.</p>
                </div>
              ) : (
                activeServingCounters.map((c) => {
                  const isFlashing = flashingToken === c.currentServingTokenNumber;
                  return (
                    <div
                      key={c.id}
                      className={`relative overflow-hidden rounded-xl border p-5 transition-all duration-300 ${
                        isFlashing
                          ? "border-primary bg-primary/20 ring-4 ring-primary/40 scale-[1.02]"
                          : "border-border bg-surface-2/80"
                      }`}
                    >
                      {isFlashing && (
                        <div className="absolute right-2 top-2">
                          <span className="animate-bounce rounded bg-primary px-2 py-0.5 text-[10px] font-black uppercase text-primary-foreground">
                            JUST CALLED
                          </span>
                        </div>
                      )}

                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Token Number
                      </span>
                      <div className="my-1 font-mono text-5xl font-black tracking-tight text-primary">
                        {c.currentServingTokenNumber}
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
                        <div>
                          <div className="text-sm font-bold text-foreground">{c.name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {activeFacility.desks.find((d) => d.id === c.pointId)?.name}
                          </div>
                        </div>
                        <div className="text-2xl text-primary font-bold">➔</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Call Announcements Ticker */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Recent Announcements / हालिया घोषणाएं
            </h3>
            <div className="mt-2 space-y-2">
              {facilityState?.announcements.slice(0, 4).map((ann) => (
                <div
                  key={ann.id}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-surface-2/50 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">{ann.tokenNumber}</span>
                    <span>➔</span>
                    <span className="font-semibold text-foreground">{ann.counterName}</span>
                    <span className="text-muted-foreground">({ann.deskName})</span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {new Date(ann.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Desk Queues & Wait Times */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h3 className="font-bold text-foreground">Upcoming Queue Status</h3>
              <span className="badge badge-primary font-mono text-xs">
                {waitingTokens.length} in queue
              </span>
            </div>

            {/* Per-Desk Waiting Summary */}
            <div className="mt-4 space-y-4">
              {activeFacility.desks.map((desk) => {
                const deskWaiting = waitingTokens.filter((t) => t.pointId === desk.id);
                const nextTokens = deskWaiting.slice(0, 3);
                return (
                  <div
                    key={desk.id}
                    className="rounded-lg border border-border/60 bg-surface-2/40 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground">{desk.name}</span>
                      <span className="text-[11px] font-mono text-muted-foreground">
                        {deskWaiting.length} waiting
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {nextTokens.length === 0 ? (
                        <span className="text-[11px] text-muted-foreground italic">
                          No wait · Open for intake
                        </span>
                      ) : (
                        nextTokens.map((tok, i) => (
                          <span
                            key={tok.id}
                            className={`rounded px-2 py-0.5 font-mono text-xs font-bold ${
                              i === 0
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : "bg-surface-2 text-foreground"
                            }`}
                          >
                            {tok.tokenNumber}
                          </span>
                        ))
                      )}
                      {deskWaiting.length > 3 && (
                        <span className="text-[11px] text-muted-foreground">
                          +{deskWaiting.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Accessibility & Token Self-Service Callout */}
          <div className="rounded-xl border border-border/80 bg-surface-2/80 p-4 text-center">
            <p className="text-xs font-semibold text-foreground">Need a Token?</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Scan the kiosk QR code or visit <code className="font-mono text-primary">/token</code>{" "}
              on your mobile browser to get your live digital pass.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Live Notice Ticker */}
      <div className="overflow-hidden rounded-xl border border-primary/40 bg-primary/10 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-primary-foreground whitespace-nowrap">
            Public Notice
          </span>
          <div className="truncate text-xs font-medium text-foreground">
            {facilityState?.notices[0]?.text ??
              "Please hold your physical or mobile token and proceed promptly to the indicated counter when called."}
          </div>
        </div>
      </div>
    </div>
  );
}
