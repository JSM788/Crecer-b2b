import { Injectable, NotFoundException } from '@nestjs/common';
import {
  listSourceLogFiles,
  LogLevel,
  LogSource,
  readRecentSourceLogs,
  readSourceLogFile,
  writeSourceLog,
} from '../../../common/logging';
import { pageResult } from '../../../common/pagination';
import { PlatformPrincipal } from '../../../common/types/principal';
import { PrismaService } from '../../../database/prisma.service';
import {
  ClientLogInput,
  PlatformLogEvent,
  PlatformLogEventsQuery,
  PlatformLogFilesQuery,
  PlatformLogUsersQuery,
  PlatformLogUserSummary,
} from '../dto/platform.dto';
import { PlatformAccessService } from './platform-access.service';

const ACTION_MESSAGES: Record<string, string> = {
  platform_create_company: 'Creó una nueva empresa en la plataforma',
  platform_edit_company: 'Actualizó los datos de una empresa',
  platform_suspend_company: 'Suspendió el acceso de una empresa',
  platform_activate_company: 'Reactivó una empresa',
  platform_invite_member: 'Envió una invitación a un miembro',
  platform_edit_member: 'Editó el perfil o rol de un miembro',
  platform_deactivate_member: 'Desactivó a un miembro',
  platform_reactivate_member: 'Reactivó a un miembro',
  login_success: 'Inició sesión correctamente',
  login_failed: 'Intento fallido de inicio de sesión',
  workday_start: 'Inició su jornada laboral',
  workday_end: 'Finalizó su jornada laboral',
  visit_checkin: 'Registró check-in en visita a cliente',
  visit_checkout: 'Registró check-out en visita a cliente',
  visit_create: 'Creó una nueva visita',
  customer_create: 'Registró un nuevo cliente',
  customer_assign: 'Asignó clientes a un vendedor',
  backend_started: 'El servidor backend inició correctamente',
  shutdown_failed: 'Error al apagar el servidor backend',
  startup_failed: 'Error al iniciar el servidor backend',
};

function formatHumanAction(
  action: string,
  details?: Record<string, unknown> | null,
  companyName?: string | null,
): string {
  const base =
    ACTION_MESSAGES[action] ??
    action
      .replace(/[._-]+/g, ' ')
      .trim()
      .replace(/^./, (c) => c.toUpperCase());

  const contextParts: string[] = [];
  if (companyName) contextParts.push(companyName);
  if (details && typeof details.email === 'string') contextParts.push(details.email);
  if (details && typeof details.role === 'string') contextParts.push(`rol ${details.role}`);

  return contextParts.length > 0 ? `${base} (${contextParts.join(' · ')})` : base;
}

function inferLevelFromAction(action: string): LogLevel {
  const lower = action.toLowerCase();
  if (lower.includes('error') || lower.includes('fail')) return 'error';
  if (lower.includes('suspend') || lower.includes('warn') || lower.includes('deactivate')) {
    return 'warn';
  }
  return 'info';
}

