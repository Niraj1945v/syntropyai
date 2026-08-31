import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "How QueueSense.ai Works — Forecasting, Fairness & Privacy" },
      {
        name: "description",
        content:
          "The models, priority rules, fairness metrics and privacy-by-design sensing behind the QueueSense.ai queue and crowd optimization platform.",
      },
      { property: "og:title", content: "How QueueSense.ai Works" },
      {
        property: "og:description",
        content:
          "Demand forecasting, wait-time estimation, accessible priority rules, fairness scoring and anonymous sensing explained.",
      },
    ],
  }),
  component: About,
});

const sections = [
  {
    title: "1. Sensing layer (privacy-conscious)",
    body: "Two interchangeable modes. Token mode records only an opaque code, service type and a coarse priority class. Anonymous mode uses Wi-Fi/BLE probe counts, depth-sensor headcounts or turnstile deltas — aggregate integers per zone, never images or identifiers. Counts older than the operating day are discarded; nothing is joinable back to a person.",
  },
  {
    title: "2. Demand forecasting",
    body: "A per-service-point time-series model blends a seasonal profile (hour-of-day, day-of-week, holiday and event calendar) with a short-horizon residual correction from the last 90 minutes of live arrivals. Output is a 3-hour arrival forecast in 15-minute buckets with an uncertainty band.",
  },
  {
    title: "3. Wait-time estimation",
    body: "Each desk is a multi-server queue: predicted wait = backlog / effective service rate, where the rate is counters open × measured service rate, adjusted for priority pre-emption. A guaranteed 25% capacity reservation for the general lane means priority traffic can never starve ordinary visitors.",
  },
  {
    title: "4. Allocation optimizer",
    body: "Counters, appointment slots and physical space are allocated to minimise a weighted objective: average waiting time plus a fairness penalty on the gap between vulnerable and general users, subject to staffing limits. Recommendations are advisory — a human supervisor approves each change and every approval is logged.",
  },
  {
    title: "5. Accessible priority rules",
    body: "Priority classes are declared, not inferred: time-critical (medical/emergency), accessible priority (senior citizen, disability, pregnancy, infant), and general. Rules are published in the visitor app so anyone can see why one token was called before another.",
  },
  {
    title: "6. Fairness measurement",
    body: "The fairness score penalises two things: the equity gap (priority wait minus general wait) and the spread of average waits across desks. It is reported alongside average wait so operators can never optimise throughput at the cost of the people who can least afford to stand.",
  },
  {
    title: "7. Transparent escalation",
    body: "Unusual crowding moves the facility from Normal to Watch to Surge. Each level lists the exact triggers, the actions taken and who approved them, and pushes a multilingual notice to waiting tokens instead of leaving people guessing.",
  },
];

function About() {
  return (
    <div className="space-y-6">
      <section className="hero-surface p-6">
        <span className="chip">System design</span>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">How the optimizer thinks</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Seven layers, from anonymous sensing to transparent escalation. Everything visible in the
          control room can be explained to the person waiting in the hall.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((s) => (
          <article key={s.title} className="panel p-5">
            <h2 className="font-display text-base font-bold text-primary">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </article>
        ))}
      </div>

      <section className="panel p-5">
        <h2 className="font-display text-base font-bold">Objective function</h2>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-surface-2 p-4 text-xs leading-relaxed text-muted-foreground">
          {`minimise   J = w1 · avgWait
             + w2 · max(0, priorityWait − generalWait)
             + w3 · spread(waitByDesk)

subject to  openCounters(d) ≤ staffAvailable(d)
            generalCapacityShare ≥ 25%
            zoneOccupancy(z) ≤ safeCapacity(z)`}
        </pre>
      </section>
    </div>
  );
}
