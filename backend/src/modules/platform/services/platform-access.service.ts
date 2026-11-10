import { Injectable } from '@nestjs/common';
import { Transaction } from '../../../database/prisma.service';
import { PlatformPrincipal } from '../../../common/types/principal';
import { reject } from '../../../common/errors/application-error';

@Injectable()
export class PlatformAccessService {
  async requireOwner(tx: Transaction, principal: PlatformPrincipal): Promise<void> {
    const session = await tx.platformSession.findFirst({
      where: {
        tokenHash: principal.tokenHash,
        userId: principal.userId,
        expiresAt: { gt: new Date() },
        user: { isPlatformOwner: true },
      },
    });
    if (!session) reject('platform_forbidden');
  }
}