@Injectable()
export class PlatformLogsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: PlatformAccessService,
  ) {}

  ingestClientLog(input: ClientLogInput) {
    const saved = writeSourceLog(input.source, {
      level: input.level,
      event: input.event,
      message: input.message,
      userId: input.userId ?? null,
      userEmail: input.userEmail ?? null,
      userName: input.userName ?? null,
      companyId: input.companyId ?? null,
      companyName: input.companyName ?? null,
      screen: input.screen ?? null,
      details: input.details ?? null,
    });
    return { accepted: true as const, id: saved.id };
  }

  private async collectUnifiedEvents(
    principal: PlatformPrincipal,
    options: { hours?: number; source?: LogSource } = {},
  ): Promise<PlatformLogEvent[]> {
    await this.prisma.readTransaction((tx) => this.access.requireOwner(tx, principal));
    const hours = options.hours ?? 168;
    const sinceDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    const sinceMs = sinceDate.getTime();

    const fileEntries = readRecentSourceLogs({
      source: options.source,
      sinceMs,
      limit: 600,
    }).map<PlatformLogEvent>((entry) => ({
      id: entry.id,
      timestamp: entry.time,
      source: entry.source,
      level: entry.level,
      event: entry.event,
      message: entry.message,
      userId: entry.userId ?? null,
      userEmail: entry.userEmail ?? null,
      userName: entry.userName ?? null,
      companyId: entry.companyId ?? null,
      companyName: entry.companyName ?? null,
      screen: entry.screen ?? null,
      details: entry.details ?? null,
    }));

    if (options.source && options.source !== 'backend') {
      return fileEntries;
    }

    const [platformRows, companyRows] = await this.prisma.readTransaction(
      async (tx) => {
        await this.access.requireOwner(tx, principal);
        const [pRows, aRows] = await Promise.all([
          tx.platformAuditEntry.findMany({
            where: { createdAt: { gte: sinceDate } },
            orderBy: { createdAt: 'desc' },
            take: 250,
            select: {
              id: true,
              action: true,
              createdAt: true,
              actorUserId: true,
              companyId: true,
              subjectId: true,
              actor: { select: { email: true, displayName: true } },
              company: { select: { name: true } },
            },
          }),
          tx.auditEntry.findMany({
            where: { recordedAt: { gte: sinceDate } },
            orderBy: { recordedAt: 'desc' },
            take: 250,
            select: {
              id: true,
              companyId: true,
              membershipId: true,
              action: true,
              details: true,
              subjectId: true,
              recordedAt: true,
              membership: {
                select: {
                  role: true,
                  company: { select: { name: true } },
                  user: { select: { id: true, email: true, displayName: true } },
                },
              },
            },
          }),
        ]);
        return [pRows, aRows] as const;
      },
    );

    const dbPlatformEvents: PlatformLogEvent[] = platformRows.map((row) => ({
      id: `pa-${row.id}`,
      timestamp: row.createdAt.toISOString(),
      source: 'backend',
      level: inferLevelFromAction(row.action),
      event: row.action,
      message: formatHumanAction(row.action, null, row.company.name),
      userId: row.actorUserId,
      userEmail: row.actor.email,
      userName: row.actor.displayName,
      companyId: row.companyId,
      companyName: row.company.name,
      screen: 'admin/platform',
      details: {
        subjectId: row.subjectId,
        companyId: row.companyId,
        table: 'platform_audit_log',
      },
    }));

    const dbAuditEvents: PlatformLogEvent[] = companyRows.map((row) => {
      const detailsObj =
        row.details && typeof row.details === 'object' && !Array.isArray(row.details)
          ? (row.details as Record<string, unknown>)
          : null;
      return {
        id: `ae-${row.id.toString()}`,
        timestamp: row.recordedAt.toISOString(),
        source: 'backend',
        level: inferLevelFromAction(row.action),
        event: row.action,
        message: formatHumanAction(row.action, detailsObj, row.membership.company.name),
        userId: row.membership.user.id,
        userEmail: row.membership.user.email,
        userName: row.membership.user.displayName,
        companyId: row.companyId,
        companyName: row.membership.company.name,
        screen: row.membership.role,
        details: {
          ...(detailsObj ?? {}),
          subjectId: row.subjectId,
          membershipId: row.membershipId,
          table: 'audit_log',
        },
      };
    });

    return [...dbPlatformEvents, ...dbAuditEvents, ...fileEntries].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  private aggregateUsers(events: PlatformLogEvent[]): PlatformLogUserSummary[] {
    const map = new Map<string, PlatformLogUserSummary>();

    for (const ev of events) {
      const key = ev.userId || ev.userEmail || 'system';
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          userId: key,
          email: ev.userEmail ?? (key === 'system' ? 'Sistema' : null),
          displayName: ev.userName ?? (key === 'system' ? 'Procesos del Sistema' : null),
          companyId: ev.companyId,
          companyName: ev.companyName,
          totalEvents: 1,
          errorCount: ev.level === 'error' ? 1 : 0,
          lastActivityAt: ev.timestamp,
        });
      } else {
        existing.totalEvents += 1;
        if (ev.level === 'error') existing.errorCount += 1;
        if (!existing.email && ev.userEmail) existing.email = ev.userEmail;
        if (!existing.displayName && ev.userName) existing.displayName = ev.userName;
        if (!existing.companyName && ev.companyName) existing.companyName = ev.companyName;
        if (new Date(ev.timestamp).getTime() > new Date(existing.lastActivityAt).getTime()) {
          existing.lastActivityAt = ev.timestamp;
        }
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.errorCount - a.errorCount || b.totalEvents - a.totalEvents,
    );
  }

  async getSummary(principal: PlatformPrincipal, hours = 168) {
    const events = await this.collectUnifiedEvents(principal, { hours });

    const totals = {
      backend: 0,
      frontend: 0,
      mobile: 0,
      errors: 0,
      total: events.length,
    };

    const dayMap = new Map<
      string,
      { date: string; backend: number; frontend: number; mobile: number; errors: number }
    >();

    for (const ev of events) {
      totals[ev.source] += 1;
      if (ev.level === 'error') totals.errors += 1;

      const day = ev.timestamp.slice(0, 10);
      const bucket = dayMap.get(day) ?? {
        date: day,
        backend: 0,
        frontend: 0,
        mobile: 0,
        errors: 0,
      };
      bucket[ev.source] += 1;
      if (ev.level === 'error') bucket.errors += 1;
      dayMap.set(day, bucket);
    }

    const byDay = Array.from(dayMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14);

    const topUsers = this.aggregateUsers(events).slice(0, 8);

    return { totals, byDay, topUsers };
  }

  async getUsers(principal: PlatformPrincipal, query: PlatformLogUsersQuery) {
    const events = await this.collectUnifiedEvents(principal, {
      hours: query.hours ?? 168,
    });

    let users = this.aggregateUsers(events);
    if (query.companyId) {
      users = users.filter((u) => u.companyId === query.companyId);
    }
    if (query.search && query.search.trim()) {
      const term = query.search.trim().toLowerCase();
      users = users.filter(
        (u) =>
          (u.email && u.email.toLowerCase().includes(term)) ||
          (u.displayName && u.displayName.toLowerCase().includes(term)) ||
          (u.companyName && u.companyName.toLowerCase().includes(term)),
      );
    }

    return users;
  }

  async getEvents(principal: PlatformPrincipal, query: PlatformLogEventsQuery) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;

    let events = await this.collectUnifiedEvents(principal, {
      hours: query.hours ?? 168,
      source: query.source,
    });

    if (query.level) {
      events = events.filter((e) => e.level === query.level);
    }
    if (query.companyId) {
      events = events.filter((e) => e.companyId === query.companyId);
    }
    if (query.userId) {
      events = events.filter(
        (e) =>
          e.userId === query.userId ||
          e.userEmail === query.userId ||
          (query.userId === 'system' && !e.userId && !e.userEmail),
      );
    }
    if (query.search && query.search.trim()) {
      const term = query.search.trim().toLowerCase();
      events = events.filter(
        (e) =>
          e.message.toLowerCase().includes(term) ||
          e.event.toLowerCase().includes(term) ||
          (e.userEmail && e.userEmail.toLowerCase().includes(term)) ||
          (e.companyName && e.companyName.toLowerCase().includes(term)) ||
          (e.screen && e.screen.toLowerCase().includes(term)),
      );
    }

    const total = events.length;
    const start = (page - 1) * pageSize;
    const items = events.slice(start, start + pageSize);

    return pageResult(items, total, { page, pageSize });
  }

  async getFiles(principal: PlatformPrincipal, query: PlatformLogFilesQuery) {
    await this.prisma.readTransaction((tx) => this.access.requireOwner(tx, principal));
    return listSourceLogFiles(query.source);
  }

  async getFileContent(principal: PlatformPrincipal, source: LogSource, filename: string) {
    await this.prisma.readTransaction((tx) => this.access.requireOwner(tx, principal));
    const file = readSourceLogFile(source, filename);
    if (!file) {
      throw new NotFoundException('Archivo de log no encontrado.');
    }
    return file;
  }
}
