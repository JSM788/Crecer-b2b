import {
  dateKey,
  validateAttachment,
  type Attachment,
  type Command,
  type Customer,
  type Session,
  type Snapshot,
  type Visit,
} from "../modules/visits/domain/field";
import { validateAudit } from "../modules/visits/domain/exhibition-audit";

export class FieldError extends Error {
  constructor(
    public code: string,
    public status = 0,
  ) {
    super(code);
  }
}
type Options = {
  web: boolean;
  apiUrl?: string;
  development?: boolean;
  fetch?: typeof fetch;
  randomKey?: () => string;
};
export type Invitation = {
  companyId: string;
  companyName: string;
  tenantHost: string;
  email: string;
  role: "manager" | "commercial" | "merchandiser";
  expiresAt: string;
  purpose: "activation" | "password_reset";
};
const validTenantHost = (value: string) => /^[a-zA-Z0-9][a-zA-Z0-9.-]*(?::\d{1,5})?$/.test(value);
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new FieldError("invalid_response");
  return value as Record<string, unknown>;
};
const str = (v: unknown): string => {
  if (typeof v !== "string" || !v.length)
    throw new FieldError("invalid_response");
  return v;
};
const optional = (v: unknown) => (v === null ? undefined : str(v));
const count = (v: unknown): number => {
  if (!Number.isSafeInteger(v) || Number(v) < 0) throw new FieldError("invalid_response");
  return v as number;
};
const oneOf = <const T extends string>(
  v: unknown,
  choices: readonly T[],
): T => {
  if (!choices.includes(v as T)) throw new FieldError("invalid_response");
  return v as T;
};
const timestamp = (v: unknown) => {
  const s = str(v);
  if (!/^\d{4}-\d{2}-\d{2}T/.test(s) || !Number.isFinite(Date.parse(s)))
    throw new FieldError("invalid_response");
  return s;
};

function session(value: unknown): Session {
  const v = record(value);
  if (v.role === "manager") throw new FieldError("web_access_only");
  const timeZone = str(v.timeZone);
  try {
    new Intl.DateTimeFormat("es-PE", { timeZone });
  } catch {
    throw new FieldError("invalid_response");
  }
  return {
    companyId: str(v.companyId),
    membershipId: str(v.membershipId),
    userId: str(v.userId),
    role: oneOf(v.role, ["commercial", "merchandiser"]),
    email: str(v.email),
    timeZone,
  };
}
function visit(value: unknown): Visit {
  const v = record(value);
  let audit;
  if (v.audit !== null && v.audit !== undefined) {
    try {
      audit = validateAudit(v.audit);
    } catch {
      throw new FieldError("invalid_response");
    }
  }
  return {
    id: str(v.id),
    customerId: str(v.customer_id),
    customerName: str(v.customer_name),
    customerAddress: str(v.customer_address),
    scheduledAt: timestamp(v.scheduled_at),
    workdayId: optional(v.workday_id),
    status: oneOf(v.status, ["pending", "active", "completed", "cancelled"]),
    plannedRole: v.planned_role == null ? undefined : oneOf(v.planned_role, ["commercial", "merchandiser"]),
    executionRole: v.execution_role == null ? undefined : oneOf(v.execution_role, ["commercial", "merchandiser"]),
    cancelledAt: v.cancelled_at == null ? undefined : timestamp(v.cancelled_at),
    cancellationReason: v.cancellation_reason == null ? undefined : str(v.cancellation_reason),
    arrivedAt: v.arrived_at === null ? undefined : timestamp(v.arrived_at),
    endedAt: v.ended_at === null ? undefined : timestamp(v.ended_at),
    result:
      v.result === null
        ? undefined
        : oneOf(v.result, ["attended", "closed", "unavailable"]),
    observations:
      v.observations === null
        ? undefined
        : typeof v.observations === "string"
          ? v.observations
          : (() => {
              throw new FieldError("invalid_response");
            })(),
    ...(audit ? { audit } : {}),
  };
}
const customersFor = (visits: Visit[]) => Array.from(new Map(visits.map(value => [value.customerId, {id: value.customerId, name: value.customerName, address: value.customerAddress}])).values());

