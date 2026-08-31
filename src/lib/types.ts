export type Priority = "critical" | "priority" | "general";
export type TokenStatus = "waiting" | "called" | "serving" | "completed" | "no-show" | "cancelled";
export type CounterStatus = "open" | "paused" | "closed";

export interface LiveDesk {
  id: string;
  name: string;
  slaMinutes: number;
  minCounters: number;
  maxCounters: number;
  ratePerHour: number;
  description: string;
  weight: number;
}

export interface LiveZone {
  id: string;
  name: string;
  capacity: number;
}

export interface LiveFacility {
  id: string;
  name: string;
  kind: string;
  visitorWord: string;
  pointWord: string;
  prefix: string;
  desks: LiveDesk[];
  zones: LiveZone[];
}

export interface LiveToken {
  id: string;
  tokenNumber: string;
  facilityId: string;
  pointId: string;
  pointName: string;
  priority: Priority;
  status: TokenStatus;
  createdAt: number;
  calledAt?: number;
  servedAt?: number;
  completedAt?: number;
  counterId?: string;
  counterName?: string;
  operatorName?: string;
  estimatedWaitMinutes: number;
  queuePosition: number;
  notes?: string;
}

export interface LiveCounter {
  id: string;
  facilityId: string;
  name: string;
  pointId: string;
  status: CounterStatus;
  currentServingTokenId?: string;
  currentServingTokenNumber?: string;
  currentPriority?: Priority;
  operatorName: string;
  tokensServedToday: number;
  avgServiceSeconds: number;
  lastCalledAt?: number;
}

export interface PublicAnnouncement {
  id: string;
  facilityId: string;
  tokenNumber: string;
  counterName: string;
  deskName: string;
  timestamp: number;
  message: string;
}

export interface PublicNotice {
  id: string;
  facilityId: string;
  text: string;
  timestamp: string;
  level: "info" | "warning" | "critical";
}

export interface DecisionLogEntry {
  id: string;
  time: string;
  text: string;
  type: "ai_recommendation" | "staff_override" | "escalation" | "broadcast";
}

export interface LiveFacilityState {
  facility: LiveFacility;
  tokens: LiveToken[];
  counters: LiveCounter[];
  announcements: PublicAnnouncement[];
  notices: PublicNotice[];
  decisionLog: DecisionLogEntry[];
  simulationTrafficActive: boolean;
  metrics: {
    totalWaiting: number;
    totalServing: number;
    totalCompleted: number;
    totalNoShow: number;
    avgWaitMinutes: number;
    slaAdherencePercent: number;
    fairnessScore: number;
    equityGapMinutes: number;
    openCountersCount: number;
  };
}
