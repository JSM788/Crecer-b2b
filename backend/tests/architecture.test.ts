import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import ts from 'typescript';

async function sources(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries
      .filter((entry) => entry.name !== 'generated')
      .map((entry) => {
        const path = join(directory, entry.name);
        return entry.isDirectory()
          ? sources(path)
          : Promise.resolve(path.endsWith('.ts') ? [path] : []);
      }),
  );
  return nested.flat();
}

test('active Nest modules use Prisma and do not import explicitly excluded legacy adapters', async () => {
  const config = JSON.parse(await readFile('tsconfig.json', 'utf8')) as {
    exclude: string[];
  };
  const legacy = new Set(config.exclude.map((path) => resolve(path)));
  const files = (await sources('src')).filter(
    (path) => !legacy.has(resolve(path)),
  );
  assert.ok(files.some((path) => path.endsWith('prisma.service.ts')));
  assert.ok(files.some((path) => path.endsWith('customers.service.ts')));
  for (const path of files) {
    const source = await readFile(path, 'utf8');
    assert.ok(
      !/\$(?:queryRaw|executeRaw)|\b(?:SELECT\s+.+\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET)\b/is.test(
        source,
      ),
      `${path} contains application SQL`,
    );
    assert.ok(
      !/\.(?:factory|facade)\.ts$|[\\/](?:domain|application|ports|infrastructure)[\\/]/.test(
        path,
      ),
      `${path} retains an active legacy layer`,
    );
    const tree = ts.createSourceFile(
      path,
      source,
      ts.ScriptTarget.Latest,
      true,
    );
    for (const statement of tree.statements) {
      if (
        !ts.isImportDeclaration(statement) ||
        !ts.isStringLiteral(statement.moduleSpecifier)
      )
        continue;
      const dependency = statement.moduleSpecifier.text;
      assert.notEqual(
        dependency,
        'pg',
        `${path} imports the raw PostgreSQL driver`,
      );
      if (dependency.startsWith('.')) {
        const target = resolve(dirname(path), dependency + '.ts');
        assert.ok(
          !legacy.has(target),
          `${path} imports excluded legacy file ${relative('.', target)}`,
        );
      }
      if (path.includes('services'))
        assert.ok(
          !/HttpException|(?:BadRequest|NotFound|Unauthorized|Forbidden|Conflict)Exception/.test(
            statement.getText(),
          ),
          `${path} couples service errors to HTTP`,
        );
    }
  }
});
