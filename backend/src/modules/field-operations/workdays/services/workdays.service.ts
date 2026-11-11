import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { Principal } from '../../../../common/types/principal';
import { businessDate, databaseDate } from '../../../../common/business-date';
import { reject } from '../../../../common/errors/application-error';
import { FieldCommandsService } from '../../services/field-commands.service';
import { EndWorkdayDto, workdayResponse } from '../dto/workday.dto';
import { businessDateWindow } from '../../management/services/business-date-window';
import { pageResult, PaginationQuery, paginationQuerySchema } from '../../../../common/pagination';
import { workdayStatistics } from './workday-statistics';

@Injectable()
export class WorkdaysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commands: FieldCommandsService,
  ) {}

  async current(principal: Principal) {
    return this.prisma.transaction(async (tx) => {
    const day = await tx.workday.findFirst({
      where: {
        companyId: principal.companyId,
        membershipId: principal.membershipId,
      },
      orderBy: [{ startedAt: 'desc' }, { id: 'desc' }],
    });
    if (!day) return null;
    const statistics = await workdayStatistics(tx, [day.id]);
    return workdayResponse(day, statistics.get(day.id)!);
    });
  }

  async list(principal: Principal, filters: PaginationQuery = paginationQuerySchema.parse({})) {
    return this.prisma.transaction(async (tx) => {
      const where = {
        companyId: principal.companyId,
        membershipId: principal.membershipId,
      };
    const total = await tx.workday.count({ where });
    const days = await tx.workday.findMany({
      where,
      orderBy: [{ businessDate: 'desc' }, { id: 'desc' }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    });
    const statistics = await workdayStatistics(tx, days.map((day) => day.id));
    return pageResult(days.map((day) => workdayResponse(day, statistics.get(day.id)!)), total, filters);
    });
  }

  start(principal: Principal, key: string) {
    return this.commands.execute(
      principal,
      key,
      'start_workday',
      null,
      async (tx) => {
        const where = {
          companyId: principal.companyId,
          membershipId: principal.membershipId,
        };
        if (
          await tx.workday.findFirst({ where: { ...where, status: 'active' } })
        )
          reject('workday_already_started');
        const date = databaseDate(businessDate(new Date(), principal.timeZone));
        const day = await tx.workday.create({
          data: { ...where, businessDate: date, role: principal.role },
        });
        // Freeze all due planning into this workday before any visit is checked in.
        const window = businessDateWindow(date.toISOString().slice(0, 10), principal.timeZone);
        await tx.visit.updateMany({ where: {
          ...where, status: 'pending', scheduledAt: { lt: window.lt },
        }, data: { workdayId: day.id } });
        const statistics = await workdayStatistics(tx, [day.id]);
        return workdayResponse(day, statistics.get(day.id)!);
      },
    );
  }

  end(principal: Principal, key: string, input: EndWorkdayDto = {}) {
    return this.commands.execute(
      principal,
      key,
      'end_workday',
      input,
      async (tx) => {
        const where = {
          companyId: principal.companyId,
          membershipId: principal.membershipId,
        };
        const day = await tx.workday.findFirst({
          where: { ...where, status: 'active' },
        });
        if (!day) reject('active_workday_required');
        const date = day.businessDate.toISOString().slice(0, 10);
        const window = businessDateWindow(date, principal.timeZone);
        const pending = await tx.visit.findMany({
          where: { ...where, status: { in: ['pending', 'active'] }, scheduledAt: { lt: window.lt } },
          select: { id: true },
        });
        if (pending.length > 0) {
          if (!input.justification) {
            reject('visits_remaining');
          }
          await tx.visit.updateMany({
            where: { id: { in: pending.map((p) => p.id) } },
            data: {
              status: 'cancelled',
              cancellationReason: input.justification,
            },
          });
        }
        const updated = await tx.workday.update({
          where: { id: day.id },
          data: { status: 'completed', endedAt: new Date() },
        });
        const statistics = await workdayStatistics(tx, [day.id]);
        return workdayResponse(updated, statistics.get(day.id)!);
      },
    );
  }
}
