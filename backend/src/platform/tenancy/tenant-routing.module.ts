import { DynamicModule, Global, Inject, Injectable, Module } from '@nestjs/common';
import { reject } from '../../shared/domain/application-error';
import { loadTenantDomains, TenantDomain } from './tenant-domains';

const TENANT_DOMAINS = Symbol('TENANT_DOMAINS');

@Injectable()
export class TenantResolver {
  private readonly companies: ReadonlyMap<string, string>;
  constructor(@Inject(TENANT_DOMAINS) entries: TenantDomain[]) {
    this.companies = new Map(entries.map(entry => [entry.host, entry.company]));
  }

  resolve(host: string | string[] | undefined): string {
    const company = typeof host === 'string' ? this.companies.get(host) : undefined;
    if (!company) reject('tenant_host_unknown');
    return company;
  }
}

@Global()
@Module({})
export class TenantRoutingModule {
  static register(entries: TenantDomain[]): DynamicModule {
    return {
      module: TenantRoutingModule,
      providers: [{provide:TENANT_DOMAINS,useValue:loadTenantDomains(JSON.stringify(entries))},TenantResolver],
      exports: [TenantResolver],
    };
  }
}
