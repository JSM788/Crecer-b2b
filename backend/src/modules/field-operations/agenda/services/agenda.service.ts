import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../database/prisma.service';
import { Principal } from '../../../../common/types/principal';
import { visitResponse } from '../../visits/dto/visit.dto';
import { Prisma } from '../../../../generated/prisma/client';
import { pageResult } from '../../../../common/pagination';
import { FieldFilters, fieldFiltersSchema } from '../../management/dto/field-management.dto';
import { businessDateWindow } from '../../management/services/business-date-window';
import { databaseDate } from '../../../../common/business-date';

@Injectable()
export class AgendaService {
  constructor(private readonly prisma: PrismaService) {}
  async list(principal: Principal, filters: FieldFilters = fieldFiltersSchema.parse({})) {
    return this.prisma.transaction(async (tx) => {
      const where: Prisma.VisitWhereInput = {
        companyId: principal.companyId,
        membershipId: principal.membershipId,
        ...(filters.date ? { scheduledAt: businessDateWindow(filters.date, principal.timeZone) } : {}),
        ...(filters.workdayDate ? { workday: { businessDate: databaseDate(filters.workdayDate) } } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.search ? { customer: { name: { contains: filters.search, mode: 'insensitive' } } } : {}),
      };
    const total = await tx.visit.count({ where });
    const visits = await tx.visit.findMany({
      where,
      orderBy: [{ scheduledAt: 'asc' }, { id: 'asc' }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      include: { customer: true, evidence: { select: { visitId: true } } },
    });
    return pageResult(visits.map((visit) => ({
      ...visitResponse(visit),
      customer_name: visit.customer.name,
      customer_address: visit.customer.address,
      customer_ruc: visit.customer.ruc,
      customer_district: visit.customer.district,
      customer_latitude: visit.customer.latitude,
      customer_longitude: visit.customer.longitude,
      has_evidence: visit.evidence.length > 0,
    })), total, filters);
    });
  }
}