/** The browser uses an HttpOnly same-origin BFF; native tokens exist only in this instance. */
export class FieldApi {
  private token?: string;
  private pending?: { identity: string; key: string };
  private origin: string;
  private fetcher: typeof fetch;
  private generation = 0;
  private loadFlight?: Promise<Snapshot>;
  private agendaPageCount = 1;
  private loaded?: Snapshot;
  private moreFlight?: Promise<Snapshot>;
  get hasPending() {
    return !!this.pending;
  }
  constructor(private options: Options) {
    this.fetcher = options.fetch ?? ((...args) => globalThis.fetch(...args));
    this.origin = "/api/field";
    if (!options.web) {
      try {
        const url = new URL(options.apiUrl ?? "");
        const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(
          url.hostname,
        );
        const octets = url.hostname.split(".").map(Number);
        const privateIPv4 =
          /^\d+\.\d+\.\d+\.\d+$/.test(url.hostname) &&
          octets.every((part) => part >= 0 && part <= 255) &&
          (octets[0] === 10 ||
            (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
            (octets[0] === 192 && octets[1] === 168));
        const localDevelopment = options.development === true && privateIPv4;
        if (
          url.username ||
          url.password ||
          url.search ||
          url.hash ||
          url.pathname !== "/" ||
          (url.protocol !== "https:" &&
            !(url.protocol === "http:" && (loopback || localDevelopment)))
        )
          throw new Error();
        this.origin = url.origin + "/v1";
      } catch {
        throw new FieldError("configuration_error");
      }
    }
  }
  private async request(
    path: string,
    body?: unknown,
    key?: string,
  ): Promise<unknown> {
    const generation = this.generation;
    let response: Response;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      response = await this.fetcher(
        this.requestUrl(path),
        {
          method: body === undefined ? "GET" : "POST",
          credentials: this.options.web ? "same-origin" : "omit",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
            ...(key ? { "Idempotency-Key": key } : {}),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
        },
      );
    } catch {
      clearTimeout(timeout);
      if (generation !== this.generation) throw new FieldError("request_superseded");
      throw new FieldError("network_error");
    }
    if (generation !== this.generation) {
      clearTimeout(timeout);
      throw new FieldError("request_superseded");
    }
    if (response.status === 401) {
      clearTimeout(timeout);
      this.token = undefined;
      throw new FieldError(
        path === "/auth/login"
          ? "invalid_credentials"
          : "authentication_required",
        401,
      );
    }
    let value: unknown;
    try {
      value = await response.json();
    } catch {
      throw new FieldError("invalid_response", response.status);
    } finally {
      clearTimeout(timeout);
    }
    if (generation !== this.generation) throw new FieldError("request_superseded");
    if (!response.ok)
      throw new FieldError(
        typeof record(value).code === "string"
          ? (record(value).code as string)
          : "request_failed",
        response.status,
      );
    return value;
  }
  async login(email: string, password: string) {
    this.invalidate();
    this.token = undefined;
    this.pending = undefined;
    this.agendaPageCount = 1;
    this.loaded = undefined;
    const value = record(
      await this.request("/auth/login", { email: email.trim(), password }),
    );
    if (!this.options.web) {
      const token = str(value.token);
      if (
        !/^[A-Za-z0-9_-]{43}$/.test(token) ||
        Date.parse(timestamp(value.expiresAt)) <= Date.now()
      )
        throw new FieldError("invalid_response");
      this.token = token;
    } else if (value.authenticated !== true)
      throw new FieldError("invalid_response");
    this.pending = undefined;
  }
  async logout() {
    this.invalidate();
    try {
      await this.request("/auth/logout", {});
    } finally {
      this.token = undefined;
      this.pending = undefined;
      this.loaded = undefined;
    }
  }
  private requestUrl(path: string) {
    const [pathname, query] = path.split("?");
    return this.origin + pathname + (this.options.web ? "/" : "") + (query ? `?${query}` : "");
  }
  private invalidate() {
    this.generation++;
    this.loadFlight = undefined;
  }
  async invitation(token: string): Promise<Invitation> {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new FieldError("invitation_invalid");
    const value = record(await this.request(`/invitations/${encodeURIComponent(token)}`));
    const tenantHost = str(value.tenantHost);
    if (!validTenantHost(tenantHost)) throw new FieldError("invalid_response");
    return {companyId: str(value.companyId), companyName: str(value.companyName), tenantHost, email: str(value.email), role: oneOf(value.role, ["manager", "commercial", "merchandiser"]), expiresAt: timestamp(value.expiresAt), purpose: oneOf(value.purpose, ["activation", "password_reset"])};
  }
  async acceptInvitation(token: string, password: string) {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new FieldError("invitation_invalid");
    const value = record(await this.request(`/invitations/${encodeURIComponent(token)}/accept`, {password}));
    const tenantHost = str(value.tenantHost);
    if (!validTenantHost(tenantHost)) throw new FieldError("invalid_response");
    const result = {companyId: str(value.companyId), tenantHost, email: str(value.email), purpose: oneOf(value.purpose, ["activation", "password_reset"])};
    this.invalidate();
    this.token = undefined;
    this.pending = undefined;
    this.agendaPageCount = 1;
    this.loaded = undefined;
    return result;
  }
  load(now = new Date()): Promise<Snapshot> {
    if (this.loadFlight) return this.loadFlight;
    const generation = this.generation;
    const flight = this.loadSnapshot(now).then(value => {
      if (generation !== this.generation) throw new FieldError("request_superseded");
      this.loaded = value;
      return value;
    }).finally(() => {
      if (this.loadFlight === flight) this.loadFlight = undefined;
    });
    this.loadFlight = flight;
    return flight;
  }
  loadMore(): Promise<Snapshot> {
    if (this.moreFlight) return this.moreFlight;
    const generation = this.generation;
    const flight = (async () => {
      if (this.loadFlight) await this.loadFlight;
      const current = this.loaded;
      if (!current || !current.agendaPage) throw new FieldError("authentication_required");
      if (current.visits.length >= current.agendaPage.total) return current;
      const page = current.agendaPage.page + 1;
      const agenda = await this.agendaPages(page, page);
      if (generation !== this.generation) throw new FieldError("request_superseded");
      if (agenda.total !== current.agendaPage.total) throw new FieldError("snapshot_changed");
      const visits = agenda.items.map(visit);
      if (visits.some(value => current.visits.some(previous => previous.id === value.id)) || agenda.items.some(value => {
        const item = record(value);
        return item.company_id !== current.session.companyId || item.membership_id !== current.session.membershipId;
      })) throw new FieldError("snapshot_changed");
      const merged = [...current.visits, ...visits];
      this.agendaPageCount = page;
      this.loaded = {...current, visits: merged, customers: customersFor(merged), agendaPage: {page, pageSize: 100, total: agenda.total}};
      return this.loaded;
    })().finally(() => {if (this.moreFlight === flight) this.moreFlight = undefined;});
    this.moreFlight = flight;
    return flight;
  }
  private async agendaPages(firstPage = 1, lastPage = this.agendaPageCount) {
    const items: unknown[] = [];
    const seen = new Set<string>();
    let page = firstPage;
    let total: number | undefined;
    do {
      const value = record(await this.request(`/me/agenda?page=${page}&pageSize=100`));
      if (!Array.isArray(value.items) || value.page !== page || value.pageSize !== 100 || !Number.isSafeInteger(value.total) || Number(value.total) < 0) throw new FieldError("invalid_response");
      total ??= Number(value.total);
      if (value.total !== total || value.items.length > 100 || (value.items.length === 0 && (page - 1) * 100 < total)) throw new FieldError("snapshot_changed");
      for (const item of value.items) {
        const id = str(record(item).id);
        if (seen.has(id)) throw new FieldError("snapshot_changed");
        seen.add(id);
        items.push(item);
      }
      if ((firstPage - 1) * 100 + items.length > total) throw new FieldError("invalid_response");
      page++;
    } while ((firstPage - 1) * 100 + items.length < total && page <= lastPage);
    return {items, page: page - 1, pageSize: 100, total};
  }
  private async loadSnapshot(now: Date): Promise<Snapshot> {
    const current = session(await this.request("/me"));
    const [agenda, rawDay, rawCustomers] = await Promise.all([
      this.agendaPages(),
      this.request("/me/workday"),
      this.request("/me/customers?pageSize=100").catch(() => null),
    ]);
    const rawVisits = agenda.items;
    const day = rawDay === null ? undefined : record(rawDay);
    const visits = rawVisits.map(visit);
    let customers = customersFor(visits);
    if (
      rawCustomers &&
      typeof rawCustomers === "object" &&
      Array.isArray((rawCustomers as Record<string, unknown>).items)
    ) {
      try {
        const list: Customer[] = (rawCustomers as { items: Record<string, unknown>[] }).items.map((c) => ({
          id: str(c.id),
          name: str(c.name),
          address: str(c.address),
          district: c.district ? str(c.district) : undefined,
          ruc: c.ruc ? str(c.ruc) : undefined,
          latitude: typeof c.latitude === "number" ? c.latitude : undefined,
          longitude: typeof c.longitude === "number" ? c.longitude : undefined,
        }));
        const existingIds = new Set(list.map((c) => c.id));
        for (const c of customers) {
          if (!existingIds.has(c.id)) {
            list.push(c);
            existingIds.add(c.id);
          }
        }
        customers = list;
      } catch {
        // Fallback to customersFor(visits)
      }
    }
    if (
      rawVisits.some((value) => {
        const v = record(value);
        return (
          v.company_id !== current.companyId ||
          v.membership_id !== current.membershipId
        );
      }) ||
      (day &&
        (day.company_id !== current.companyId ||
          day.membership_id !== current.membershipId))
    )
      throw new FieldError("invalid_response");
    const priorCompleted =
      day &&
      oneOf(day.status, ["active", "completed"]) === "completed" &&
      str(day.business_date) < dateKey(now, current.timeZone);
    return {
      session: current,
      customers,
      visits,
      agendaPage: {page: agenda.page, pageSize: agenda.pageSize, total: agenda.total},
      workday:
        day && !priorCompleted
          ? {
              id: str(day.id),
              status: oneOf(day.status, ["active", "completed"]),
              startedAt: timestamp(day.started_at),
              endedAt: optional(day.ended_at),
              completedVisits: count(day.completed_visits),
              totalVisits: count(day.total_visits),
            }
          : { status: "not-started" },
    };
  }
  async evidence(id: string): Promise<Attachment | null> {
    const data = await this.request(
      `/me/visits/${encodeURIComponent(id)}/evidence`,
    );
    return data === null ? null : validateAttachment(data);
  }
  async command(command: Command) {
    const path =
      command.type === "START_WORKDAY"
        ? "/me/workdays/start"
        : command.type === "END_WORKDAY"
          ? "/me/workdays/end"
          : command.type === "SCHEDULE_VISIT"
            ? "/me/visits"
            : `/me/visits/${encodeURIComponent(command.visitId)}/${command.type === "ARRIVE" ? "check-in" : "close"}`;
    const body =
      command.type === "FINISH_VISIT"
        ? {
            result: command.result,
            observations: command.observations.trim(),
            ...(command.attachment ? { attachment: command.attachment } : {}),
            ...(command.audit ? { audit: validateAudit(command.audit) } : {}),
          }
        : command.type === "SCHEDULE_VISIT"
          ? {
              customerId: command.customerId,
              scheduledAt: command.scheduledAt,
              ...(command.observations ? { observations: command.observations } : {}),
            }
          : command.type === "END_WORKDAY"
            ? (command.justification ? { justification: command.justification } : {})
            : {};
    const identity = path + JSON.stringify(body);
    if (this.pending && this.pending.identity !== identity)
      throw new FieldError("uncertain_action_pending");
    this.pending ??= {
      identity,
      key: this.options.randomKey
        ? this.options.randomKey()
        : globalThis.crypto.randomUUID(),
    };
    this.invalidate();
    try {
      const response = record(await this.request(path, body, this.pending.key));
      str(response.id);
      if (command.type === "SCHEDULE_VISIT") {
        if (response.status !== "pending")
          throw new FieldError("invalid_response");
      } else {
        const isDay =
          command.type === "START_WORKDAY" || command.type === "END_WORKDAY";
        const expected =
          command.type === "START_WORKDAY" || command.type === "ARRIVE"
            ? "active"
            : "completed";
        if (response.status !== expected)
          throw new FieldError("invalid_response");
        if (isDay) {
          timestamp(response.started_at);
          if (command.type === "END_WORKDAY") timestamp(response.ended_at);
        } else {
          if (response.id !== command.visitId)
            throw new FieldError("invalid_response");
          timestamp(response.arrived_at);
          if (command.type === "FINISH_VISIT") {
            timestamp(response.ended_at);
            if (response.result !== command.result)
              throw new FieldError("invalid_response");
          }
        }
      }
      // Release on confirmed command success, even if the subsequent read fails.
      this.pending = undefined;
    } catch (error) {
      if (
        error instanceof FieldError &&
        error.status >= 400 &&
        error.status < 500
      )
        this.pending = undefined;
      throw error;
    }
  }
}
