// Deterministic simulation engine for the queue / crowd optimizer demo.
// No personal data is modelled anywhere: tokens are opaque codes only.

export type Priority = "critical" | "priority" | "general";

export const PRIORITY_ORDER: Priority[] = ["critical", "priority", "general"];

export interface ServicePoint {
  id: string;
  name: string;
  /** counters currently staffed */
  open: number;
  minCounters: number;
  maxCounters: number;
  /** people served per hour per counter */
  ratePerCounter: number;
  /** relative demand weight */
  weight: number;
  /** service level agreement, minutes */
  slaMinutes: number;
}

export interface Zone {
  id: string;
  name: string;
  capacity: number;
}

export interface Facility {
  id: string;
  name: string;
  kind: string;
  visitorWord: string;
  pointWord: string;
  points: ServicePoint[];
  zones: Zone[];
  /** arrivals per hour at full peak */
  peakArrivals: number;
  /** peak hours of the day (24h) */
  peaks: number[];
}

export const FACILITIES: Facility[] = [
  {
    id: "hospital",
    name: "Civil Hospital — OPD Block",
    kind: "Hospital",
    visitorWord: "Patients",
    pointWord: "Departments",
    peakArrivals: 260,
    peaks: [10, 17],
    points: [
      {
        id: "gen",
        name: "General Medicine",
        open: 4,
        minCounters: 2,
        maxCounters: 8,
        ratePerCounter: 11,
        weight: 1.5,
        slaMinutes: 20,
      },
      {
        id: "ortho",
        name: "Orthopaedics",
        open: 2,
        minCounters: 1,
        maxCounters: 5,
        ratePerCounter: 9,
        weight: 0.9,
        slaMinutes: 25,
      },
      {
        id: "lab",
        name: "Diagnostics & Lab",
        open: 3,
        minCounters: 2,
        maxCounters: 7,
        ratePerCounter: 16,
        weight: 1.2,
        slaMinutes: 15,
      },
      {
        id: "pharm",
        name: "Pharmacy",
        open: 2,
        minCounters: 2,
        maxCounters: 6,
        ratePerCounter: 24,
        weight: 1.1,
        slaMinutes: 10,
      },
    ],
    zones: [
      { id: "z1", name: "OPD Waiting Hall", capacity: 220 },
      { id: "z2", name: "Registration Lobby", capacity: 120 },
      { id: "z3", name: "Pharmacy Corridor", capacity: 90 },
    ],
  },
  {
    id: "gov",
    name: "District Service Centre",
    kind: "Government",
    visitorWord: "Applicants",
    pointWord: "Counters",
    peakArrivals: 180,
    peaks: [11, 15],
    points: [
      {
        id: "cert",
        name: "Certificates",
        open: 3,
        minCounters: 1,
        maxCounters: 7,
        ratePerCounter: 10,
        weight: 1.4,
        slaMinutes: 20,
      },
      {
        id: "lic",
        name: "Licences & Permits",
        open: 2,
        minCounters: 1,
        maxCounters: 5,
        ratePerCounter: 8,
        weight: 1.0,
        slaMinutes: 25,
      },
      {
        id: "pay",
        name: "Bill Payments",
        open: 2,
        minCounters: 1,
        maxCounters: 5,
        ratePerCounter: 22,
        weight: 0.9,
        slaMinutes: 10,
      },
      {
        id: "help",
        name: "Grievance Desk",
        open: 1,
        minCounters: 1,
        maxCounters: 4,
        ratePerCounter: 7,
        weight: 0.6,
        slaMinutes: 30,
      },
    ],
    zones: [
      { id: "z1", name: "Main Hall", capacity: 150 },
      { id: "z2", name: "Token Lobby", capacity: 80 },
      { id: "z3", name: "Verification Wing", capacity: 60 },
    ],
  },
  {
    id: "campus",
    name: "University Campus — Central Block",
    kind: "Campus / Event",
    visitorWord: "Visitors",
    pointWord: "Service Desks",
    peakArrivals: 320,
    peaks: [12, 18],
    points: [
      {
        id: "adm",
        name: "Admissions Desk",
        open: 3,
        minCounters: 1,
        maxCounters: 8,
        ratePerCounter: 12,
        weight: 1.3,
        slaMinutes: 20,
      },
      {
        id: "fee",
        name: "Fees & Accounts",
        open: 2,
        minCounters: 1,
        maxCounters: 6,
        ratePerCounter: 18,
        weight: 1.1,
        slaMinutes: 15,
      },
      {
        id: "hostel",
        name: "Hostel Allocation",
        open: 2,
        minCounters: 1,
        maxCounters: 5,
        ratePerCounter: 9,
        weight: 1.0,
        slaMinutes: 25,
      },
      {
        id: "gate",
        name: "Entry Gate Screening",
        open: 4,
        minCounters: 2,
        maxCounters: 10,
        ratePerCounter: 60,
        weight: 1.6,
        slaMinutes: 8,
      },
    ],
    zones: [
      { id: "z1", name: "Auditorium Foyer", capacity: 400 },
      { id: "z2", name: "Food Court", capacity: 260 },
      { id: "z3", name: "Gate A Plaza", capacity: 180 },
    ],
  },
  {
    id: "metro",
    name: "Central Metro & Transit Interchange",
    kind: "Transit / Transport",
    visitorWord: "Commuters",
    pointWord: "Gates & Counters",
    peakArrivals: 480,
    peaks: [9, 18],
    points: [
      {
        id: "smart_gate",
        name: "AFC Smart Turnstiles",
        open: 6,
        minCounters: 3,
        maxCounters: 12,
        ratePerCounter: 90,
        weight: 2.2,
        slaMinutes: 3,
      },
      {
        id: "security",
        name: "Security Frisking & Baggage Scan",
        open: 4,
        minCounters: 2,
        maxCounters: 8,
        ratePerCounter: 45,
        weight: 1.8,
        slaMinutes: 6,
      },
      {
        id: "ticket_pos",
        name: "Ticket Vending & Smartcard Top-up",
        open: 3,
        minCounters: 1,
        maxCounters: 6,
        ratePerCounter: 25,
        weight: 1.2,
        slaMinutes: 8,
      },
      {
        id: "cust_care",
        name: "Customer Care & Excess Fare Desk",
        open: 2,
        minCounters: 1,
        maxCounters: 4,
        ratePerCounter: 14,
        weight: 0.8,
        slaMinutes: 12,
      },
    ],
    zones: [
      { id: "z1", name: "Main Concourse Hall", capacity: 600 },
      { id: "z2", name: "Platform 1 & 2 Transfer Corridor", capacity: 350 },
      { id: "z3", name: "Security Check Ingress", capacity: 200 },
    ],
  },
  {
    id: "passport",
    name: "Regional Passport & Consular Seva Kendra",
    kind: "Consular / Identity",
    visitorWord: "Citizens",
    pointWord: "Processing Counters",
    peakArrivals: 210,
    peaks: [11, 14],
    points: [
      {
        id: "doc_verify",
        name: "Counter A — Document Verification",
        open: 4,
        minCounters: 2,
        maxCounters: 8,
        ratePerCounter: 12,
        weight: 1.6,
        slaMinutes: 15,
      },
      {
        id: "biometric",
        name: "Counter B — Biometric & Photo Capture",
        open: 3,
        minCounters: 2,
        maxCounters: 6,
        ratePerCounter: 18,
        weight: 1.3,
        slaMinutes: 10,
      },
      {
        id: "granting",
        name: "Counter C — Verification & Granting Officer",
        open: 3,
        minCounters: 1,
        maxCounters: 5,
        ratePerCounter: 10,
        weight: 1.1,
        slaMinutes: 20,
      },
      {
        id: "dispatch",
        name: "Exit Clearance & Inquiry Desk",
        open: 2,
        minCounters: 1,
        maxCounters: 4,
        ratePerCounter: 30,
        weight: 0.7,
        slaMinutes: 5,
      },
    ],
    zones: [
      { id: "z1", name: "Token Entry Waiting Lounge", capacity: 180 },
      { id: "z2", name: "Processing Bay A/B", capacity: 120 },
      { id: "z3", name: "Granting Office Corridor", capacity: 75 },
    ],
  },
];

