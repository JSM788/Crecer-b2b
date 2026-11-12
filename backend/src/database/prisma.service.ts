import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Prisma } from '../generated/prisma/client';
import { loadPolicy } from '../config/environment';
import { reject } from '../common/errors/application-error';

export type Transaction = Prisma.TransactionClient;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  private readonly policy = loadPolicy();

  constructor(databaseUrl: string, isolatedSchema = 'public') {
    if (
      isolatedSchema !== 'public' &&
      !/^test_[a-f0-9]{32}$/.test(isolatedSchema)
    ) {
      throw new Error('Invalid isolated test schema');
    }
    const policy = loadPolicy();
    const url = new URL(databaseUrl);
    url.searchParams.delete('schema');
    const adapter = new PrismaPg(
      {
        connectionString: url.toString(),
        max: policy.DB_POOL_SIZE,
        statement_timeout: policy.DB_STATEMENT_TIMEOUT_MS,
        connectionTimeoutMillis: policy.DB_STATEMENT_TIMEOUT_MS,
      },
      { schema: isolatedSchema },
    );
    super({ adapter });
  }

  async transaction<T>(
    run: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    for (
      let attempt = 1;
      attempt <= this.policy.DB_TRANSACTION_ATTEMPTS;
      attempt++
    ) {
      try {
        return await this.$transaction(run, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: this.policy.DB_STATEMENT_TIMEOUT_MS,
          timeout: this.policy.DB_STATEMENT_TIMEOUT_MS,
        });
      } catch (error) {
        if (
          !(error instanceof Prisma.PrismaClientKnownRequestError) ||
          error.code !== 'P2034'
        )
          throw error;
        if (attempt === this.policy.DB_TRANSACTION_ATTEMPTS)
          reject('transaction_conflict');
      }
    }
    throw new Error('Transaction attempt policy is invalid');
  }

  /**
   * Read-only transaction using ReadCommitted isolation.
   * Avoids Serializable lock/SSI overhead and retry loops on GET queries.
   */
  readTransaction<T>(
    run: (transaction: Transaction) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(run, {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: this.policy.DB_STATEMENT_TIMEOUT_MS,
      timeout: this.policy.DB_STATEMENT_TIMEOUT_MS,
    });
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
