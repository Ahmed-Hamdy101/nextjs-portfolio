import { postJson } from "@/lib/http";
import type { SchedulePayload, ScheduleResult } from "@/types/content";

/** Booking transport. The form owns state; this owns the wire format. */
export const scheduleService = {
    create: (payload: SchedulePayload): Promise<ScheduleResult> => postJson<ScheduleResult>("/api/schedule", payload),
};

export const browserTimezone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;
