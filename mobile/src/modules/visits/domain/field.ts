import { validateAudit, type ExhibitionAudit } from "./exhibition-audit";
export type { ExhibitionAudit } from "./exhibition-audit";

export type VisitResult = "attended" | "closed" | "unavailable";
export type Attachment = {
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  base64: string;
};
export type Session = {
  companyId: string;
  membershipId: string;
  userId: string;
  role: "commercial" | "merchandiser";
  email: string;
  timeZone: string;
};
export type Customer = {
  id: string;
  name: string;
  address: string;
  district?: string;
  ruc?: string;
  latitude?: number;
  longitude?: number;
};
export type Visit = {
  id: string;
  customerId: string;
  customerName: string;
  customerAddress: string;
  scheduledAt: string;
  workdayId?: string;
  status: "pending" | "active" | "completed" | "cancelled";
  plannedRole?: "commercial" | "merchandiser";
  executionRole?: "commercial" | "merchandiser";
  cancelledAt?: string;
  cancellationReason?: string;
  arrivedAt?: string;
  endedAt?: string;
  result?: VisitResult;
  observations?: string;
  audit?: ExhibitionAudit;
};
export type Snapshot = {
  session: Session;
  customers: Customer[];
  visits: Visit[];
  agendaPage?: {page: number; pageSize: number; total: number};
  workday: {
    id?: string;
    status: "not-started" | "active" | "completed";
    startedAt?: string;
    endedAt?: string;
    completedVisits?: number;
    totalVisits?: number;
  };
};
export type Command =
  | { type: "START_WORKDAY" }
  | { type: "END_WORKDAY" }
  | { type: "ARRIVE"; visitId: string }
  | {
      type: "FINISH_VISIT";
      visitId: string;
      result?: VisitResult;
      observations: string;
      attachment?: Attachment;
      audit?: ExhibitionAudit;
    }
  | {
      type: "SCHEDULE_VISIT";
      customerId: string;
      scheduledAt: string;
    };

export function dateKey(value: Date | string, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  return ["year", "month", "day"]
    .map((type) => parts.find((p) => p.type === type)!.value)
    .join("-");
}
export function dueVisits(snapshot: Snapshot, now = new Date()) {
  const today = dateKey(now, snapshot.session.timeZone);
  return snapshot.visits.filter(
    (v) =>
      v.status !== "cancelled" &&
      dateKey(v.scheduledAt, snapshot.session.timeZone) <= today &&
      (v.status !== "completed" ||
        (snapshot.workday.id
          ? v.workdayId === snapshot.workday.id
          : dateKey(v.scheduledAt, snapshot.session.timeZone) === today)),
  );
}
export function guard(
  snapshot: Snapshot | undefined,
  command: Command,
  now = new Date(),
) {
  if (!snapshot) throw new Error("authentication_required");
  if (command.type === "START_WORKDAY") {
    if (snapshot.workday.status !== "not-started")
      throw new Error("workday_already_started");
    return;
  }
  if (command.type === "SCHEDULE_VISIT") {
    if (!command.customerId) throw new Error("customer_not_found");
    return;
  }
  if (snapshot.workday.status !== "active")
    throw new Error("active_workday_required");
  if (command.type === "END_WORKDAY") {
    const counts = snapshot.workday;
    if ((counts.totalVisits !== undefined && counts.completedVisits !== undefined)
      ? counts.completedVisits < counts.totalVisits
      : dueVisits(snapshot, now).some((v) => v.status !== "completed"))
      throw new Error("visits_remaining");
    return;
  }
  const visit = snapshot.visits.find((v) => v.id === command.visitId);
  if (!visit) throw new Error("visit_not_found");
  if (command.type === "ARRIVE") {
    if (
      dateKey(visit.scheduledAt, snapshot.session.timeZone) >
      dateKey(now, snapshot.session.timeZone)
    )
      throw new Error("visit_scheduled_in_future");
    if (visit.status !== "pending") throw new Error("visit_not_pending");
    if (snapshot.visits.some((v) => v.status === "active"))
      throw new Error("another_visit_active");
    return;
  }
  if (visit.status !== "active") throw new Error("active_visit_required");
  if (!["attended", "closed", "unavailable"].includes(command.result ?? ""))
    throw new Error("visit_result_required");
  if (command.observations.length > 4000)
    throw new Error("invalid_observations");
  const needsAudit =
    visit.executionRole === "merchandiser" && command.result === "attended";
  if (command.audit !== undefined && !needsAudit)
    throw new Error("audit_not_allowed");
  if (needsAudit) {
    if (!command.audit) throw new Error("audit_required");
    validateAudit(command.audit);
    if (!command.attachment) throw new Error("audit_photo_required");
  }
  if (command.attachment) validateAttachment(command.attachment);
}

export function validateAttachment(value: unknown): Attachment {
  const a = value as Attachment;
  if (
    !a ||
    !["image/jpeg", "image/png", "image/webp"].includes(a.mimeType) ||
    typeof a.base64 !== "string" ||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(
      a.base64,
    ) ||
    !a.base64.length
  )
    throw new Error("invalid_attachment");
  const bytes =
    (a.base64.length * 3) / 4 -
    (a.base64.endsWith("==") ? 2 : a.base64.endsWith("=") ? 1 : 0);
  if (bytes > 1024 * 1024) throw new Error("attachment_too_large");
  return a;
}
