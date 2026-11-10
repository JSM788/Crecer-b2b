import { InvitationsService } from "../../invitations/invitations.service";
import { MailService } from "../../mail/mail.service";
import { pageResult } from "../../../common/pagination";
import type { PaginationQuery } from "../../../common/pagination";
import { recordAccessEvent } from '../../identity/services/access-events';
import { revokeAccessLinks } from '../../identity/services/revoke-access-links';
import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { PrismaService, Transaction } from "../../../database/prisma.service";
import { PlatformPrincipal } from "../../../common/types/principal";
import { TenantResolver } from "../../../common/guards/tenant-routing.module";
import { reject, rejectField, isUniqueConstraint } from "../../../common/errors/application-error";
import { CredentialsService } from "../../identity/services/credentials.service";
import {
  CompanyInput,
  CompanyEditInput,
  CompanyListQuery,
  MemberListQuery,
  MemberInput,
  MemberEditInput,
  companyResponseSchema,
} from "../dto/platform.dto";
import { PlatformAccessService } from "./platform-access.service";
import { PlatformCommandsService } from "./platform-commands.service";
import { memberResponse, memberUserSelection, memberInvitationSelection } from "./member-response";
import { Prisma } from "../../../generated/prisma/client";

const companySelection = {
  id: true,
  name: true,
  slug: true,
  status: true,
  suspendedAt: true,
  timeZone: true,
  domains: { select: { hostname: true } },
  memberships: {
    where: { role: 'manager' },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    take: 1,
    select: {
      id: true,
      userId: true,
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          phone: true,
        },
      },
    },
  },
  _count: { select: { memberships: true } },
} satisfies Prisma.CompanySelect;
type CompanyRecord = Prisma.CompanyGetPayload<{
  select: typeof companySelection;
}>;

