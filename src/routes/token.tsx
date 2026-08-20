import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSimClock } from "@/hooks/useSimClock";
import { LANGS, t, type Lang } from "@/lib/i18n";
import { FACILITIES, fmtTime, makeToken, snapshot, type Priority } from "@/lib/sim";

export const Route = createFileRoute("/token")({
  head: () => ({
    meta: [
      { title: "Visitor Token & Live Wait Time — QueueSense.ai" },
      {
        name: "description",
        content:
          "Anonymous token with live position, estimated waiting time, accessible priority lanes and updates in five languages.",
      },
      { property: "og:title", content: "Visitor Token & Live Wait Time" },
      {
        property: "og:description",
        content:
          "Check your queue position and estimated wait in your own language — no personal data required.",
      },
    ],
  }),
  component: TokenPage,
});

function TokenPage() {
  const clock = useSimClock(2);
  const [lang, setLang] = useState<Lang>("en");
  const [facilityId, setFacilityId] = useState(FACILITIES[0]!.id);
  const [pointId, setPointId] = useState(FACILITIES[0]!.points[0]!.id);
  const [priority, setPriority] = useState<Priority>("general");
  const [issuedAt, setIssuedAt] = useState<number | null>(null);

  const facility = FACILITIES.find((f) => f.id === facilityId)!;
  const snap = useMemo(() => snapshot(facility, clock.minute), [facility, clock.minute]);
  const token = useMemo(
    () => (issuedAt === null ? null : makeToken(facility, pointId, priority, issuedAt)),
    [facility, pointId, priority, issuedAt],
  );

  const live = token
    ? snap.points.find((p) => p.point.id === token.pointId)!
    : null;
  const eta = live ? Math.max(1, live.waits[priority]) : 0;
  const late = live ? eta > live.point.slaMinutes : false;
  const laneKey =
    priority === "critical" ? "criticalLane" : priority === "priority" ? "priorityLane" : "generalLane";

  return (
    <div className="space-y-5">
      <section className="hero-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="chip">
              <span className="pulse-dot" /> {fmtTime(clock.minute)}
            </span>
            <h1 className="mt-2 text-xl font-bold sm:text-2xl">{facility.name}</h1>
          </div>
          <div className="flex flex-wrap gap-1">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  lang === l.code
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-muted-foreground"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {!token && (
        <section className="panel space-y-4 p-5">
          <h2 className="font-display text-base font-bold">{t(lang, "getToken")}</h2>

          <Field label="Facility">
            <select
              className="btn w-full justify-start"
              value={facilityId}
              onChange={(e) => {
                const f = FACILITIES.find((x) => x.id === e.target.value)!;
                setFacilityId(f.id);
                setPointId(f.points[0]!.id);
              }}
            >
              {FACILITIES.map((f) => (
                <option key={f.id} value={f.id} className="bg-surface">
                  {f.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t(lang, "service")}>
            <select
              className="btn w-full justify-start"
              value={pointId}
              onChange={(e) => setPointId(e.target.value)}
            >
              {facility.points.map((p) => (
                <option key={p.id} value={p.id} className="bg-surface">
                  {p.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t(lang, "needs")}>
            <div className="space-y-2">
              {(["general", "priority", "critical"] as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                    priority === p ? "border-primary bg-surface-2" : "border-border"
                  }`}
                >
                  <span className="font-semibold">{t(lang, p)}</span>
                </button>
              ))}
            </div>
          </Field>

          <button className="btn btn-primary w-full" onClick={() => setIssuedAt(clock.minute)}>
            {t(lang, "issue")}
          </button>
          <p className="text-xs text-muted-foreground">{t(lang, "privacy")}</p>
        </section>
      )}

      {token && live && (
        <>
          <section className="panel p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t(lang, "yourToken")}
            </p>
            <p
              className="mt-1 font-display text-4xl font-bold tracking-tight"
              style={{ color: "var(--color-primary)" }}
            >
              {token.code}
            </p>
            <span
              className="chip mt-3"
              style={{
                color: `var(--color-${priority === "critical" ? "danger" : priority === "priority" ? "warn" : "primary"})`,
              }}
            >
              {t(lang, laneKey)}
            </span>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-surface-2 p-4">
                <p className="stat-value">{token.ahead}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t(lang, "peopleAhead")}</p>
              </div>
              <div className="rounded-xl bg-surface-2 p-4">
                <p className="stat-value" style={{ color: `var(--color-${late ? "warn" : "ok"})` }}>
                  {eta}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(lang, "estWait")} ({t(lang, "minutes")})
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">{t(lang, "reportTo")}: </span>
                <span className="font-semibold">
                  {live.point.name} · {token.counterHint}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">{t(lang, "arriveBy")}: </span>
                <span className="font-semibold">{fmtTime(clock.minute + Math.max(0, eta - 5))}</span>
              </p>
              <p>
                <span className="text-muted-foreground">{t(lang, "status")}: </span>
                <span
                  className="font-semibold"
                  style={{ color: `var(--color-${late ? "warn" : "ok"})` }}
                >
                  {late ? t(lang, "delayed") : t(lang, "onTime")}
                </span>
              </p>
            </div>
          </section>

          <section className="panel p-5">
            <h2 className="font-display text-base font-bold">{t(lang, "updates")}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {(late
                ? (["updDelay", "updExtra", "updPriority"] as const)
                : (["updCalled", "updPriority"] as const)
              ).map((k) => (
                <li key={k} className="flex gap-3 rounded-lg bg-surface-2 px-3 py-2">
                  <span className="font-display text-xs font-bold text-primary">
                    {fmtTime(clock.minute)}
                  </span>
                  <span className="text-muted-foreground">{t(lang, k)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">{t(lang, "fairnessNote")}</p>
            <button className="btn mt-4 w-full" onClick={() => setIssuedAt(null)}>
              {t(lang, "newToken")}
            </button>
          </section>
        </>
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
