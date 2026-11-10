import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService, Transaction } from '../../../database/prisma.service';
import { PlatformPrincipal } from '../../../common/types/principal';
import { reject } from '../../../common/errors/application-error';
import { Prisma } from '../../../generated/prisma/client';
import { PlatformAccessService } from './platform-access.service';

@Injectable()
export class PlatformCommandsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: PlatformAccessService,
  ) {}

  execute<T extends { id: string }>(
    principal: PlatformPrincipal,
    key: string,
    action: string,
    logicalInput: unknown,
    run: (tx: Transaction) => Promise<{ response: T; companyId: string }>,
    verifyReplay?: (tx: Transaction, response: T) => Promise<void>,
  ) {
    const fingerprint = createHash('sha256')
      .update(JSON.stringify([action, logicalInput]))
      .digest('hex');
    return this.prisma.transaction(async (tx) => {
      await this.access.requireOwner(tx, principal);
      const identity = { actorUserId: principal.userId, key };
      const existing = await tx.platformOperation.findUnique({
        where: { actorUserId_key: identity },
      });
      if (existing) {
        if (existing.fingerprint !== fingerprint)
          reject('idempotency_key_reused');
        const response = existing.response as T;
        await verifyReplay?.(tx, response);
        return response;
      }
      // Serialize platform commands on the owner identity, independent of any company.
      const lock = await tx.user.updateMany({
        where: {
          id: principal.userId,
          isPlatformOwner: true,
        },
        data: { platformVersion: { increment: 1 } },
      });
      if (lock.count !== 1) reject('platform_forbidden');
      const result = await run(tx);
      const response = JSON.parse(
        JSON.stringify(result.response),
      ) as Prisma.InputJsonObject;
      await tx.platformOperation.create({
        data: { ...identity, fingerprint, response },
      });
      await tx.platformAuditEntry.create({
        data: {
          actorUserId: principal.userId,
          companyId: result.companyId,
          subjectId: result.response.id,
          action,
        },
      });
      return result.response;
    });
  }
}
