import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSimClock } from "@/hooks/useSimClock";
import {
  FACILITIES,
  fmtTime,
  forecast,
  snapshot,
  type Facility,
  type PointState,
  type Snapshot,
} from "@/lib/sim";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QueueSense.ai — AI Queue & Crowd Optimization Control Room" },
      {
        name: "description",
        content:
          "Forecast demand, estimate waiting time and allocate counters fairly across hospitals, campuses and public service centres — with anonymous sensing and transparent escalation.",
      },
      { property: "og:title", content: "QueueSense.ai — Queue & Crowd Control Room" },
      {
        property: "og:description",
        content:
          "Live demand forecasts, fairness-aware counter allocation and transparent escalation for high-footfall public facilities.",
      },
    ],
  }),
  component: Dashboard;
});

function Dashboard() {
  const [facilityId, setFacilityId] = useState(FACILITIES[0]!.id);
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [sensing, setSensing] = useState<"token" | "anonymous">("token");
  const [log, setLog] = useState<{ time: string; text: string }[]>([]);
  const [speed, setSpeed] = useState(2);
  const clock = useSimClock(speed);

  const base = FACILITIES.find((f) => f.id === facilityId)!;
  const facility: Facility = useMemo(
    () => ({
      ...base,
      points: base.points.map((p) => ({ ...p, open: overrides[`${base.id}:${p.id}`] ?? p.open })),
    }),
    [base, overrides],
  );

  const snap = useMemo(() => snapshot(facility, clock.minute), [facility, clock.minute]);
  const fc = useMemo(() => forecast(facility, clock.minute), [facility, clock.minute]);

  function applyAll() {
    const next = { ...overrides };
    const changes: string[] = [];
    for (const p of snap.points) {
      if (p.recommendedCounters !== p.point.open) {
        next[`${facility.id}:${p.point.id}`] = p.recommendedCounters;
        changes.push(`${p.point.name} ${p.point.open}→${p.recommendedCounters}`);
      }
    }
    setOverrides(next);
    if (changes.length)
      setLog((l) =>
        [
          { time: fmtTime(clock.minute), text: `Supervisor approved reallocation: ${changes.join(", ")}` },
          ...l,
        ].slice(0, 8),
      );
  }

  function broadcast() {
    setLog((l) =>
      [
        {
          time: fmtTime(clock.minute),
          text: "Multilingual delay notice broadcast to all waiting tokens (EN/HI/MR/TA/BN)",
        },
        ...l,
      ].slice(0, 8),
    );
  }

  return (
    <div className="space-y-5">
      <Header
        facility={facility}
        facilityId={facilityId}
        setFacilityId={(v) => setFacilityId(v)}
        minute={clock.minute}
        running={clock.running}
        toggle={() => clock.setRunning(!clock.running)}
        speed={speed}
        setSpeed={setSpeed}
        sensing={sensing}
        setSensing={setSensing}
        snap={snap}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={`${facility.visitorWord} waiting`} value={String(snap.totalWaiting)} hint="live across all desks" />
        <Stat
          label="Average wait"
          value={`${snap.avgWait}m`}
          hint={snap.avgWait > 20 ? "above target" : "within target"}
          tone={snap.avgWait > 20 ? "warn" : "ok"}
        />
        <Stat
          label="Fairness score"
          value={`${snap.fairness}`}
          hint="equity + spread weighted"
          tone={snap.fairness > 75 ? "ok" : snap.fairness > 50 ? "warn" : "danger"}
        />
        <Stat
          label="Equity gap"
          value={`${snap.equityGap > 0 ? "+" : ""}${snap.equityGap}m`}
          hint="priority vs general wait"
          tone={snap.equityGap > 3 ? "danger" : "ok"}
        />
      </div>

      <section className="panel p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-base font-bold">Demand forecast — next 3 hours</h2>
          <span className="text-xs text-muted-foreground">
            15-minute buckets · shaded band = model uncertainty
          </span>
        </div>
        <ForecastChart data={fc} now={clock.minute} />
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <section className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-base font-bold">
              {facility.pointWord} — allocation recommendations
            </h2>
            <button className="btn btn-primary" onClick={applyAll}>
              Apply all recommendations
            </button>
          </div>
          <div className="mt-4 space-y-3">
            {snap.points.map((p) => (
              <PointRow
                key={p.point.id}
                p={p}
                onApply={() => {
                  setOverrides((o) => ({
                    ...o,
                    [`${facility.id}:${p.point.id}`]: p.recommendedCounters,
                  }));
                  setLog((l) =>
                    [
                      {
                        time: fmtTime(clock.minute),
                        text: `${p.point.name}: counters set to ${p.recommendedCounters} (was ${p.point.open})`,
                      },
                      ...l,
                    ].slice(0, 8),
                  );
                }}
              />
            ))}
          </div>
        </section>

        <div className="space-y-4">
          <section className="panel p-5">
            <h2 className="font-display text-base font-bold">Crowd density by zone</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {sensing === "token"
                ? "Derived from token check-ins"
                : "Anonymous headcount sensors — aggregate integers only"}
            </p>
            <div className="mt-4 space-y-3">
              {snap.zones.map((z) => (
                <div key={z.zone.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span>{z.zone.name}</span>
                    <span className="font-display font-bold">
                      {z.occupancy}
                      <span className="text-xs font-normal text-muted-foreground">
                        {" "}
                        / {z.zone.capacity}
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, z.ratio * 100)}%`,
                        backgroundColor: `var(--color-${
                          z.level === "critical" ? "danger" : z.level === "crowded" ? "warn" : "ok"
                        })`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <Escalation snap={snap} onBroadcast={broadcast} />
        </div>
      </div>

      <section className="panel p-5">
        <h2 className="font-display text-base font-bold">Decision audit log</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Every automated recommendation needs human approval and is recorded here.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          {log.length === 0 && (
            <li className="text-muted-foreground">No interventions yet in this session.</li>
          )}
          {log.map((e, i) => (
            <li key={i} className="flex gap-3 rounded-lg bg-surface-2 px-3 py-2">
              <span className="font-display text-xs font-bold text-primary">{e.time}</span>
              <span className="text-muted-foreground">{e.text}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Header(props: {
  facility: Facility;
  facilityId: string;
  setFacilityId: (v: string) => void;
  minute: number;
  running: boolean;
  toggle: () => void;
  speed: number;
  setSpeed: (n: number) => void;
  sensing: "token" | "anonymous";
  setSensing: (v: "token" | "anonymous") => void;
  snap: Snapshot;
}) {
  const lvl = props.snap.escalation.level;
  const tone = lvl === "surge" ? "danger" : lvl === "watch" ? "warn" : "ok";
  return (
    <section className="hero-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip">
          <span className="pulse-dot" /> Live simulation
        </span>
        <span
          className="chip"
          style={{ color: `var(--color-${tone})`, borderColor: `var(--color-${tone})` }}
        >
          {lvl === "surge" ? "Surge protocol" : lvl === "watch" ? "Watch" : "Normal operations"}
        </span>
        <span className="chip">{props.facility.kind}</span>
      </div>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
        AI queue, crowd &amp; service experience optimizer
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {props.facility.name} · facility clock{" "}
        <span className="font-display font-bold text-foreground">{fmtTime(props.minute)}</span>
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          value={props.facilityId}
          onChange={(e) => props.setFacilityId(e.target.value)}
          className="btn"
          aria-label="Select facility"
        >
          {FACILITIES.map((f) => (
            <option key={f.id} value={f.id} className="bg-surface">
              {f.name}
            </option>
          ))}
        </select>
        <button className="btn" onClick={props.toggle}>
          {props.running ? "Pause clock" : "Resume clock"}
        </button>
        <button className="btn" onClick={() => props.setSpeed(props.speed === 2 ? 10 : 2)}>
          Speed ×{props.speed}
        </button>
        <div className="flex rounded-md border border-border p-0.5 text-xs font-semibold">
          {(["token", "anonymous"] as const).map((m) => (
            <button
              key={m}
              onClick={() => props.setSensing(m)}
              className={`rounded px-3 py-1.5 capitalize transition-colors ${
                props.sensing === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {m} sensing
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "ok" | "warn" | "danger";
}) {
  return (
    <div className="panel p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className="stat-value mt-1"
        style={tone === "default" ? undefined : { color: `var(--color-${tone})` }}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function PointRow({ p, onApply }: { p: PointState; onApply: () => void }) {
  const delta = p.recommendedCounters - p.point.open;
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-display text-sm font-bold">{p.point.name}</p>
          <p className="text-xs text-muted-foreground">
            {p.total} waiting · {p.point.open} counters open · target {p.point.slaMinutes}m
          </p>
        </div>
        <div className="text-right">
          <p
            className="font-display text-xl font-bold"
            style={{ color: `var(--color-${p.breach ? "danger" : "ok"})` }}
          >
            {p.avgWait}m
          </p>
          <p className="text-[11px] text-muted-foreground">avg wait</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
        <LaneBox label="Time-critical" n={p.queue.critical} w={p.waits.critical} tone="danger" />
        <LaneBox label="Priority" n={p.queue.priority} w={p.waits.priority} tone="warn" />
        <LaneBox label="General" n={p.queue.general} w={p.waits.general} tone="default" />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Recommendation:{" "}
          <span className="font-semibold text-foreground">
            {delta === 0
              ? "staffing is optimal"
              : delta > 0
                ? `open ${delta} more counter${delta > 1 ? "s" : ""}`
                : `release ${-delta} counter${delta < -1 ? "s" : ""}`}
          </span>
        </span>
        {delta !== 0 && (
          <button className="btn btn-ghost" onClick={onApply}>
            Approve
          </button>
        )}
      </div>
    </div>
  );
}

function LaneBox({
  label,
  n,
  w,
  tone,
}: {
  label: string;
  n: number;
  w: number;
  tone: "danger" | "warn" | "default";
}) {
  return (
    <div className="rounded-lg border border-border px-2 py-2">
      <p
        className="font-display text-base font-bold"
        style={tone === "default" ? undefined : { color: `var(--color-${tone})` }}
      >
        {n}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-[11px] text-muted-foreground">~{w}m</p>
    </div>
  );
}

function Escalation({ snap, onBroadcast }: { snap: Snapshot; onBroadcast: () => void }) {
  const lvl = snap.escalation.level;
  const tone = lvl === "surge" ? "danger" : lvl === "watch" ? "warn" : "ok";
  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold">Escalation</h2>
        <span className="chip" style={{ color: `var(--color-${tone})`, borderColor: `var(--color-${tone})` }}>
          {lvl}
        </span>
      </div>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Triggers
      </p>
      <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
        {snap.escalation.reasons.length === 0 && <li>All desks and zones within thresholds.</li>}
        {snap.escalation.reasons.slice(0, 4).map((r, i) => (
          <li key={i}>· {r}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Proposed actions
      </p>
      <ul className="mt-1 space-y-1 text-sm">
        {snap.escalation.actions.length === 0 && (
          <li className="text-muted-foreground">No action required.</li>
        )}
        {snap.escalation.actions.slice(0, 4).map((a, i) => (
          <li key={i}>· {a}</li>
        ))}
      </ul>
      <button className="btn mt-4 w-full" onClick={onBroadcast}>
        Broadcast multilingual notice
      </button>
    </section>
  );
}

function ForecastChart({
  data,
  now,
}: {
  data: { minute: number; predicted: number; lower: number; upper: number; actual?: number }[];
  now: number;
}) {
  const w = 720;
  const h = 200;
  const pad = 28;
  const max = Math.max(...data.map((d) => d.upper)) * 1.1 || 1;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (data.length - 1);
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2);

  const band =
    data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.upper)}`).join(" ") +
    " " +
    data
      .slice()
      .reverse()
      .map((d, i) => `L${x(data.length - 1 - i)},${y(d.lower)}`)
      .join(" ") +
    " Z";
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.predicted)}`).join(" ");
  const actualPts = data.filter((d) => d.actual !== undefined);
  const actual = actualPts
    .map((d, i) => `${i === 0 ? "M" : "L"}${x(data.indexOf(d))},${y(d.actual!)}`)
    .join(" ");
  const nowIdx = data.findIndex((d) => d.minute >= now);

  return (
    <div className="mt-4 overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-52 w-full min-w-[560px]">
        {[0.25, 0.5, 0.75, 1].map((g) => (
          <line
            key={g}
            x1={pad}
            x2={w - pad}
            y1={y(max * g)}
            y2={y(max * g)}
            stroke="var(--color-border)"
            strokeDasharray="3 5"
          />
        ))}
        <path d={band} fill="var(--color-primary)" opacity="0.14" />
        <path d={line} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" />
        <path d={actual} fill="none" stroke="var(--color-accent)" strokeWidth="2" />
        {nowIdx >= 0 && (
          <line
            x1={x(nowIdx)}
            x2={x(nowIdx)}
            y1={pad / 2}
            y2={h - pad}
            stroke="var(--color-foreground)"
            strokeDasharray="4 4"
            opacity="0.5"
          />
        )}
        {data.map((d, i) =>
          i % 4 === 0 ? (
            <text
              key={i}
              x={x(i)}
              y={h - 8}
              textAnchor="middle"
              fontSize="10"
              fill="var(--color-muted-foreground)"
            >
              {fmtTime(d.minute)}
            </text>
          ) : null,
        )}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span>
          <span className="mr-1 inline-block h-2 w-4 rounded bg-primary align-middle" /> forecast
        </span>
        <span>
          <span className="mr-1 inline-block h-2 w-4 rounded bg-accent align-middle" /> observed
        </span>
        <span>· dashed line = now</span>
      </div>
    </div>
  );
}
