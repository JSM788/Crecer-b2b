import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import nodemailer, { Transporter } from 'nodemailer';
import { PrismaService } from '../../database/prisma.service';
import { loadMailConfig } from './config';
import { decryptInvitationToken } from './token-cipher';
import { recordAccessEvent } from '../identity/services/access-events';

@Injectable()
export class MailService implements OnModuleInit, OnModuleDestroy {
  private readonly config = loadMailConfig();
  private readonly logger = new Logger(MailService.name);
  private timer?: NodeJS.Timeout;
  private running?: Promise<void>;
  private transport?: Transporter;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    if (!this.config.MAIL_ENABLED) return;
    this.timer = setInterval(() => this.kick(), this.config.MAIL_WORKER_INTERVAL_MS);
    this.timer.unref();
    this.kick();
  }

  kick(): void {
    if (!this.config.MAIL_ENABLED || this.running) return;
    this.running = this.drain().catch(() => {
      // Never log SMTP messages, recipients, URLs or encrypted payloads.
      this.logger.error('Mail outbox processing failed');
    }).finally(() => { this.running = undefined; });
  }

  private sender(): Transporter {
    return this.transport ??= nodemailer.createTransport({
      pool: true,
      maxConnections: 2,
      maxMessages: 50,
      maxRequeues: 0,
      host: this.config.SMTP_HOST,
      port: this.config.SMTP_PORT,
      secure: this.config.SMTP_SECURE,
      requireTLS: this.config.SMTP_REQUIRE_TLS,
      ...(this.config.SMTP_USER ? { auth: { user: this.config.SMTP_USER, pass: this.config.SMTP_PASSWORD } } : {}),
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
      disableFileAccess: true,
      disableUrlAccess: true,
      logger: false,
      debug: false,
    });
  }

  private async drain(): Promise<void> {
    // A process can die on its final attempt. Expired claims must terminate instead of remaining stuck.
    await this.prisma.mailOutbox.updateMany({
      where: { status: 'sending', attempts: { gte: this.config.MAIL_MAX_ATTEMPTS }, lockedUntil: { lte: new Date() } },
      data: { status: 'failed', claimToken: null, lockedUntil: null, lastError: 'delivery_failed' },
    });
    for (let batch = 0; batch < 10; batch++) {
      const now = new Date();
      const candidate = await this.prisma.mailOutbox.findFirst({
        where: {
          status: { in: ['pending', 'sending'] },
          nextAttemptAt: { lte: now },
          OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }],
          attempts: { lt: this.config.MAIL_MAX_ATTEMPTS },
        },
        orderBy: [{ nextAttemptAt: 'asc' }, { id: 'asc' }],
      });
      if (!candidate) return;
      const claimToken = randomUUID();
      const claimed = await this.prisma.mailOutbox.updateMany({
        where: {
          id: candidate.id,
          status: { in: ['pending', 'sending'] },
          OR: [{ lockedUntil: null }, { lockedUntil: { lte: now } }],
          attempts: { lt: this.config.MAIL_MAX_ATTEMPTS },
        },
        data: { status: 'sending', claimToken, lockedUntil: new Date(now.getTime() + 120000), attempts: { increment: 1 } },
      });
      if (claimed.count !== 1) continue;
      const where = { id: candidate.id, claimToken };
      const invitation = await this.prisma.invitation.findUniqueOrThrow({
        where: { id: candidate.invitationId },
        include: { membership: { include: { user: true, company: true } } },
      });
      const audit = { userId: invitation.membership.userId, companyId: invitation.companyId,
        membershipId: invitation.membershipId, invitationId: invitation.id,
        details: { attempt: candidate.attempts + 1, purpose: invitation.purpose } };
      await recordAccessEvent(this.prisma, { ...audit, event: 'mail_attempted', outcome: 'started' });
      try {
        if (invitation.revokedAt || invitation.consumedAt || invitation.expiresAt <= now || !invitation.tokenCiphertext || !invitation.membership.active || invitation.membership.company.status !== 'active') {
          await this.prisma.mailOutbox.updateMany({ where, data: { status: 'cancelled', lockedUntil: null, claimToken: null } });
          await recordAccessEvent(this.prisma, { ...audit, event: 'mail_cancelled', outcome: 'unavailable' });
          continue;
        }
        const token = decryptInvitationToken(invitation.tokenCiphertext, this.config.MAIL_ENCRYPTION_KEY!);
        const link = new URL(`/invitation/${encodeURIComponent(token)}`, this.config.WEB_PUBLIC_URL!).toString();
        const nativeLink = `${this.config.MOBILE_APP_SCHEME}://invitation/${encodeURIComponent(token)}`;
        const info = await this.sender().sendMail({
          from: this.config.SMTP_FROM,
          to: invitation.membership.user.email,
          messageId: `<invitation-${invitation.id}@${new URL(this.config.WEB_PUBLIC_URL!).hostname}>`,
          subject: invitation.purpose === 'password_reset' ? `Restablece tu contraseña de ${invitation.membership.company.name}` : `Tu acceso a ${invitation.membership.company.name}`,
          text: `Hola ${invitation.membership.user.displayName ?? ''},\n\n${invitation.purpose === 'password_reset' ? 'Se solicitó restablecer tu contraseña.' : `Te damos la bienvenida a ${invitation.membership.company.name}.`}\nTu correo de acceso es ${invitation.membership.user.email}. ${invitation.purpose === 'password_reset' ? 'Restablece' : 'Establece'} tu contraseña con este enlace de un solo uso:\n${link}\n\nTambién puedes abrirlo en la aplicación instalada:\n${nativeLink}\n\nEl enlace vence el ${invitation.expiresAt.toISOString()}. Después podrás ingresar desde web o móvil con tu correo y contraseña. Si no esperabas este correo, ignóralo.`,
        });
        if (!info.accepted?.length) throw new Error('SMTP rejected message');
        await this.prisma.mailOutbox.updateMany({ where, data: { status: 'sent', sentAt: new Date(), lockedUntil: null, claimToken: null, lastError: null } });
        await recordAccessEvent(this.prisma, { ...audit, event: 'mail_accepted', outcome: 'smtp_accepted' });
      } catch {
        const attempts = candidate.attempts + 1;
        await this.prisma.mailOutbox.updateMany({
          where,
          data: {
            status: attempts >= this.config.MAIL_MAX_ATTEMPTS ? 'failed' : 'pending',
            nextAttemptAt: new Date(Date.now() + Math.min(900000, 30000 * 2 ** (attempts - 1))),
            lockedUntil: null,
            claimToken: null,
            lastError: 'delivery_failed',
          },
        });
        this.logger.warn('Invitation delivery failed; bounded retry scheduled');
        await recordAccessEvent(this.prisma, { ...audit, event: 'mail_failed', outcome: 'delivery_failed' });
      }
    }
  }

  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    await this.running;
    this.transport?.close();
  }
}
