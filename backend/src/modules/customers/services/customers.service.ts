import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService, Transaction } from '../../../database/prisma.service';
import { Principal } from '../../../common/types/principal';
import { reject, rejectField } from '../../../common/errors/application-error';
import {
  AssignCustomersDto,
  CreateCustomerDto,
  ImportCustomersDto,
  managedCustomerResponseSchema,
  CustomerFilters,
  customerFiltersSchema,
} from '../dto/customer.dto';
import { pageResult } from '../../../common/pagination';

const includeAssignments = {
  assignments: {
    include: { membership: { include: { user: { select: { email: true, displayName: true } } } } },
    orderBy: { membershipId: 'asc' as const },
  },
};
type CustomerWithAssignments = Prisma.CustomerGetPayload<{
  include: typeof includeAssignments;
}>;

function customerResponse(customer: CustomerWithAssignments) {
  return managedCustomerResponseSchema.parse({
    id: customer.id,
    name: customer.name,
    address: customer.address,
    ruc: customer.ruc,
    district: customer.district,
    zone: customer.zone,
    latitude: customer.latitude,
    longitude: customer.longitude,
    condition: null,
    lastPurchaseDate: null,
    assignments: customer.assignments.map((assignment) => ({
      membershipId: assignment.membershipId,
      email: assignment.membership.user.email,
      displayName: assignment.membership.user.displayName,
      role: assignment.membership.role,
    })),
  });
}

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  assigned(principal: Principal, filters: CustomerFilters = customerFiltersSchema.parse({})) {
    return this.prisma.transaction(async (tx) => {
      const where: Prisma.CustomerWhereInput = {
        AND: [this.customerWhere(principal, filters), { assignments: {
          some: {
            membershipId: principal.membershipId,
            companyId: principal.companyId,
          },
        } }],
      };
      const total = await tx.customer.count({ where });
      const items = await tx.customer.findMany({
      where,
      select: { id: true, name: true, address: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    });
      return pageResult(items, total, filters);
    });
  }

  private authorize(principal: Principal): void {
    if (!principal.permissions?.includes('manage_customers'))
      reject('customer_management_forbidden');
  }

  private async lockManager(
    tx: Transaction,
    principal: Principal,
  ): Promise<void> {
    const member = await tx.membership.updateMany({
      where: {
        id: principal.membershipId,
        companyId: principal.companyId,
        active: true,
        OR: [{ canManageCustomers: true }, { user: { isPlatformOwner: true } }],
      },
      data: { transitionVersion: { increment: 1 } },
    });
    const session = await tx.session.findFirst({
      where: {
        tokenHash: principal.tokenHash,
        companyId: principal.companyId,
        membershipId: principal.membershipId,
        expiresAt: { gt: new Date() },
      },
    });
    if (member.count !== 1 || !session) reject('customer_management_forbidden');
  }

  private customerWhere(principal: Principal, filters: CustomerFilters): Prisma.CustomerWhereInput {
    const assignment = {
      companyId: principal.companyId,
      ...(filters.membershipId ? { membershipId: filters.membershipId } : {}),
      ...(filters.role ? { membership: { role: filters.role } } : {}),
    };
    return {
      companyId: principal.companyId,
      ...(filters.search ? { OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { ruc: { contains: filters.search } },
        { address: { contains: filters.search, mode: 'insensitive' } },
      ] } : {}),
      ...(filters.district ? { district: { equals: filters.district, mode: 'insensitive' } } : {}),
      ...(filters.zone ? { zone: { equals: filters.zone, mode: 'insensitive' } } : {}),
      ...(filters.assignment === 'unassigned' ? { assignments: { none: assignment } }
        : filters.assignment === 'assigned' || filters.membershipId || filters.role
          ? { assignments: { some: assignment } } : {}),
    };
  }

  async list(principal: Principal, filters: CustomerFilters = customerFiltersSchema.parse({})) {
    this.authorize(principal);
    return this.prisma.transaction(async (tx) => {
    const where = this.customerWhere(principal, filters);
    const total = await tx.customer.count({ where });
    const customers = await tx.customer.findMany({
      where,
      include: includeAssignments,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    });
    return pageResult(customers.map(customerResponse), total, filters);
    });
  }

  async assignees(principal: Principal, filters: CustomerFilters = customerFiltersSchema.parse({})) {
    this.authorize(principal);
    return this.prisma.transaction(async (tx) => {
      const where: Prisma.MembershipWhereInput = {
        companyId: principal.companyId,
        active: true,
        role: filters.role ?? { in: ['commercial', 'merchandiser'] },
        ...(filters.search ? { user: { OR: [
          { email: { contains: filters.search, mode: 'insensitive' } },
          { displayName: { contains: filters.search, mode: 'insensitive' } },
        ] } } : {}),
      };
    const total = await tx.membership.count({ where });
    const members = await tx.membership.findMany({
      where,
      include: { user: { select: { email: true, displayName: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    });
    return pageResult(members.map((member) => ({
      id: member.id,
      email: member.user.email,
      displayName: member.user.displayName,
      role: member.role,
    })), total, filters);
    });
  }

  private async assignee(tx: Transaction, principal: Principal, id: string, field: string) {
    const count = await tx.membership.updateMany({
      where: {
        id,
        companyId: principal.companyId,
        active: true,
        role: { in: ['commercial', 'merchandiser'] },
      },
      data: { transitionVersion: { increment: 1 } },
    });
    if (count.count !== 1) rejectField('customer_assignee_not_found', [field]);
    const member = await tx.membership.findFirst({
      where: { id, companyId: principal.companyId, active: true },
    });
    if (!member) rejectField('customer_assignee_not_found', [field]);
    return member;
  }

  async create(principal: Principal, input: CreateCustomerDto) {
    this.authorize(principal);
    return this.prisma.transaction(async (tx) => {
      await this.lockManager(tx, principal);
      if (
        input.commercialMembershipId &&
        (await this.assignee(tx, principal, input.commercialMembershipId, 'commercialMembershipId'))
          .role !== 'commercial'
      )
        rejectField('customer_assignee_not_found', ['commercialMembershipId']);
      if (
        input.merchandiserMembershipId &&
        (await this.assignee(tx, principal, input.merchandiserMembershipId, 'merchandiserMembershipId'))
          .role !== 'merchandiser'
      )
        rejectField('customer_assignee_not_found', ['merchandiserMembershipId']);
      const customer = await tx.customer.create({
        data: {
          companyId: principal.companyId,
          name: input.name,
          address: input.address,
          ruc: input.ruc,
          district: input.district,
          zone: input.zone || null,
          latitude: input.latitude ?? null,
          longitude: input.longitude ?? null,
        },
      });
      if (input.commercialMembershipId) {
        await tx.customerAssignment.create({
          data: {
            companyId: principal.companyId,
            customerId: customer.id,
            membershipId: input.commercialMembershipId,
          },
        });
      }
      if (input.merchandiserMembershipId) {
        await tx.customerAssignment.create({
          data: {
            companyId: principal.companyId,
            customerId: customer.id,
            membershipId: input.merchandiserMembershipId,
          },
        });
      }
      await this.audit(tx, principal, 'customer_created', customer.id);
      const saved = await tx.customer.findUniqueOrThrow({
        where: { id: customer.id },
        include: includeAssignments,
      });
      return customerResponse(saved);
    });
  }

  async importCustomers(
    principal: Principal,
    input: ImportCustomersDto,
  ): Promise<{ imported: number; skipped: number }> {
    this.authorize(principal);
    return this.prisma.transaction(async (tx) => {
      await this.lockManager(tx, principal);
      const uniqueItems = new Map<string, ImportCustomersDto['items'][number]>();
      let skipped = 0;
      for (const item of input.items) {
        if (uniqueItems.has(item.ruc)) {
          skipped++;
        } else {
          uniqueItems.set(item.ruc, item);
        }
      }
      const existing = await tx.customer.findMany({
        where: {
          companyId: principal.companyId,
          ruc: { in: Array.from(uniqueItems.keys()) },
        },
        select: { ruc: true },
      });
      const existingRucs = new Set(existing.map((c) => c.ruc).filter(Boolean));
      let imported = 0;
      for (const [ruc, item] of uniqueItems.entries()) {
        if (existingRucs.has(ruc)) {
          skipped++;
          continue;
        }
        const customer = await tx.customer.create({
          data: {
            companyId: principal.companyId,
            name: item.name,
            address: item.address,
            ruc: item.ruc,
            district: item.district,
            zone: item.zone || null,
            latitude: item.latitude ?? null,
            longitude: item.longitude ?? null,
          },
        });
        await this.audit(tx, principal, 'customer_created', customer.id);
        imported++;
      }
      return { imported, skipped };
    });
  }

  async assign(
    principal: Principal,
    input: AssignCustomersDto,
  ): Promise<{ updated: number }> {
    this.authorize(principal);
    return this.prisma.transaction(async (tx) => {
      await this.lockManager(tx, principal);
      const target = await this.assignee(tx, principal, input.membershipId, 'membershipId');
      const customers = await tx.customer.updateMany({
        where: {
          companyId: principal.companyId,
          id: { in: input.customerIds },
        },
        data: { assignmentVersion: { increment: 1 } },
      });
      if (customers.count !== input.customerIds.length)
        rejectField('customer_not_found', ['customerIds']);
      await tx.customerAssignment.deleteMany({
        where: {
          companyId: principal.companyId,
          customerId: { in: input.customerIds },
          membership: { role: target.role },
        },
      });
      await tx.customerAssignment.createMany({
        data: input.customerIds.map((customerId) => ({
          companyId: principal.companyId,
          customerId,
          membershipId: target.id,
        })),
      });
      for (const customerId of input.customerIds)
        await this.audit(tx, principal, 'customer_assigned', customerId);
      return { updated: customers.count };
    });
  }

  private async audit(
    tx: Transaction,
    principal: Principal,
    action: string,
    subjectId: string,
  ) {
    await tx.auditEntry.create({
      data: {
        companyId: principal.companyId,
        membershipId: principal.membershipId,
        action,
        subjectId,
      },
    });
  }
}