@Injectable()
export class PlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: PlatformAccessService,
    private readonly commands: PlatformCommandsService,
    private readonly tenants: TenantResolver,
    private readonly credentials: CredentialsService,
    private readonly invitations: InvitationsService,
    private readonly mail: MailService,
  ) {}

  private companyResponse(company: CompanyRecord, activeUserCount: number) {
    return companyResponseSchema.parse({
      id: company.id,
      name: company.name,
      slug: company.slug,
      status: company.status,
      suspendedAt: company.suspendedAt?.toISOString() ?? null,
      timeZone: company.timeZone,
      managerEmail: company.memberships[0]?.user.email ?? null,
      manager: company.memberships[0]
        ? {
            id: company.memberships[0].id,
            userId: company.memberships[0].user.id,
            displayName: company.memberships[0].user.displayName,
            email: company.memberships[0].user.email,
            phone: company.memberships[0].user.phone,
          }
        : null,
      hostnames: [
        ...new Set([
          ...company.domains.map((domain) => domain.hostname),
          ...this.tenants
            .configured()
            .filter((entry) => entry.company === company.slug)
            .map((entry) => entry.host),
        ]),
      ].sort(),
      activeUserCount,
      totalUserCount: company._count.memberships,
    });
  }

  private async requireCompany(tx: Transaction, companyId: string) {
    if (
      !(await tx.company.findUnique({
        where: { id: companyId },
        select: { id: true },
      }))
    )
      reject("platform_company_not_found");
  }

  companies(principal: PlatformPrincipal, query: CompanyListQuery) {
    return this.prisma.transaction(async (tx) => {
      await this.access.requireOwner(tx, principal);
      const where: Prisma.CompanyWhereInput = {
        ...(query.status ? { status: query.status } : {}),
        ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { slug: { contains: query.search, mode: 'insensitive' } }, { domains: { some: { hostname: { contains: query.search, mode: 'insensitive' } } } }, { memberships: { some: { role: 'manager', user: { email: { contains: query.search, mode: 'insensitive' } } } } }] } : {}),
      };
      const [companies, total] = await Promise.all([
        tx.company.findMany({ where, select: companySelection, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
        tx.company.count({ where }),
      ]);
      const activeCounts = await tx.membership.groupBy({ by: ['companyId'], where: { active: true, companyId: { in: companies.map((company) => company.id) } }, _count: { _all: true } });
      const counts = new Map(activeCounts.map((count) => [count.companyId, count._count._all]));
      return pageResult(companies.map((company) => this.companyResponse(company, company.status === 'active' ? (counts.get(company.id) ?? 0) : 0)), total, query);
    });
  }

  companyStatus(
    principal: PlatformPrincipal,
    key: string,
    companyId: string,
    status: "active" | "suspended",
  ) {
    return this.commands.execute(
      principal,
      key,
      "platform_company_status",
      { companyId, status },
      async (tx) => {
        const company = await tx.company.findUnique({
          where: { id: companyId },
          select: companySelection,
        });
        if (!company) reject("platform_company_not_found");
        if (company.status !== status) {
          await tx.company.update({
            where: { id: companyId },
            data: {
              status,
              suspendedAt: status === "suspended" ? new Date() : null,
            },
          });
          if (status === "suspended")
            await tx.session.deleteMany({ where: { companyId } });
        }
        const current = await tx.company.findUniqueOrThrow({
          where: { id: companyId },
          select: companySelection,
        });
        const activeUserCount =
          status === "active"
            ? await tx.membership.count({ where: { companyId, active: true } })
            : 0;
        return {
          companyId,
          response: this.companyResponse(current, activeUserCount),
        };
      },
    );
  }

  async editCompany(
    principal: PlatformPrincipal,
    key: string,
    companyId: string,
    input: CompanyEditInput,
  ) {
    await this.prisma.transaction((tx) =>
      this.access.requireOwner(tx, principal),
    );
    return this.commands.execute(
      principal,
      key,
      "platform_edit_company",
      { companyId, ...input },
      async (tx) => {
        const existing = await tx.company.findUnique({
          where: { id: companyId },
          include: { domains: true },
        });
        if (!existing) reject("platform_company_not_found");

        if (input.hostname) {
          const currentHostname = existing.domains[0]?.hostname;
          if (currentHostname !== input.hostname) {
            if (
              this.tenants.isReserved(input.hostname) ||
              (await tx.companyDomain.findUnique({
                where: { hostname: input.hostname },
              }))
            ) {
              rejectField("platform_hostname_exists", ["hostname"]);
            }
            if (currentHostname) {
              await tx.companyDomain.delete({ where: { hostname: currentHostname } });
            }
            await tx.companyDomain.create({
              data: {
                companyId,
                hostname: input.hostname,
              },
            });
          }
        }

        await tx.company.update({
          where: { id: companyId },
          data: {
            name: input.name,
            timeZone: input.timeZone,
          },
        });

        if (input.manager) {
          const managerMembership = await tx.membership.findFirst({
            where: { companyId, role: "manager" },
            orderBy: [{ createdAt: "asc" }, { id: "asc" }],
            include: { user: true },
          });
          if (managerMembership) {
            const emailChanged =
              managerMembership.user.email.toLowerCase() !==
              input.manager.email.toLowerCase();
            if (emailChanged) {
              const otherUser = await tx.user.findUnique({
                where: { email: input.manager.email.toLowerCase() },
              });
              if (otherUser && otherUser.id !== managerMembership.userId) {
                rejectField("platform_identity_exists", ["manager", "email"]);
              }
              await revokeAccessLinks(
                tx,
                managerMembership.userId,
                principal.userId,
                "email_changed",
              );
            }
            await tx.user.update({
              where: { id: managerMembership.userId },
              data: {
                displayName: input.manager.displayName,
                phone: input.manager.phone,
                email: input.manager.email.toLowerCase(),
              },
            });
          } else {
            const existingUser = await tx.user.findUnique({
              where: { email: input.manager.email.toLowerCase() },
            });
            if (existingUser) {
              rejectField("platform_identity_exists", ["manager", "email"]);
            }
            const newManager = await tx.membership.create({
              data: {
                company: { connect: { id: companyId } },
                role: "manager",
                canManageCustomers: true,
                canManageFieldOperations: true,
                user: {
                  create: {
                    email: input.manager.email.toLowerCase(),
                    displayName: input.manager.displayName,
                    phone: input.manager.phone,
                    passwordHash: null,
                  },
                },
              },
            });
            await this.invitations.issue(
              tx,
              companyId,
              newManager.id,
              principal.userId,
            );
          }
        }

        const updated = await tx.company.findUniqueOrThrow({
          where: { id: companyId },
          select: companySelection,
        });
        const activeUserCount =
          updated.status === "active"
            ? await tx.membership.count({ where: { companyId, active: true } })
            : 0;
        return {
          companyId,
          response: this.companyResponse(updated, activeUserCount),
        };
      },
    );
  }

  createCompany(
    principal: PlatformPrincipal,
    key: string,
    input: CompanyInput,
  ) {
    return this.commands.execute(
      principal,
      key,
      "platform_create_company",
      input,
      async (tx) => {
        if (await tx.user.findUnique({ where: { email: input.manager.email } })) rejectField("platform_identity_exists", ["manager", "email"]);
        if (
          this.tenants.isReserved(input.hostname) ||
          (await tx.companyDomain.findUnique({
            where: { hostname: input.hostname },
          }))
        )
          rejectField("platform_hostname_exists", ["hostname"]);
        const company = await tx.company.create({
          data: {
            name: input.name,
            slug: `${
              input.name
                .normalize("NFKD")
                .replace(/[\u0300-\u036f]/g, "")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
                .slice(0, 27)
                .replace(/-$/, "") || "company"
            }-${randomUUID()}`,
            timeZone: input.timeZone,
            domains: { create: { hostname: input.hostname } },
          },
          select: companySelection,
        });
        const manager = await tx.membership.create({ data: {
          company: { connect: { id: company.id } }, role: 'manager', canManageCustomers: true, canManageFieldOperations: true,
          user: { create: { email: input.manager.email, displayName: input.manager.displayName, phone: input.manager.phone, passwordHash: null } },
        } });
        await this.invitations.issue(tx, company.id, manager.id, principal.userId);
        const current = await tx.company.findUniqueOrThrow({ where: { id: company.id }, select: companySelection });
        return { companyId: company.id, response: this.companyResponse(current, 1) };
      },
    ).then((response) => { this.mail.kick(); return response; }).catch((error: unknown) => {
      if (isUniqueConstraint(error, 'User', ['email'], 'users_email_key'))
        rejectField('platform_identity_exists', ['manager', 'email']);
      if (isUniqueConstraint(error, 'CompanyDomain', ['hostname'], 'company_domains_pkey'))
        rejectField('platform_hostname_exists', ['hostname']);
      throw error;
    });
  }

  members(principal: PlatformPrincipal, companyId: string, query: MemberListQuery) {
    return this.prisma.transaction(async (tx) => {
      await this.access.requireOwner(tx, principal);
      await this.requireCompany(tx, companyId);
      const where: Prisma.MembershipWhereInput = {
        companyId,
        ...(query.role ? { role: query.role } : {}),
        ...(query.active !== undefined ? { active: query.active } : {}),
        ...(query.search ? { user: { OR: [{ email: { contains: query.search, mode: 'insensitive' } }, { displayName: { contains: query.search, mode: 'insensitive' } }] } } : {}),
      };
      const [members, total] = await Promise.all([
        tx.membership.findMany({ where, include: { user: { select: memberUserSelection }, invitations: memberInvitationSelection }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
        tx.membership.count({ where }),
      ]);
      return pageResult(members.map(memberResponse), total, query);
    });
  }

  async createMember(principal: PlatformPrincipal, key: string, companyId: string, input: MemberInput) {
    return this.commands.execute(principal, key, 'platform_create_member', { companyId, ...input, email: input.email.toLowerCase() }, async (tx) => {
      await this.requireCompany(tx, companyId);
      const company = await tx.company.findUniqueOrThrow({ where: { id: companyId }, select: { status: true } });
      if (company.status !== 'active') reject('platform_company_suspended');
      const email = input.email.toLowerCase();
      if (await tx.user.findUnique({ where: { email } })) rejectField('platform_identity_exists', ['email']);
      const member = await tx.membership.create({ data: {
        company: { connect: { id: companyId } }, role: input.role, canManageCustomers: input.role === 'manager', canManageFieldOperations: input.role === 'manager',
        user: { create: { email, displayName: input.displayName, phone: input.phone, passwordHash: null } },
      }, include: { user: { select: memberUserSelection } } });
      await this.invitations.issue(tx, companyId, member.id, principal.userId);
      return { companyId, response: { ...memberResponse(member), invitationStatus: 'pending' as const, deliveryStatus: 'pending' as const } };
    }).then((response) => { this.mail.kick(); return response; }).catch((error: unknown) => {
      if (isUniqueConstraint(error, 'User', ['email'], 'users_email_key'))
        rejectField('platform_identity_exists', ['email']);
      throw error;
    });
  }

  resendInvitation(principal: PlatformPrincipal, key: string, companyId: string, membershipId: string) {
    return this.commands.execute(principal, key, 'platform_resend_invitation', { companyId, membershipId }, async (tx) => {
      await tx.membership.updateMany({ where: { id: membershipId, companyId }, data: { transitionVersion: { increment: 1 } } });
      return { companyId, response: await this.invitations.issue(tx, companyId, membershipId, principal.userId) };
    }).then((response) => { this.mail.kick(); return response; });
  }

  accessHistory(principal: PlatformPrincipal, companyId: string, membershipId: string, query: PaginationQuery) {
    return this.prisma.transaction(async tx => {
      await this.access.requireOwner(tx, principal);
      await this.requireCompany(tx, companyId);
      return this.invitations.history(tx, companyId, membershipId, query);
    });
  }

  async editMember(
    principal: PlatformPrincipal,
    key: string,
    companyId: string,
    membershipId: string,
    input: MemberEditInput,
  ) {
    await this.prisma.transaction((tx) =>
      this.access.requireOwner(tx, principal),
    );
    const passwordHash =
      input.password === undefined
        ? undefined
        : await this.credentials.hashPassword(input.password);
    const logicalInput = {
      companyId,
      membershipId,
      displayName: input.displayName,
      phone: input.phone,
      role: input.role,
      email: input.email.toLowerCase(),
      passwordChange: input.password !== undefined,
    };
    try {
      return await this.commands.execute(
        principal,
        key,
        "platform_edit_member",
        logicalInput,
        async (tx) => {
          await tx.membership.updateMany({ where: { id: membershipId, companyId }, data: { transitionVersion: { increment: 1 } } });
          const member = await tx.membership.findFirst({
            where: { id: membershipId, companyId },
            include: { user: { select: memberUserSelection }, invitations: memberInvitationSelection },
          });
          if (!member) reject("platform_member_not_found");
          const company = await tx.company.findUniqueOrThrow({
            where: { id: companyId },
            select: { status: true },
          });
          if (company.status !== "active") reject("platform_company_suspended");
          if (member.user.isPlatformOwner) reject("platform_owner_protected");
          const duplicate = await tx.user.findUnique({
            where: { email: logicalInput.email },
            select: { id: true },
          });
          if (duplicate && duplicate.id !== member.userId)
            rejectField("platform_identity_exists", ["email"]);
          const roleChanged = member.role !== input.role;
          if (roleChanged) {
            const [assignments, visits, workdays] = await Promise.all([
              tx.customerAssignment.count({
                where: { companyId, membershipId },
              }),
              tx.visit.count({
                where: {
                  companyId,
                  membershipId,
                  status: { in: ["pending", "active"] },
                },
              }),
              tx.workday.count({
                where: { companyId, membershipId, status: "active" },
              }),
            ]);
            if (assignments || visits || workdays)
              reject("platform_role_in_use");
          }
          if (roleChanged) await tx.membershipRoleHistory.create({ data: { companyId, membershipId, previousRole: member.role, role: input.role, changedByUserId: principal.userId } });
          const emailChanged = member.user.email !== logicalInput.email;
          if (passwordHash !== undefined || emailChanged) {
            await revokeAccessLinks(tx, member.userId, principal.userId, emailChanged ? 'email_changed' : 'password_changed');
          }
          await tx.user.update({
            where: { id: member.userId },
            data: {
              displayName: input.displayName,
              phone: input.phone,
              email: logicalInput.email,
              ...(passwordHash === undefined
                ? {}
                : { passwordHash, failures: 0, blockedUntil: null, passwordChangedAt: new Date(),
                    ...(member.user.passwordHash === null && member.user.activatedAt === null ? { activatedAt: new Date() } : {}) }),
            },
          });
          const updated = await tx.membership.update({
            where: { id: membershipId },
            data: {
              transitionVersion: { increment: 1 },
              ...(roleChanged
                ? {
                    role: input.role,
                    canManageCustomers: input.role === "manager",
                    canManageFieldOperations: input.role === "manager",
                  }
                : {}),
            },
            include: { user: { select: memberUserSelection }, invitations: memberInvitationSelection },
          });
          if (
            roleChanged ||
            member.user.email !== logicalInput.email ||
            passwordHash !== undefined
          )
            await tx.session.deleteMany({
              where: { membership: { userId: member.userId } },
            });
          const changed = [
            ...(member.user.displayName !== input.displayName ? ['displayName'] : []),
            ...(member.user.phone !== input.phone ? ['phone'] : []),
            ...(member.user.email !== logicalInput.email ? ['email'] : []),
            ...(roleChanged ? ['role'] : []),
          ];
          if (changed.length) await recordAccessEvent(tx, { userId: member.userId, companyId, membershipId,
            actorUserId: principal.userId, event: 'account_updated', outcome: 'completed', details: { changed,
              ...(member.user.email !== logicalInput.email ? { previousEmail: member.user.email, email: logicalInput.email } : {}),
              ...(roleChanged ? { previousRole: member.role, role: input.role } : {}) } });
          if (passwordHash !== undefined) {
            if (member.user.passwordHash === null && member.user.activatedAt === null)
              await recordAccessEvent(tx, { userId: member.userId, companyId, membershipId, actorUserId: principal.userId,
                event: 'account_activated', outcome: 'administrative' });
            await recordAccessEvent(tx, { userId: member.userId, companyId, membershipId, actorUserId: principal.userId,
              event: 'password_changed', outcome: 'administrative' });
          }
          return { companyId, response: memberResponse(updated) };
        },
        async (tx, response) => {
          if (input.password === undefined) return;
          const user = await tx.user.findUnique({
            where: { id: response.userId },
            select: { passwordHash: true },
          });
          if (
            !user ||
            !(await this.credentials.matchesPassword(
              input.password,
              user.passwordHash,
            ))
          )
            reject("idempotency_key_reused");
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        isUniqueConstraint(error, "User", ["email"], "users_email_key")
      )
        rejectField("platform_identity_exists", ["email"]);
      throw error;
    }
  }

  status(
    principal: PlatformPrincipal,
    key: string,
    companyId: string,
    membershipId: string,
    active: boolean,
  ) {
    return this.commands.execute(
      principal,
      key,
      "platform_member_status",
      { companyId, membershipId, active },
      async (tx) => {
        const member = await tx.membership.findFirst({
          where: { id: membershipId, companyId },
          include: { user: { select: memberUserSelection }, invitations: memberInvitationSelection },
        });
        if (!member) reject("platform_member_not_found");
        const company = await tx.company.findUniqueOrThrow({
          where: { id: companyId },
          select: { status: true },
        });
        if (company.status !== "active") reject("platform_company_suspended");
        if (member.user.isPlatformOwner) reject("platform_owner_protected");
        const updated = await tx.membership.update({
          where: { id: membershipId },
          data: { active, transitionVersion: { increment: 1 } },
          include: { user: { select: memberUserSelection }, invitations: memberInvitationSelection },
        });
        if (!active)
          await tx.session.deleteMany({ where: { membershipId, companyId } });
        return { companyId, response: memberResponse(updated) };
      },
    );
  }
}
