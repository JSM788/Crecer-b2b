import {
  DynamicModule,
  Global,
  Inject,
  Injectable,
  Module,
} from '@nestjs/common';
import { reject } from '../errors/application-error';
import { loadTenantDomains, TenantDomain } from '../../config/tenant-domains';
import { PrismaService } from '../../database/prisma.service';

const TENANT_DOMAINS = Symbol('TENANT_DOMAINS');

@Injectable()
export class TenantResolver {
  private readonly companies: ReadonlyMap<string, string>;
  constructor(
    @Inject(TENANT_DOMAINS) private readonly entries: TenantDomain[],
    private readonly prisma: PrismaService,
  ) {
    this.companies = new Map(
      entries.map((entry) => [entry.host, entry.company]),
    );
  }
  configured(): readonly TenantDomain[] {
    return this.entries;
  }

  isReserved(host: string): boolean {
    return this.companies.has(host);
  }

  async resolve(host: string | string[] | undefined): Promise<string | undefined> {
    if (typeof host !== 'string') return undefined;
    if (host === 'localhost' || host === '127.0.0.1') return undefined;
    const configured = this.companies.get(host);
    if (configured) return configured;
    const domain = await this.prisma.companyDomain.findUnique({
      where: { hostname: host },
      select: { company: { select: { slug: true } } },
    });
    if (!domain) reject('tenant_host_unknown');
    return domain.company.slug;
  }
}

@Global()
@Module({})
export class TenantRoutingModule {
  static register(entries: TenantDomain[]): DynamicModule {
    return {
      module: TenantRoutingModule,
      providers: [
        {
          provide: TENANT_DOMAINS,
          useValue: loadTenantDomains(JSON.stringify(entries)),
        },
        TenantResolver,
      ],
      exports: [TenantResolver],
    };
  }
}
