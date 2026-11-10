import { DynamicModule, Global, Module } from '@nestjs/common';
import { Database } from '../database';

export const DATABASE = Symbol('DATABASE');

/** One connection pool per application. Only infrastructure adapters consume this token. */
@Global()
@Module({})
export class PersistenceModule {
  static register(database: Database): DynamicModule {
    return {
      module: PersistenceModule,
      providers: [{ provide: DATABASE, useValue: database }],
      exports: [DATABASE],
    };
  }
}
