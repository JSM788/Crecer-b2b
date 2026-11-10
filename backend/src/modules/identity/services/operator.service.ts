import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { reject } from '../../../common/errors/application-error';
import { CredentialsService } from './credentials.service';
import { MembershipRole } from '../../../common/types/principal';

@Injectable()
export class OperatorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credentials: CredentialsService,
  ) {}

  async provision(
    slug: string,
    name: string,
    email: string,
    password: string,
    timeZone = 'UTC',
    role: MembershipRole = 'commercial',
  ) {
    try {
      new Intl.DateTimeFormat('en', { timeZone });
    } catch {
      reject('invalid_time_zone');
    }
    const passwordHash = await this.credentials.hashPassword(password);
    return this.prisma.transaction(async (tx) => {
      let user = await tx.user.findUnique({ where: { email } });
      if (
        user &&
        !(await this.credentials.matchesPassword(password, user.passwordHash))
      )
        reject('existing_identity_password_mismatch');
      if (!user) user = await tx.user.create({ data: { email, passwordHash } });
      const company = await tx.company.create({
        data: { slug, name, timeZone },
      });
      const member = await tx.membership.create({
        data: {
          companyId: company.id,
          userId: user.id,
          role,
          canManageCustomers: role === 'manager',
          canManageFieldOperations: role === 'manager',
        },
      });
      return {
        companyId: company.id,
        membershipId: member.id,
        userId: user.id,
      };
    });
  }

  async grantCustomerManagement(
    companyId: string,
    membershipId: string,
  ): Promise<void> {
    const result = await this.prisma.membership.updateMany({
      where: { companyId, id: membershipId, active: true },
      data: { canManageCustomers: true },
    });
    if (result.count !== 1)
      throw new Error('Active company membership not found');
  }

  async grantPlatformOwnership(email: string): Promise<void> {
    const result = await this.prisma.user.updateMany({
      where: {
        email: email.toLowerCase(),
        memberships: { some: { active: true } },
      },
      data: { isPlatformOwner: true },
    });
    if (result.count !== 1)
      throw new Error('Existing account with an active membership not found');
  }

  async grantFieldManagement(
    companyId: string,
    membershipId: string,
  ): Promise<void> {
    const result = await this.prisma.membership.updateMany({
      where: { companyId, id: membershipId, active: true },
      data: { canManageFieldOperations: true },
    });
    if (result.count !== 1)
      throw new Error('Active company membership not found');
  }

  async addMember(
    companyId: string,
    email: string,
    password: string,
    role: MembershipRole,
  ) {
    const passwordHash = await this.credentials.hashPassword(password);
    return this.prisma.transaction(async (tx) => {
      if (!(await tx.company.findUnique({ where: { id: companyId } })))
        throw new Error('Company not found');
      let user = await tx.user.findUnique({ where: { email } });
      if (
        user &&
        !(await this.credentials.matchesPassword(password, user.passwordHash))
      )
        reject('existing_identity_password_mismatch');
      if (!user) user = await tx.user.create({ data: { email, passwordHash } });
      const existing = await tx.membership.findUnique({
        where: { companyId_userId: { companyId, userId: user.id } },
      });
      if (existing && (!existing.active || existing.role !== role))
        throw new Error(
          'Existing membership role or active status does not match',
        );
      const member =
        existing ??
        (await tx.membership.create({
          data: {
            companyId,
            userId: user.id,
            role,
            canManageCustomers: role === 'manager',
            canManageFieldOperations: role === 'manager',
          },
        }));
      return {
        companyId,
        membershipId: member.id,
        userId: user.id,
        role: member.role,
      };
    });
  }

  async assignVisit(input: {
    companyId: string;
    membershipId: string;
    customerName: string;
    customerAddress: string;
    scheduledAt: string;
  }) {
    return this.prisma.transaction(async (tx) => {
      const member = await tx.membership.updateMany({
        where: {
          companyId: input.companyId,
          id: input.membershipId,
          active: true,
          role: { in: ['commercial', 'merchandiser'] },
        },
        data: { transitionVersion: { increment: 1 } },
      });
      if (member.count !== 1)
        throw new Error('Active company membership not found');
      const customer = await tx.customer.create({
        data: {
          companyId: input.companyId,
          name: input.customerName,
          address: input.customerAddress,
        },
      });
      await tx.customerAssignment.create({
        data: {
          companyId: input.companyId,
          customerId: customer.id,
          membershipId: input.membershipId,
        },
      });
      const visit = await tx.visit.create({
        data: {
          companyId: input.companyId,
          membershipId: input.membershipId,
          customerId: customer.id,
          scheduledAt: new Date(input.scheduledAt),
        },
      });
      return { customerId: customer.id, visitId: visit.id };
    });
  }
}