/* ---------------------------------------------------------------- math */

function hash(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function strSeed(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h;
}

export type SimulationScenario = "normal" | "surge" | "slowdown" | "drill";

export interface ScenarioMeta {
  id: SimulationScenario;
  label: string;
  description: string;
  demandMultiplier: number;
  serviceMultiplier: number;
}

export const SCENARIOS: ScenarioMeta[] = [
  {
    id: "normal",
    label: "Standard Operations",
    description: "Nominal arrival distribution based on historical facility baseline.",
    demandMultiplier: 1.0,
    serviceMultiplier: 1.0,
  },
  {
    id: "surge",
    label: "Peak Rush / Transit Influx",
    description: "Sudden +45% surge in arrivals across all entrance lanes and service counters.",
    demandMultiplier: 1.45,
    serviceMultiplier: 0.95,
  },
  {
    id: "slowdown",
    label: "Hardware / Network Latency",
    description: "Counter processing rate drops by 30% due to verification or scanner delay.",
    demandMultiplier: 1.05,
    serviceMultiplier: 0.7,
  },
  {
    id: "drill",
    label: "Emergency Clearance Drill",
    description:
      "Rapid evacuation protocol testing dynamic counter rebalancing and overflow seating.",
    demandMultiplier: 1.8,
    serviceMultiplier: 1.25,
  },
];

/** 0..1 demand curve for a facility at a given minute of day */
export function demandCurve(f: Facility, minute: number, scenario: SimulationScenario = "normal") {
  const meta = SCENARIOS.find((s) => s.id === scenario) ?? SCENARIOS[0]!;
  const h = minute / 60;
  if (h < 6 || h > 22) return 0.04 * meta.demandMultiplier;
  let v = 0.18;
  for (const p of f.peaks) v += Math.exp(-((h - p) ** 2) / 2.2);
  const noise = (hash(strSeed(f.id) + Math.floor(minute / 15)) - 0.5) * 0.14;
  return Math.max(0.04, Math.min(1.6, (v * 0.72 + noise) * meta.demandMultiplier));
}

export interface PointState {
  point: ServicePoint;
  queue: Record<Priority, number>;
  total: number;
  throughputPerMin: number;
  waits: Record<Priority, number>;
  avgWait: number;
  load: number;
  recommendedCounters: number;
  breach: boolean;
  slaAdherencePercent: number;
}

export function queueSplit(total: number, seed: number) {
  const critShare = 0.06 + hash(seed) * 0.05;
  const prioShare = 0.16 + hash(seed + 7) * 0.08;
  const critical = Math.round(total * critShare);
  const priority = Math.round(total * prioShare);
  return { critical, priority, general: Math.max(0, total - critical - priority) };
}

export function computePoint(
  f: Facility,
  p: ServicePoint,
  minute: number,
  scenario: SimulationScenario = "normal",
): PointState {
  const meta = SCENARIOS.find((s) => s.id === scenario) ?? SCENARIOS[0]!;
  const d = demandCurve(f, minute, scenario);
  const arrivals = (f.peakArrivals * d * p.weight) / f.points.reduce((s, x) => s + x.weight, 0);
  const effectiveRate = p.ratePerCounter * meta.serviceMultiplier;
  const capacity = p.open * effectiveRate;
  const pressure = Math.max(0, arrivals - capacity) / Math.max(1, capacity);
  const total = Math.round(
    arrivals * 0.1 + pressure * capacity * 0.45 + hash(strSeed(p.id) + Math.floor(minute / 10)) * 4,
  );
  const queue = queueSplit(total, strSeed(p.id) + Math.floor(minute / 30));
  const throughputPerMin = Math.max(0.05, (p.open * effectiveRate) / 60);

  // Priority-aware waiting time. Critical tokens are pre-empted to the front,
  // accessible-priority tokens are interleaved, and 25% of capacity stays
  // reserved for the general lane so it can never starve.
  const base = total / throughputPerMin;
  const waits = {
    critical: Math.max(1, Math.round(base * 0.2)),
    priority: Math.max(1, Math.round(base * 0.55)),
    general: Math.max(1, Math.round(base * 1.1)),
  };
  const avgWait = Math.round(
    (waits.critical * queue.critical +
      waits.priority * queue.priority +
      waits.general * queue.general) /
      Math.max(1, total),
  );

  const needed = Math.ceil(total / Math.max(1, (p.slaMinutes / 60) * effectiveRate));
  const recommendedCounters = Math.max(p.minCounters, Math.min(p.maxCounters, needed));
  const breach = avgWait > p.slaMinutes;
  const slaAdherencePercent = Math.max(
    30,
    Math.min(100, Math.round(100 - Math.max(0, avgWait - p.slaMinutes) * 4.5)),
  );

  return {
    point: p,
    queue,
    total,
    throughputPerMin,
    waits,
    avgWait,
    load: capacity > 0 ? arrivals / capacity : 2,
    recommendedCounters,
    breach,
    slaAdherencePercent,
  };
}

export interface ZoneState {
  zone: Zone;
  occupancy: number;
  ratio: number;
  level: "calm" | "busy" | "crowded" | "critical";
}

export function computeZone(
  f: Facility,
  z: Zone,
  minute: number,
  scenario: SimulationScenario = "normal",
): ZoneState {
  const d = demandCurve(f, minute, scenario);
  const jitter = 0.75 + hash(strSeed(z.id) + Math.floor(minute / 7)) * 0.55;
  const occupancy = Math.round(z.capacity * Math.min(1.35, d * jitter));
  const ratio = occupancy / z.capacity;
  const level = ratio > 1 ? "critical" : ratio > 0.8 ? "crowded" : ratio > 0.55 ? "busy" : "calm";
  return { zone: z, occupancy, ratio, level };
}

export interface Snapshot {
  minute: number;
  points: PointState[];
  zones: ZoneState[];
  totalWaiting: number;
  avgWait: number;
  fairness: number;
  equityGap: number;
  overallSlaPercent: number;
  scenario: SimulationScenario;
  escalation: { level: "normal" | "watch" | "surge"; reasons: string[]; actions: string[] };
}

export function snapshot(
  f: Facility,
  minute: number,
  scenario: SimulationScenario = "normal",
): Snapshot {
  const points = f.points.map((p) => computePoint(f, p, minute, scenario));
  const zones = f.zones.map((z) => computeZone(f, z, minute, scenario));
  const totalWaiting = points.reduce((s, p) => s + p.total, 0);
  const avgWait = Math.round(
    points.reduce((s, p) => s + p.avgWait * p.total, 0) / Math.max(1, totalWaiting),
  );

  // Equity gap: how much longer a vulnerable/time-critical person waits than
  // the median general visitor. Negative gap = priority rules working.
  const prioWait = weighted(
    points,
    (p) => p.waits.priority,
    (p) => p.queue.priority,
  );
  const genWait = weighted(
    points,
    (p) => p.waits.general,
    (p) => p.queue.general,
  );
  const equityGap = Math.round(prioWait - genWait);
  const spread =
    Math.max(...points.map((p) => p.avgWait)) - Math.min(...points.map((p) => p.avgWait));
  const fairness = Math.max(
    0,
    Math.min(100, Math.round(100 - Math.max(0, equityGap) * 4 - spread * 0.6)),
  );

  const overallSlaPercent = Math.round(
    points.reduce((s, p) => s + p.slaAdherencePercent * p.total, 0) / Math.max(1, totalWaiting),
  );

  const reasons: string[] = [];
  const actions: string[] = [];
  for (const p of points) {
    if (p.breach)
      reasons.push(`${p.point.name}: avg wait ${p.avgWait}m over ${p.point.slaMinutes}m target`);
    if (p.recommendedCounters > p.point.open)
      actions.push(`Open ${p.recommendedCounters - p.point.open} more at ${p.point.name}`);
    if (p.recommendedCounters < p.point.open)
      actions.push(
        `Release ${p.point.open - p.recommendedCounters} from ${p.point.name} to overloaded desks`,
      );
  }
  for (const z of zones) {
    if (z.level === "critical")
      reasons.push(`${z.zone.name} at ${Math.round(z.ratio * 100)}% capacity`);
    if (z.level === "critical")
      actions.push(`Divert arrivals away from ${z.zone.name}, open overflow seating`);
  }
  if (equityGap > 4) {
    reasons.push(`Priority lane slower than general lane by ${equityGap}m`);
    actions.push("Reserve one counter exclusively for accessible / time-critical tokens");
  }
  const breaches = points.filter((p) => p.breach).length;
  const crowded = zones.filter((z) => z.level === "critical" || z.level === "crowded").length;
  const level: "normal" | "watch" | "surge" =
    breaches >= 2 || crowded >= 2 ? "surge" : breaches >= 1 || crowded >= 1 ? "watch" : "normal";
  if (level === "surge") actions.push("Broadcast multilingual delay notice to all waiting tokens");

  return {
    minute,
    points,
    zones,
    totalWaiting,
    avgWait,
    fairness,
    equityGap,
    overallSlaPercent: overallSlaPercent || 95,
    scenario,
    escalation: { level, reasons, actions },
  };
}

function weighted(
  points: PointState[],
  v: (p: PointState) => number,
  w: (p: PointState) => number,
) {
  const tw = points.reduce((s, p) => s + w(p), 0);
  if (!tw) return 0;
  return points.reduce((s, p) => s + v(p) * w(p), 0) / tw;
}

/** 3-hour ahead forecast in 15 minute buckets */
export function forecast(f: Facility, minute: number, scenario: SimulationScenario = "normal") {
  const out: {
    minute: number;
    predicted: number;
    lower: number;
    upper: number;
    actual?: number;
  }[] = [];
  for (let i = -8; i <= 12; i++) {
    const m = minute + i * 15;
    const s = snapshot(f, Math.max(0, Math.min(1439, m)), scenario);
    const band = 0.12 + Math.abs(i) * 0.012;
    out.push({
      minute: m,
      predicted: s.totalWaiting,
      lower: Math.round(s.totalWaiting * (1 - band)),
      upper: Math.round(s.totalWaiting * (1 + band)),
      ...(i <= 0 ? { actual: Math.round(s.totalWaiting * (0.94 + hash(m) * 0.12)) } : {}),
    });
  }
  return out;
}

export function fmtTime(minute: number) {
  const m = ((minute % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(Math.floor(m % 60)).padStart(2, "0");
  const ampm = h < 12 ? "AM" : "PM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${mm} ${ampm}`;
}

/* --------------------------------------------------------- token model */

export interface TokenInfo {
  code: string;
  facilityId: string;
  pointId: string;
  priority: Priority;
  ahead: number;
  eta: number;
  slaMinutes: number;
  counterHint: string;
}

export function makeToken(
  f: Facility,
  pointId: string,
  priority: Priority,
  minute: number,
  scenario: SimulationScenario = "normal",
): TokenInfo {
  const s = snapshot(f, minute, scenario);
  const ps = s.points.find((p) => p.point.id === pointId) ?? s.points[0]!;
  const ahead =
    priority === "critical"
      ? Math.round(ps.queue.critical * 0.4)
      : priority === "priority"
        ? ps.queue.critical + Math.round(ps.queue.priority * 0.5)
        : ps.queue.critical + ps.queue.priority + Math.round(ps.queue.general * 0.6);
  const eta = Math.max(1, Math.round(ps.waits[priority] * 0.8) + 1);
  const seed = strSeed(pointId + priority) + minute;
  const prefix = priority === "critical" ? "C" : priority === "priority" ? "P" : "G";
  return {
    code: `${prefix}-${ps.point.id.slice(0, 3).toUpperCase()}-${100 + Math.floor(hash(seed) * 800)}`,
    facilityId: f.id,
    pointId: ps.point.id,
    priority,
    ahead,
    eta,
    slaMinutes: ps.point.slaMinutes,
    counterHint: `Counter ${1 + Math.floor(hash(seed + 3) * ps.point.open)}`,
  };
}

/* ------------------------------------------------- enterprise audit export */

export interface AuditExportPayload {
  facilityId: string;
  facilityName: string;
  timestamp: string;
  facilityTime: string;
  scenario: string;
  escalationLevel: string;
  metrics: {
    totalWaiting: number;
    avgWaitMinutes: number;
    fairnessScore: number;
    equityGapMinutes: number;
    overallSlaCompliancePercent: number;
  };
  pointStatuses: {
    pointId: string;
    pointName: string;
    openCounters: number;
    recommendedCounters: number;
    slaMinutes: number;
    avgWaitMinutes: number;
    slaAdherencePercent: number;
    criticalQueue: number;
    priorityQueue: number;
    generalQueue: number;
  }[];
  zoneOccupancies: {
    zoneId: string;
    zoneName: string;
    occupancy: number;
    capacity: number;
    utilizationPercent: number;
    status: string;
  }[];
  decisionLog: { time: string; text: string }[];
}

export function buildAuditExportJson(
  facility: Facility,
  snap: Snapshot,
  log: { time: string; text: string }[],
): AuditExportPayload {
  return {
    facilityId: facility.id,
    facilityName: facility.name,
    timestamp: new Date().toISOString(),
    facilityTime: fmtTime(snap.minute),
    scenario: snap.scenario,
    escalationLevel: snap.escalation.level,
    metrics: {
      totalWaiting: snap.totalWaiting,
      avgWaitMinutes: snap.avgWait,
      fairnessScore: snap.fairness,
      equityGapMinutes: snap.equityGap,
      overallSlaCompliancePercent: snap.overallSlaPercent,
    },
    pointStatuses: snap.points.map((p) => ({
      pointId: p.point.id,
      pointName: p.point.name,
      openCounters: p.point.open,
      recommendedCounters: p.recommendedCounters,
      slaMinutes: p.point.slaMinutes,
      avgWaitMinutes: p.avgWait,
      slaAdherencePercent: p.slaAdherencePercent,
      criticalQueue: p.queue.critical,
      priorityQueue: p.queue.priority,
      generalQueue: p.queue.general,
    })),
    zoneOccupancies: snap.zones.map((z) => ({
      zoneId: z.zone.id,
      zoneName: z.zone.name,
      occupancy: z.occupancy,
      capacity: z.zone.capacity,
      utilizationPercent: Math.round(z.ratio * 100),
      status: z.level,
    })),
    decisionLog: log,
  };
}

export function buildAuditExportCsv(
  facility: Facility,
  snap: Snapshot,
  log: { time: string; text: string }[],
): string {
  const rows: string[] = [];
  rows.push("=== QUEUESENSE.AI ENTERPRISE SHIFT AUDIT REPORT ===");
  rows.push(`Facility,"${facility.name}"`);
  rows.push(`Facility Clock,"${fmtTime(snap.minute)}"`);
  rows.push(`Exported At,"${new Date().toISOString()}"`);
  rows.push(`Scenario,"${snap.scenario}"`);
  rows.push(`Escalation Level,"${snap.escalation.level.toUpperCase()}"`);
  rows.push(`Total In-Queue,${snap.totalWaiting}`);
  rows.push(`Avg Wait (min),${snap.avgWait}`);
  rows.push(`Fairness Score (0-100),${snap.fairness}`);
  rows.push(`Equity Gap (min),${snap.equityGap}`);
  rows.push(`Overall SLA Compliance,${snap.overallSlaPercent}%`);
  rows.push("");
  rows.push("=== SERVICE POINTS BREAKDOWN ===");
  rows.push(
    "Desk ID,Desk Name,Open Counters,Recommended,Target SLA (min),Avg Wait (min),SLA Adherence %,Critical Queue,Priority Queue,General Queue",
  );
  for (const p of snap.points) {
    rows.push(
      `"${p.point.id}","${p.point.name}",${p.point.open},${p.recommendedCounters},${p.point.slaMinutes},${p.avgWait},${p.slaAdherencePercent}%,${p.queue.critical},${p.queue.priority},${p.queue.general}`,
    );
  }
  rows.push("");
  rows.push("=== ZONE OCCUPANCIES ===");
  rows.push("Zone ID,Zone Name,Occupancy,Capacity,Utilization %,Alarm Level");
  for (const z of snap.zones) {
    rows.push(
      `"${z.zone.id}","${z.zone.name}",${z.occupancy},${z.zone.capacity},${Math.round(z.ratio * 100)}%,"${z.level}"`,
    );
  }
  rows.push("");
  rows.push("=== SUPERVISOR DECISION AUDIT TRAIL ===");
  rows.push("Time,Event Description");
  for (const item of log) {
    rows.push(`"${item.time}","${item.text.replace(/"/g, '""')}"`);
  }
  return rows.join("\n");
}
