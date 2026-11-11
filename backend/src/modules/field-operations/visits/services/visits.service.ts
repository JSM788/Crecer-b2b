import { Injectable } from '@nestjs/common';
import { storage } from '../../../../common/storage.service';
import { PrismaService } from '../../../../database/prisma.service';
import { Principal } from '../../../../common/types/principal';
import { businessDate, databaseDate } from '../../../../common/business-date';
import { reject } from '../../../../common/errors/application-error';
import { FieldCommandsService } from '../../services/field-commands.service';
import {
  CloseVisitDto,
  ScheduleVisitDto,
  visitResponse,
} from '../dto/visit.dto';

@Injectable()
export class VisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly commands: FieldCommandsService,
  ) {}

  schedule(principal: Principal, key: string, input: ScheduleVisitDto) {
    if (principal.role !== 'commercial' && principal.role !== 'merchandiser') reject('planning_forbidden');
    return this.commands.execute(
      principal,
      key,
      'schedule_visit',
      input,
      async (tx) => {
        const where = {
          companyId: principal.companyId,
          membershipId: principal.membershipId,
        };
        const assigned = await tx.customerAssignment.findUnique({
          where: {
            companyId_customerId_membershipId: {
              ...where,
              customerId: input.customerId,
            },
          },
        });
        if (!assigned) {
          const customer = await tx.customer.findFirst({
            where: { companyId: principal.companyId, id: input.customerId },
          });
          if (!customer) reject('customer_not_assigned');
          await tx.customerAssignment.create({
            data: {
              ...where,
              customerId: input.customerId,
            },
          });
        }
        const scheduledAt = new Date(input.scheduledAt);
        const date = databaseDate(
          businessDate(scheduledAt, principal.timeZone),
        );
        const activeWorkday = await tx.workday.findFirst({
          where: { ...where, status: 'active' },
        });

        if (!activeWorkday) {
          const completedDay = await tx.workday.findFirst({
            where: { ...where, businessDate: date, status: 'completed' },
          });
          if (completedDay) reject('workday_already_started');
        }

        let finalScheduledAt = scheduledAt;
        const collision = await tx.visit.findFirst({
          where: { ...where, scheduledAt: finalScheduledAt, status: { not: 'cancelled' } },
        });
        if (collision) {
          finalScheduledAt = new Date(scheduledAt.getTime() + 60000);
        }

        const created = await tx.visit.create({
          data: {
            ...where,
            customerId: input.customerId,
            scheduledAt: finalScheduledAt,
            plannedRole: principal.role,
            workdayId: activeWorkday?.id ?? null,
          },
        });

        return visitResponse(created);
      },
    );
  }

  checkIn(principal: Principal, key: string, id: string) {
    return this.commands.execute(principal, key, 'check_in', id, async (tx) => {
      const where = {
        companyId: principal.companyId,
        membershipId: principal.membershipId,
      };
      const visit = await tx.visit.findFirst({ where: { ...where, id } });
      if (!visit) reject('visit_not_found');
      const day = await tx.workday.findFirst({
        where: { ...where, status: 'active' },
      });
      if (!day) reject('active_workday_required');

      const nowLimaHour = Number(
        new Intl.DateTimeFormat('en-CA', {
          timeZone: principal.timeZone,
          hour: '2-digit',
          hour12: false,
        }).format(new Date()),
      );
      if (nowLimaHour >= 19) {
        reject('digital_disconnection_active');
      }

      if (visit.status !== 'pending') reject('visit_not_pending');
      if (
        businessDate(visit.scheduledAt, principal.timeZone) >
        day.businessDate.toISOString().slice(0, 10)
      )
        reject('visit_scheduled_in_future');
      if (await tx.visit.findFirst({ where: { ...where, status: 'active' } }))
        reject('another_visit_active');
      return visitResponse(
        await tx.visit.update({
          where: { id: visit.id },
          data: { status: 'active', workdayId: day.id, arrivedAt: new Date(),
            executionRole: day.role ?? principal.role, version: { increment: 1 } },
        }),
      );
    });
  }

  close(principal: Principal, key: string, id: string, input: CloseVisitDto) {
    return this.commands.execute(
      principal,
      key,
      'close_visit',
      [id, input],
      async (tx) => {
        const where = {
          companyId: principal.companyId,
          membershipId: principal.membershipId,
        };
        const visit = await tx.visit.findFirst({ where: { ...where, id } });
        if (!visit) reject('visit_not_found');
        if (
          !(await tx.workday.findFirst({
            where: { ...where, status: 'active' },
          }))
        )
          reject('active_workday_required');
        if (visit.status !== 'active') reject('visit_not_active');
        const auditedVisit =
          visit.executionRole === 'merchandiser' && input.result === 'attended';
        if (input.audit && !auditedVisit) reject('audit_not_allowed');
        if (auditedVisit && !input.audit) reject('audit_required');
        if (auditedVisit && !input.attachment) reject('audit_photo_required');
        const completed = await tx.visit.update({
          where: { id: visit.id },
          data: {
            status: 'completed',
            version: { increment: 1 },
            endedAt: new Date(),
            result: input.result,
            observations: input.observations,
            ...(input.audit ? { audit: input.audit } : {}),
          },
        });
        if (input.attachment) {
          // Subida EXCLUSIVA a Cloudflare R2 (cero Base64 en base de datos)
          const r2Url = await storage.uploadBase64(input.attachment.base64, input.attachment.mimeType, 'visits');
          if (!r2Url) {
            reject('storage_upload_failed');
          }

          await tx.visitEvidence.create({
            data: {
              ...where,
              visitId: id,
              mimeType: input.attachment.mimeType,
              content: Buffer.from(r2Url, 'utf-8'),
            },
          });
        }
        return visitResponse(completed);
      },
    );
  }

  async evidence(principal: Principal, id: string) {
    const visit = await this.prisma.visit.findFirst({
      where: {
        companyId: principal.companyId,
        membershipId: principal.membershipId,
        id,
      },
      include: { evidence: true },
    });
    if (!visit) reject('visit_not_found');
    const evidence = visit.evidence[0];
    if (!evidence) return null;
    const url = Buffer.from(evidence.content).toString('utf-8');
    return {
      mimeType: evidence.mimeType,
      base64: url,
    };
  }
}
