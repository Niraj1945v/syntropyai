import type {
  LiveFacility,
  LiveToken,
  LiveCounter,
  PublicAnnouncement,
  PublicNotice,
  DecisionLogEntry,
  LiveFacilityState,
  Priority,
  CounterStatus,
  TokenStatus,
} from "./types";

export const LIVE_FACILITIES: LiveFacility[] = [
  {
    id: "hospital",
    name: "Apex District General Hospital",
    kind: "Healthcare / Emergency",
    visitorWord: "Patients",
    pointWord: "Clinical & Triage Desks",
    prefix: "H",
    desks: [
      {
        id: "triage",
        name: "Emergency Triage & Ingress",
        slaMinutes: 10,
        minCounters: 2,
        maxCounters: 6,
        ratePerHour: 35,
        description: "Initial vitals assessment and fast-track categorization",
        weight: 1.8,
      },
      {
        id: "opd_reg",
        name: "Outpatient Registration & Billing",
        slaMinutes: 15,
        minCounters: 2,
        maxCounters: 8,
        ratePerHour: 25,
        description: "Consultation ticketing, health ID verification, and payment",
        weight: 1.4,
      },
      {
        id: "pharmacy",
        name: "Central Dispensary & Pharmacy",
        slaMinutes: 20,
        minCounters: 3,
        maxCounters: 10,
        ratePerHour: 40,
        description: "Prescription fulfillment and dosage consultation",
        weight: 2.0,
      },
      {
        id: "radiology",
        name: "Diagnostics & Imaging Intake",
        slaMinutes: 25,
        minCounters: 1,
        maxCounters: 4,
        ratePerHour: 15,
        description: "X-Ray, Ultrasound, and blood sample registration",
        weight: 0.9,
      },
    ],
    zones: [
      { id: "z1", name: "Main Reception & Ingress Hall", capacity: 250 },
      { id: "z2", name: "OPD Waiting Concourse", capacity: 180 },
      { id: "z3", name: "Pharmacy & Labs Corridor", capacity: 120 },
    ],
  },
  {
    id: "metro",
    name: "Central Metro & Transit Interchange",
    kind: "Transit / Transport",
    visitorWord: "Commuters",
    pointWord: "Transit Gates & Counters",
    prefix: "M",
    desks: [
      {
        id: "smart_gate",
        name: "AFC Smart Turnstiles",
        slaMinutes: 3,
        minCounters: 3,
        maxCounters: 12,
        ratePerHour: 90,
        description: "NFC & QR Code automated fare collection gates",
        weight: 2.2,
      },
      {
        id: "security",
        name: "Security Frisking & Baggage Scan",
        slaMinutes: 6,
        minCounters: 2,
        maxCounters: 8,
        ratePerHour: 45,
        description: "X-ray baggage screening and manual body check",
        weight: 1.8,
      },
      {
        id: "ticket_pos",
        name: "Ticket Vending & Smartcard Top-up",
        slaMinutes: 8,
        minCounters: 1,
        maxCounters: 6,
        ratePerHour: 25,
        description: "Cash/UPI top-ups, tourist passes, and single journey tickets",
        weight: 1.2,
      },
      {
        id: "cust_care",
        name: "Customer Care & Excess Fare Desk",
        slaMinutes: 12,
        minCounters: 1,
        maxCounters: 4,
        ratePerHour: 14,
        description: "Overstay penalty clearance, lost property, and refunds",
        weight: 0.8,
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
    prefix: "P",
    desks: [
      {
        id: "doc_verify",
        name: "Counter A — Document Verification",
        slaMinutes: 15,
        minCounters: 2,
        maxCounters: 8,
        ratePerHour: 12,
        description: "Original document check, token reconciliation, and annexure review",
        weight: 1.6,
      },
      {
        id: "biometric",
        name: "Counter B — Biometric & Photo Capture",
        slaMinutes: 10,
        minCounters: 2,
        maxCounters: 6,
        ratePerHour: 18,
        description: "Digital iris, fingerprint scan, and live passport portrait capture",
        weight: 1.3,
      },
      {
        id: "granting",
        name: "Counter C — Verification & Granting Officer",
        slaMinutes: 20,
        minCounters: 1,
        maxCounters: 5,
        ratePerHour: 10,
        description: "Final authorization, police clearance cross-reference, and approval",
        weight: 1.1,
      },
      {
        id: "dispatch",
        name: "Exit Clearance & Inquiry Desk",
        slaMinutes: 5,
        minCounters: 1,
        maxCounters: 4,
        ratePerHour: 30,
        description: "Acknowledgement slip dispatch, SMS tracking setup, and queries",
        weight: 0.7,
      },
    ],
    zones: [
      { id: "z1", name: "Token Entry Waiting Lounge", capacity: 180 },
      { id: "z2", name: "Processing Bay A/B", capacity: 120 },
      { id: "z3", name: "Granting Office Corridor", capacity: 75 },
    ],
  },
  {
    id: "campus",
    name: "Apex University Student Central",
    kind: "Higher Education",
    visitorWord: "Students",
    pointWord: "Service Counters",
    prefix: "U",
    desks: [
      {
        id: "admissions",
        name: "Admissions & Document Verification",
        slaMinutes: 15,
        minCounters: 2,
        maxCounters: 6,
        ratePerHour: 14,
        description: "Degree equivalency, transcripts, and application scrutiny",
        weight: 1.5,
      },
      {
        id: "fees",
        name: "Fee Payment & Financial Aid",
        slaMinutes: 10,
        minCounters: 2,
        maxCounters: 6,
        ratePerHour: 22,
        description: "Tuition installment vouchers, scholarships, and fee clearance",
        weight: 1.6,
      },
      {
        id: "id_cards",
        name: "Campus Smartcard & Parking",
        slaMinutes: 8,
        minCounters: 1,
        maxCounters: 4,
        ratePerHour: 30,
        description: "RFID badge printing, bus pass, and vehicle sticker issuance",
        weight: 1.0,
      },
      {
        id: "counseling",
        name: "Academic Advising & Grievances",
        slaMinutes: 25,
        minCounters: 1,
        maxCounters: 3,
        ratePerHour: 8,
        description: "Credit transfer consultation and examination dispute hearing",
        weight: 0.8,
      },
    ],
    zones: [
      { id: "z1", name: "Central Atrium & Kiosk Area", capacity: 300 },
      { id: "z2", name: "Financial Aid Seating", capacity: 120 },
      { id: "z3", name: "Admissions Queuing Lounge", capacity: 150 },
    ],
  },
];

/* ---------------------------------------------------- in-memory store */

interface GlobalStore {
  tokens: Record<string, LiveToken[]>;
  counters: Record<string, LiveCounter[]>;
  announcements: Record<string, PublicAnnouncement[]>;
  notices: Record<string, PublicNotice[]>;
  logs: Record<string, DecisionLogEntry[]>;
  tokenCounters: Record<string, number>;
  simActive: Record<string, boolean>;
}

const GLOBAL_STORE: GlobalStore = {
  tokens: {},
  counters: {},
  announcements: {},
  notices: {},
  logs: {},
  tokenCounters: {},
  simActive: {},
};

function formatClockTime(date = new Date()): string {
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function initFacilityState(facilityId: string) {
  const f = LIVE_FACILITIES.find((x) => x.id === facilityId) ?? LIVE_FACILITIES[0]!;
  if (GLOBAL_STORE.tokens[facilityId]) return;

  const now = Date.now();
  GLOBAL_STORE.tokenCounters[facilityId] = 100;
  GLOBAL_STORE.simActive[facilityId] = true;

  // Initialize realistic counters
  const counters: LiveCounter[] = [];
  let counterIndex = 1;
  const operatorNames = [
    "Dr. Sharma",
    "Nurse Preeti",
    "Agent Rahul",
    "Officer Anjali",
    "Tech Vikram",
    "Agent Sunita",
    "Desk Officer Amit",
    "Staff Neha",
    "Officer Rajiv",
  ];

  for (const desk of f.desks) {
    const initialOpen = Math.min(desk.maxCounters, Math.max(desk.minCounters, 2));
    for (let i = 0; i < initialOpen; i++) {
      counters.push({
        id: `c_${desk.id}_${i + 1}`,
        facilityId: f.id,
        name: `Counter ${counterIndex++} (${desk.name.split("—")[0]?.trim().slice(0, 16)})`,
        pointId: desk.id,
        status: "open",
        operatorName: operatorNames[(counterIndex + i) % operatorNames.length]!,
        tokensServedToday: Math.floor(12 + Math.random() * 25),
        avgServiceSeconds: Math.floor((3600 / desk.ratePerHour) * (0.85 + Math.random() * 0.3)),
        lastCalledAt: now - Math.floor(Math.random() * 180000),
      });
    }
  }
  GLOBAL_STORE.counters[facilityId] = counters;

  // Initialize realistic live tokens
  const tokens: LiveToken[] = [];
  const priorities: Priority[] = ["critical", "priority", "general"];

  f.desks.forEach((desk, deskIdx) => {
    const count = 3 + deskIdx * 2;
    for (let i = 0; i < count; i++) {
      GLOBAL_STORE.tokenCounters[facilityId]++;
      const tokenNum = `${f.prefix}-${GLOBAL_STORE.tokenCounters[facilityId]}`;
      const prio = i === 0 ? "critical" : i === 1 ? "priority" : "general";
      const waitAgeMinutes = 2 + i * 4;
      const created = now - waitAgeMinutes * 60000;

      tokens.push({
        id: `tok_${facilityId}_${GLOBAL_STORE.tokenCounters[facilityId]}`,
        tokenNumber: tokenNum,
        facilityId: f.id,
        pointId: desk.id,
        pointName: desk.name,
        priority: prio,
        status: "waiting",
        createdAt: created,
        estimatedWaitMinutes: Math.max(2, Math.round(desk.slaMinutes * (0.6 + i * 0.4))),
        queuePosition: i + 1,
        notes: prio === "critical" ? "Urgent Vitals Alert" : undefined,
      });
    }
  });

  // Pick first 2 counters to be currently serving
  if (counters[0] && tokens[0]) {
    counters[0].currentServingTokenId = tokens[0].id;
    counters[0].currentServingTokenNumber = tokens[0].tokenNumber;
    counters[0].currentPriority = tokens[0].priority;
    tokens[0].status = "serving";
    tokens[0].servedAt = now - 120000;
    tokens[0].counterId = counters[0].id;
    tokens[0].counterName = counters[0].name;
    tokens[0].operatorName = counters[0].operatorName;
  }
  if (counters[1] && tokens[1]) {
    counters[1].currentServingTokenId = tokens[1].id;
    counters[1].currentServingTokenNumber = tokens[1].tokenNumber;
    counters[1].currentPriority = tokens[1].priority;
    tokens[1].status = "serving";
    tokens[1].servedAt = now - 60000;
    tokens[1].counterId = counters[1].id;
    tokens[1].counterName = counters[1].name;
    tokens[1].operatorName = counters[1].operatorName;
  }

  GLOBAL_STORE.tokens[facilityId] = tokens;
  GLOBAL_STORE.announcements[facilityId] = [
    {
      id: "ann_init",
      facilityId: f.id,
      tokenNumber: tokens[0]?.tokenNumber ?? `${f.prefix}-101`,
      counterName: counters[0]?.name ?? "Counter 1",
      deskName: f.desks[0]?.name ?? "Service Desk",
      timestamp: now - 120000,
      message: `Token ${tokens[0]?.tokenNumber} please proceed to ${counters[0]?.name}`,
    },
  ];
  GLOBAL_STORE.notices[facilityId] = [
    {
      id: "not_1",
      facilityId: f.id,
      text: "System initialized. Priority queue balancing and SLA monitoring active across all desks.",
      timestamp: formatClockTime(),
      level: "info",
    },
  ];
  GLOBAL_STORE.logs[facilityId] = [
    {
      id: "log_1",
      time: formatClockTime(),
      text: "Shift operations online. 4 service desks staffed with 8 active counters.",
      type: "ai_recommendation",
    },
  ];
}

/* ---------------------------------------------------- state recalculation */

function recalculateMetrics(facilityId: string) {
  const f = LIVE_FACILITIES.find((x) => x.id === facilityId) ?? LIVE_FACILITIES[0]!;
  const tokens = GLOBAL_STORE.tokens[facilityId] ?? [];
  const counters = GLOBAL_STORE.counters[facilityId] ?? [];

  const waitingTokens = tokens.filter((t) => t.status === "waiting");
  const servingTokens = tokens.filter((t) => t.status === "serving" || t.status === "called");
  const completedTokens = tokens.filter((t) => t.status === "completed");
  const noShowTokens = tokens.filter((t) => t.status === "no-show");

  // Re-index queue positions & wait times per desk
  for (const desk of f.desks) {
    const deskWaiting = waitingTokens.filter((t) => t.pointId === desk.id);
    const openCounters = counters.filter(
      (c) => c.pointId === desk.id && c.status === "open",
    ).length;
    const ratePerMin = Math.max(0.1, (openCounters * desk.ratePerHour) / 60);

    // Priority ordering: Critical first, then Priority, then General
    deskWaiting.sort((a, b) => {
      const pWeight = { critical: 3, priority: 2, general: 1 };
      if (pWeight[b.priority] !== pWeight[a.priority]) {
        return pWeight[b.priority] - pWeight[a.priority];
      }
      return a.createdAt - b.createdAt;
    });

    deskWaiting.forEach((tok, idx) => {
      tok.queuePosition = idx + 1;
      tok.estimatedWaitMinutes = Math.max(1, Math.round((idx + 1) / ratePerMin));
    });
  }

  const now = Date.now();
  let totalWaitSum = 0;
  let slaCompliantCount = 0;
  let criticalWaitSum = 0;
  let criticalCount = 0;
  let generalWaitSum = 0;
  let generalCount = 0;

  for (const tok of waitingTokens) {
    const desk = f.desks.find((d) => d.id === tok.pointId);
    const waitMins = Math.round((now - tok.createdAt) / 60000);
    totalWaitSum += waitMins;
    if (desk && waitMins <= desk.slaMinutes) {
      slaCompliantCount++;
    }
    if (tok.priority === "critical" || tok.priority === "priority") {
      criticalWaitSum += waitMins;
      criticalCount++;
    } else {
      generalWaitSum += waitMins;
      generalCount++;
    }
  }

  const avgWaitMinutes =
    waitingTokens.length > 0 ? Math.round(totalWaitSum / waitingTokens.length) : 0;
  const slaAdherencePercent =
    waitingTokens.length > 0 ? Math.round((slaCompliantCount / waitingTokens.length) * 100) : 100;

  const avgCritWait = criticalCount > 0 ? criticalWaitSum / criticalCount : avgWaitMinutes;
  const avgGenWait = generalCount > 0 ? generalWaitSum / generalCount : avgWaitMinutes;
  const equityGapMinutes = Math.max(0, Math.round(avgGenWait - avgCritWait));
  const fairnessScore = Math.max(
    40,
    Math.min(
      100,
      Math.round(100 - equityGapMinutes * 3.5 - Math.max(0, avgWaitMinutes - 15) * 1.5),
    ),
  );

  return {
    totalWaiting: waitingTokens.length,
    totalServing: servingTokens.length,
    totalCompleted: completedTokens.length,
    totalNoShow: noShowTokens.length,
    avgWaitMinutes,
    slaAdherencePercent,
    fairnessScore,
    equityGapMinutes,
    openCountersCount: counters.filter((c) => c.status === "open").length,
  };
}

/* ---------------------------------------------------- operational APIs */

export function getFacilityState(facilityId: string): LiveFacilityState {
  initFacilityState(facilityId);
  const f = LIVE_FACILITIES.find((x) => x.id === facilityId) ?? LIVE_FACILITIES[0]!;
  const metrics = recalculateMetrics(facilityId);

  return {
    facility: f,
    tokens: [...(GLOBAL_STORE.tokens[facilityId] ?? [])],
    counters: [...(GLOBAL_STORE.counters[facilityId] ?? [])],
    announcements: [...(GLOBAL_STORE.announcements[facilityId] ?? [])],
    notices: [...(GLOBAL_STORE.notices[facilityId] ?? [])],
    decisionLog: [...(GLOBAL_STORE.logs[facilityId] ?? [])],
    simulationTrafficActive: GLOBAL_STORE.simActive[facilityId] ?? true,
    metrics,
  };
}

export function issueLiveToken(
  facilityId: string,
  pointId: string,
  priority: Priority = "general",
  notes?: string,
): LiveToken {
  initFacilityState(facilityId);
  const f = LIVE_FACILITIES.find((x) => x.id === facilityId) ?? LIVE_FACILITIES[0]!;
  const desk = f.desks.find((d) => d.id === pointId) ?? f.desks[0]!;

  GLOBAL_STORE.tokenCounters[facilityId] = (GLOBAL_STORE.tokenCounters[facilityId] ?? 100) + 1;
  const tokenNumber = `${f.prefix}-${GLOBAL_STORE.tokenCounters[facilityId]}`;

  const token: LiveToken = {
    id: `tok_${facilityId}_${GLOBAL_STORE.tokenCounters[facilityId]}`,
    tokenNumber,
    facilityId: f.id,
    pointId: desk.id,
    pointName: desk.name,
    priority,
    status: "waiting",
    createdAt: Date.now(),
    estimatedWaitMinutes: desk.slaMinutes,
    queuePosition: 1,
    notes,
  };

  GLOBAL_STORE.tokens[facilityId] = [token, ...(GLOBAL_STORE.tokens[facilityId] ?? [])];
  recalculateMetrics(facilityId);

  // Log event
  GLOBAL_STORE.logs[facilityId] = [
    {
      id: `log_${Date.now()}`,
      time: formatClockTime(),
      text: `Token ${tokenNumber} issued for ${desk.name} [Priority: ${priority.toUpperCase()}]`,
      type: "staff_override",
    },
    ...(GLOBAL_STORE.logs[facilityId] ?? []),
  ].slice(0, 30);

  return token;
}

export function callNextToken(facilityId: string, counterId: string): LiveToken | null {
  initFacilityState(facilityId);
  const counters = GLOBAL_STORE.counters[facilityId] ?? [];
  const counter = counters.find((c) => c.id === counterId);
  if (!counter) return null;

  const tokens = GLOBAL_STORE.tokens[facilityId] ?? [];
  const waitingForDesk = tokens.filter(
    (t) => t.status === "waiting" && t.pointId === counter.pointId,
  );

  if (waitingForDesk.length === 0) return null;

  // Sorting: Critical -> Priority -> General
  waitingForDesk.sort((a, b) => {
    const pWeight = { critical: 3, priority: 2, general: 1 };
    if (pWeight[b.priority] !== pWeight[a.priority]) {
      return pWeight[b.priority] - pWeight[a.priority];
    }
    return a.createdAt - b.createdAt;
  });

  const nextToken = waitingForDesk[0]!;
  nextToken.status = "called";
  nextToken.calledAt = Date.now();
  nextToken.counterId = counter.id;
  nextToken.counterName = counter.name;
  nextToken.operatorName = counter.operatorName;

  counter.currentServingTokenId = nextToken.id;
  counter.currentServingTokenNumber = nextToken.tokenNumber;
  counter.currentPriority = nextToken.priority;
  counter.lastCalledAt = Date.now();

  // Create public announcement for displays
  const ann: PublicAnnouncement = {
    id: `ann_${Date.now()}`,
    facilityId,
    tokenNumber: nextToken.tokenNumber,
    counterName: counter.name,
    deskName: nextToken.pointName,
    timestamp: Date.now(),
    message: `Token ${nextToken.tokenNumber} please proceed to ${counter.name}`,
  };

  GLOBAL_STORE.announcements[facilityId] = [
    ann,
    ...(GLOBAL_STORE.announcements[facilityId] ?? []),
  ].slice(0, 10);
  recalculateMetrics(facilityId);

  // Log decision
  GLOBAL_STORE.logs[facilityId] = [
    {
      id: `log_${Date.now()}`,
      time: formatClockTime(),
      text: `${counter.name} called Token ${nextToken.tokenNumber} (${nextToken.pointName})`,
      type: "staff_override",
    },
    ...(GLOBAL_STORE.logs[facilityId] ?? []),
  ].slice(0, 30);

  return nextToken;
}

export function completeService(facilityId: string, counterId: string): boolean {
  initFacilityState(facilityId);
  const counters = GLOBAL_STORE.counters[facilityId] ?? [];
  const counter = counters.find((c) => c.id === counterId);
  if (!counter || !counter.currentServingTokenId) return false;

  const tokens = GLOBAL_STORE.tokens[facilityId] ?? [];
  const token = tokens.find((t) => t.id === counter.currentServingTokenId);
  if (token) {
    token.status = "completed";
    token.completedAt = Date.now();
  }

  counter.tokensServedToday += 1;
  counter.currentServingTokenId = undefined;
  counter.currentServingTokenNumber = undefined;
  counter.currentPriority = undefined;

  recalculateMetrics(facilityId);

  GLOBAL_STORE.logs[facilityId] = [
    {
      id: `log_${Date.now()}`,
      time: formatClockTime(),
      text: `${counter.name} completed service for ${token?.tokenNumber ?? "token"}`,
      type: "staff_override",
    },
    ...(GLOBAL_STORE.logs[facilityId] ?? []),
  ].slice(0, 30);

  return true;
}

export function markNoShow(facilityId: string, counterId: string): boolean {
  initFacilityState(facilityId);
  const counters = GLOBAL_STORE.counters[facilityId] ?? [];
  const counter = counters.find((c) => c.id === counterId);
  if (!counter || !counter.currentServingTokenId) return false;

  const tokens = GLOBAL_STORE.tokens[facilityId] ?? [];
  const token = tokens.find((t) => t.id === counter.currentServingTokenId);
  if (token) {
    token.status = "no-show";
  }

  counter.currentServingTokenId = undefined;
  counter.currentServingTokenNumber = undefined;
  counter.currentPriority = undefined;

  recalculateMetrics(facilityId);

  GLOBAL_STORE.logs[facilityId] = [
    {
      id: `log_${Date.now()}`,
      time: formatClockTime(),
      text: `Token ${token?.tokenNumber ?? "unknown"} marked NO-SHOW at ${counter.name}`,
      type: "staff_override",
    },
    ...(GLOBAL_STORE.logs[facilityId] ?? []),
  ].slice(0, 30);

  return true;
}

export function recallToken(facilityId: string, counterId: string): boolean {
  initFacilityState(facilityId);
  const counters = GLOBAL_STORE.counters[facilityId] ?? [];
  const counter = counters.find((c) => c.id === counterId);
  if (!counter || !counter.currentServingTokenNumber) return false;

  const tokens = GLOBAL_STORE.tokens[facilityId] ?? [];
  const token = tokens.find((t) => t.id === counter.currentServingTokenId);

  const ann: PublicAnnouncement = {
    id: `ann_${Date.now()}`,
    facilityId,
    tokenNumber: counter.currentServingTokenNumber,
    counterName: counter.name,
    deskName: token?.pointName ?? "Counter",
    timestamp: Date.now(),
    message: `RECALL: Token ${counter.currentServingTokenNumber} please proceed to ${counter.name}`,
  };

  GLOBAL_STORE.announcements[facilityId] = [
    ann,
    ...(GLOBAL_STORE.announcements[facilityId] ?? []),
  ].slice(0, 10);
  counter.lastCalledAt = Date.now();
  return true;
}

export function updateCounter(
  facilityId: string,
  counterId: string,
  updates: { status?: CounterStatus; pointId?: string; operatorName?: string },
): boolean {
  initFacilityState(facilityId);
  const counters = GLOBAL_STORE.counters[facilityId] ?? [];
  const counter = counters.find((c) => c.id === counterId);
  if (!counter) return false;

  if (updates.status) counter.status = updates.status;
  if (updates.pointId) counter.pointId = updates.pointId;
  if (updates.operatorName) counter.operatorName = updates.operatorName;

  recalculateMetrics(facilityId);

  GLOBAL_STORE.logs[facilityId] = [
    {
      id: `log_${Date.now()}`,
      time: formatClockTime(),
      text: `Counter update for ${counter.name}: status=${counter.status}, desk=${counter.pointId}`,
      type: "staff_override",
    },
    ...(GLOBAL_STORE.logs[facilityId] ?? []),
  ].slice(0, 30);

  return true;
}

export function broadcastPublicNotice(
  facilityId: string,
  text: string,
  level: "info" | "warning" | "critical" = "info",
): boolean {
  initFacilityState(facilityId);
  const notice: PublicNotice = {
    id: `not_${Date.now()}`,
    facilityId,
    text,
    timestamp: formatClockTime(),
    level,
  };

  GLOBAL_STORE.notices[facilityId] = [notice, ...(GLOBAL_STORE.notices[facilityId] ?? [])].slice(
    0,
    8,
  );
  GLOBAL_STORE.logs[facilityId] = [
    {
      id: `log_${Date.now()}`,
      time: formatClockTime(),
      text: `Public notice broadcast: "${text}"`,
      type: "broadcast",
    },
    ...(GLOBAL_STORE.logs[facilityId] ?? []),
  ].slice(0, 30);

  return true;
}

export function transferLiveToken(
  facilityId: string,
  tokenId: string,
  targetPointId: string,
): boolean {
  initFacilityState(facilityId);
  const f = LIVE_FACILITIES.find((x) => x.id === facilityId) ?? LIVE_FACILITIES[0]!;
  const targetDesk = f.desks.find((d) => d.id === targetPointId);
  if (!targetDesk) return false;

  const tokens = GLOBAL_STORE.tokens[facilityId] ?? [];
  const token = tokens.find((t) => t.id === tokenId);
  if (!token) return false;

  const oldPointName = token.pointName;
  token.pointId = targetDesk.id;
  token.pointName = targetDesk.name;
  token.status = "waiting";
  token.counterId = undefined;
  token.counterName = undefined;

  recalculateMetrics(facilityId);

  GLOBAL_STORE.logs[facilityId] = [
    {
      id: `log_${Date.now()}`,
      time: formatClockTime(),
      text: `Token ${token.tokenNumber} transferred from ${oldPointName} to ${targetDesk.name}`,
      type: "staff_override",
    },
    ...(GLOBAL_STORE.logs[facilityId] ?? []),
  ].slice(0, 30);

  return true;
}

export function cancelLiveToken(facilityId: string, tokenId: string): boolean {
  initFacilityState(facilityId);
  const tokens = GLOBAL_STORE.tokens[facilityId] ?? [];
  const token = tokens.find((t) => t.id === tokenId);
  if (!token) return false;

  token.status = "cancelled";
  recalculateMetrics(facilityId);

  GLOBAL_STORE.logs[facilityId] = [
    {
      id: `log_${Date.now()}`,
      time: formatClockTime(),
      text: `Token ${token.tokenNumber} cancelled by visitor/staff`,
      type: "staff_override",
    },
    ...(GLOBAL_STORE.logs[facilityId] ?? []),
  ].slice(0, 30);

  return true;
}

export function bumpTokenPriority(
  facilityId: string,
  tokenId: string,
  priority: Priority,
): boolean {
  initFacilityState(facilityId);
  const tokens = GLOBAL_STORE.tokens[facilityId] ?? [];
  const token = tokens.find((t) => t.id === tokenId);
  if (!token) return false;

  token.priority = priority;
  recalculateMetrics(facilityId);

  GLOBAL_STORE.logs[facilityId] = [
    {
      id: `log_${Date.now()}`,
      time: formatClockTime(),
      text: `Token ${token.tokenNumber} priority elevated to ${priority.toUpperCase()}`,
      type: "staff_override",
    },
    ...(GLOBAL_STORE.logs[facilityId] ?? []),
  ].slice(0, 30);

  return true;
}

/* ---------------------------------------------------- web audio chime & voice synth */

export function playQueueChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First tone (C5 - 523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Second tone (E5 - 659.25 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, now + 0.18);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.35, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.85);
  } catch (err) {
    console.warn("Audio chime playback error:", err);
  }
}

export function speakAnnouncement(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Speech synthesis error:", err);
  }
}
