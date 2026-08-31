import { createServerFn } from "@tanstack/react-start";
import {
  getFacilityState,
  issueLiveToken,
  callNextToken,
  completeService,
  markNoShow,
  recallToken,
  updateCounter,
  broadcastPublicNotice,
  transferLiveToken,
  cancelLiveToken,
  bumpTokenPriority,
} from "./queue-store";
import type { Priority, CounterStatus } from "./types";

export const getLiveQueue = createServerFn({ method: "GET" })
  .inputValidator((data: { facilityId: string }) => data)
  .handler(async ({ data }) => {
    return getFacilityState(data?.facilityId || "hospital");
  });

export const issueTokenServer = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { facilityId: string; pointId: string; priority: Priority; notes?: string }) => data,
  )
  .handler(async ({ data }) => {
    return issueLiveToken(
      data.facilityId || "hospital",
      data.pointId,
      data.priority || "general",
      data.notes,
    );
  });

export const callNextTokenServer = createServerFn({ method: "POST" })
  .inputValidator((data: { facilityId: string; counterId: string }) => data)
  .handler(async ({ data }) => {
    return callNextToken(data.facilityId || "hospital", data.counterId);
  });

export const completeServiceServer = createServerFn({ method: "POST" })
  .inputValidator((data: { facilityId: string; counterId: string }) => data)
  .handler(async ({ data }) => {
    return { ok: completeService(data.facilityId || "hospital", data.counterId) };
  });

export const markNoShowServer = createServerFn({ method: "POST" })
  .inputValidator((data: { facilityId: string; counterId: string }) => data)
  .handler(async ({ data }) => {
    return { ok: markNoShow(data.facilityId || "hospital", data.counterId) };
  });

export const recallTokenServer = createServerFn({ method: "POST" })
  .inputValidator((data: { facilityId: string; counterId: string }) => data)
  .handler(async ({ data }) => {
    return { ok: recallToken(data.facilityId || "hospital", data.counterId) };
  });

export const updateCounterServer = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      facilityId: string;
      counterId: string;
      status?: CounterStatus;
      pointId?: string;
      operatorName?: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    return {
      ok: updateCounter(data.facilityId || "hospital", data.counterId, {
        status: data.status,
        pointId: data.pointId,
        operatorName: data.operatorName,
      }),
    };
  });

export const broadcastNoticeServer = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { facilityId: string; text: string; level: "info" | "warning" | "critical" }) => data,
  )
  .handler(async ({ data }) => {
    return {
      ok: broadcastPublicNotice(data.facilityId || "hospital", data.text, data.level || "info"),
    };
  });

export const transferTokenServer = createServerFn({ method: "POST" })
  .inputValidator((data: { facilityId: string; tokenId: string; targetPointId: string }) => data)
  .handler(async ({ data }) => {
    return {
      ok: transferLiveToken(data.facilityId || "hospital", data.tokenId, data.targetPointId),
    };
  });

export const cancelTokenServer = createServerFn({ method: "POST" })
  .inputValidator((data: { facilityId: string; tokenId: string }) => data)
  .handler(async ({ data }) => {
    return { ok: cancelLiveToken(data.facilityId || "hospital", data.tokenId) };
  });

export const bumpPriorityServer = createServerFn({ method: "POST" })
  .inputValidator((data: { facilityId: string; tokenId: string; priority: Priority }) => data)
  .handler(async ({ data }) => {
    return { ok: bumpTokenPriority(data.facilityId || "hospital", data.tokenId, data.priority) };
  });
