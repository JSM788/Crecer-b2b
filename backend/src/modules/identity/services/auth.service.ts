import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { loadPolicy } from '../../../config/environment';
import { reject } from '../../../common/errors/application-error';
import { AuthenticatedPrincipal, PlatformPrincipal, MembershipRole } from '../../../common/types/principal';
import { CredentialsService } from './credentials.service';
import { LoginDto } from '../dto/login.dto';
import { recordAccessEvent } from './access-events';
import { canAccessWebRole } from '../../../common/web-access-policy';

@Injectable()
export class AuthService {
  private readonly policy = loadPolicy();
  constructor(
    private readonly prisma: PrismaService,
    private readonly credentials: CredentialsService,
  ) {}

  async login(
    company: string | undefined,
    input: LoginDto,
    web = false,
  ): Promise<{ token: string; expiresAt: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user) {
      await this.credentials.compareUnknownAccount(input.password);
      reject('invalid_credentials');
    }
    const valid = await this.credentials.matchesPassword(input.password, user.passwordHash);
    if (!valid || (user.blockedUntil && user.blockedUntil > new Date())) {
      await this.recordFailedLogin(user.id);
      reject('invalid_credentials');
    }
    const token = this.credentials.generateToken();
    const expiresAt = new Date(
      Date.now() + this.policy.SESSION_TTL_HOURS * 3600000,
    );
    try {
      await this.prisma.transaction(async (tx) => {
        // [MOMENTÁNEO / TESTING]: En entorno de pruebas en un solo host (sin DNS wildcard activo),
        // si el usuario no tiene membresía en el slug del host, permitimos buscar su membresía activa
        // directa por usuario para que pueda acceder a su empresa asignada.
        let memberships = user.isPlatformOwner ? [] : await tx.membership.findMany({
          where: { userId: user.id, active: true, company: { status: 'active', ...(company ? { slug: company } : {}) } },
          orderBy: { id: 'asc' }, take: 2,
        });
        if (!user.isPlatformOwner && memberships.length === 0 && company) {
          // Fallback momentáneo: buscar la membresía activa del usuario en cualquier empresa activa
          memberships = await tx.membership.findMany({
            where: { userId: user.id, active: true, company: { status: 'active' } },
            orderBy: { id: 'asc' }, take: 2,
          });
        }
        if (!user.isPlatformOwner && memberships.length === 0) reject('invalid_credentials');
        if (memberships.length > 1) reject('company_selection_required');
        const membership = memberships[0];
        // Match the credential snapshot inside the same serializable transaction that creates the session.
        if (membership) await tx.membership.update({ where: { id: membership.id }, data: { transitionVersion: { increment: 1 } } });
        const locked = await tx.user.updateMany({
          where: { id: user.id, email: input.email, passwordHash: user.passwordHash,
            isPlatformOwner: user.isPlatformOwner, OR: [{ blockedUntil: null }, { blockedUntil: { lte: new Date() } }] },
          data: { failures: 0, blockedUntil: null, platformVersion: { increment: 1 } },
        });
        if (locked.count !== 1) reject('invalid_credentials');
        if (web && !canAccessWebRole(user.isPlatformOwner ? 'platform_owner' : membership.role))
          reject('web_access_denied');
        if (user.isPlatformOwner) await tx.platformSession.create({ data: {
          tokenHash: this.credentials.digestToken(token), userId: user.id, expiresAt,
        } });
        else await tx.session.create({ data: {
          tokenHash: this.credentials.digestToken(token), companyId: membership.companyId,
          membershipId: membership.id, expiresAt,
        } });
        await recordAccessEvent(tx, { userId: user.id, actorUserId: user.id,
          ...(membership ? { companyId: membership.companyId, membershipId: membership.id } : {}),
          event: 'login_succeeded', outcome: 'accepted' });
      });
    } catch (error) {
      await this.prisma.accessEvent.create({ data: { userId: user.id, event: 'login_failed', outcome: 'rejected' } });
      throw error;
    }
    return { token, expiresAt: expiresAt.toISOString() };
  }

  private async recordFailedLogin(userId: string): Promise<void> {
    await this.prisma.transaction(async (tx) => {
      const failed = await tx.user.update({
        where: { id: userId },
        data: { failures: { increment: 1 } },
      });
      await recordAccessEvent(tx, { userId, event: 'login_failed', outcome: 'invalid_credentials' });
      if (failed.failures >= this.policy.LOGIN_MAX_FAILURES) {
        await tx.user.update({
          where: { id: userId },
          data: { blockedUntil: new Date(Date.now() + this.policy.LOGIN_LOCK_MINUTES * 60000) },
        });
      }
    });
  }

  async authenticate(token: string, company?: string): Promise<AuthenticatedPrincipal> {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) reject('authentication_required');
    const tokenHash = this.credentials.digestToken(token);
    const platformSession = await this.prisma.platformSession.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, email: true, isPlatformOwner: true } } },
    });
    if (platformSession) {
      if (platformSession.expiresAt <= new Date() || !platformSession.user.isPlatformOwner)
        reject('authentication_required');
      const principal: PlatformPrincipal = {
        scope: 'platform',
        companyId: null,
        membershipId: null,
        userId: platformSession.user.id,
        role: 'platform_owner',
        email: platformSession.user.email,
        timeZone: null,
        tokenHash,
        permissions: ['manage_platform'],
      };
      return principal;
    }
    // [MOMENTÁNEO / TESTING]: En entorno de pruebas en un solo host (sin DNS wildcard activo),
    // si la sesión activa no coincide con el slug del host actual, permitimos resolver la sesión
    // de la empresa del usuario.
    let session = await this.prisma.session.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        membership: {
          active: true,
          company: { status: 'active', ...(company ? { slug: company } : {}) },
        },
      },
      include: {
        membership: {
          include: {
            user: { select: { email: true, isPlatformOwner: true } },
            company: true,
          },
        },
      },
    });
    if (!session && company) {
      session = await this.prisma.session.findFirst({
        where: {
          tokenHash,
          expiresAt: { gt: new Date() },
          membership: {
            active: true,
            company: { status: 'active' },
          },
        },
        include: {
          membership: {
            include: {
              user: { select: { email: true, isPlatformOwner: true } },
              company: true,
            },
          },
        },
      });
    }
    if (!session || session.membership.user.isPlatformOwner) reject('authentication_required');
    const member = session.membership;
    return {
      scope: 'tenant',
      companyId: member.companyId,
      membershipId: member.id,
      userId: member.userId,
      role: member.role as MembershipRole,
      email: member.user.email,
      timeZone: member.company.timeZone,
      tokenHash,
      permissions: [
        ...(member.canManageCustomers
          ? ['manage_customers' as const]
          : []),
        ...(member.canManageFieldOperations
          ? ['manage_field_operations' as const]
          : []),
      ],
    };
  }

  async logout(principal: AuthenticatedPrincipal): Promise<{ loggedOut: true }> {
    if (principal.scope === 'platform') {
      await this.prisma.platformSession.deleteMany({ where: { tokenHash: principal.tokenHash, userId: principal.userId } });
      return { loggedOut: true };
    }
    await this.prisma.session.deleteMany({
      where: {
        tokenHash: principal.tokenHash,
        companyId: principal.companyId,
        membershipId: principal.membershipId,
      },
    });
    return { loggedOut: true };
  }
}
