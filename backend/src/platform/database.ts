import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Pool, types } from 'pg';
import { loadPolicy } from './config';

// Calendar dates are not instants; preserve their YYYY-MM-DD contract on every host timezone.
types.setTypeParser(1082, value => value);

export interface Sql {
  query<T extends Record<string, any> = Record<string, any>>(sql: string, params?: any[]): Promise<T[]>;
}
export interface Database extends Sql {
  transaction<T>(run: (sql: Sql) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}
export class PostgresDatabase implements Database {
  private readonly pool: Pool;
  constructor(url: string, isolatedTestSchema?: string) {
    const policy=loadPolicy();
    if(isolatedTestSchema && !/^test_[a-f0-9]{32}$/.test(isolatedTestSchema)) throw new Error('Invalid isolated test schema');
    this.pool = new Pool({ connectionString: url, max: policy.DB_POOL_SIZE, statement_timeout: policy.DB_STATEMENT_TIMEOUT_MS, connectionTimeoutMillis:policy.DB_STATEMENT_TIMEOUT_MS,
      ...(isolatedTestSchema ? {options:`-csearch_path=${isolatedTestSchema}`} : {}) });
  }
  async query<T extends Record<string, any>>(sql: string, params: any[] = []): Promise<T[]> {
    return (await this.pool.query<T>(sql, params)).rows;
  }
  async transaction<T>(run: (sql: Sql) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await run({ query: async (sql, params = []) => (await client.query(sql, params)).rows });
      await client.query('COMMIT');
      return result;
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  async close() { await this.pool.end(); }
}
export async function migrate(database: Database) {
  const migrations = ['001-foundation.sql', '002-visit-planning-evidence.sql'];
  await database.transaction(async tx => {
    await tx.query('SELECT pg_advisory_xact_lock(741092)');
    await tx.query('CREATE TABLE IF NOT EXISTS schema_migrations(version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
    for (const name of migrations) {
      const version = name.slice(0, 3);
      if ((await tx.query('SELECT version FROM schema_migrations WHERE version=$1', [version])).length) continue;
      const sql = await readFile(resolve(__dirname, '../../../migrations', name), 'utf8');
      await tx.query(sql);
      await tx.query('INSERT INTO schema_migrations(version) VALUES($1)', [version]);
    }
  });
}
