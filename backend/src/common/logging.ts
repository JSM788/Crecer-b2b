import * as fs from 'node:fs';
import * as path from 'node:path';

export type LogSource = 'backend' | 'frontend' | 'mobile';
export type LogLevel = 'info' | 'warn' | 'error';

export interface StructuredLogEntry {
  id: string;
  time: string;
  source: LogSource;
  level: LogLevel;
  event: string;
  message: string;
  userId?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  companyId?: string | null;
  companyName?: string | null;
  screen?: string | null;
  details?: Record<string, unknown> | null;
}

export interface LogFileInfo {
  source: LogSource;
  filename: string;
  sizeBytes: number;
  lastModified: string;
}

const LOG_SOURCES: readonly LogSource[] = ['backend', 'frontend', 'mobile'];
const LOG_ROOT_DIR = path.join(process.cwd(), 'logs');

function dateStamp(isoTime: string): string {
  return isoTime.slice(0, 10);
}

function humanizeEventName(event: string): string {
  return event
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
}

export function writeSourceLog(
  source: LogSource,
  entry: Omit<StructuredLogEntry, 'id' | 'time' | 'source'> & {
    id?: string;
    time?: string;
  },
): StructuredLogEntry {
  const time = entry.time ?? new Date().toISOString();
  const record: StructuredLogEntry = {
    id: entry.id ?? `${source}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    time,
    source,
    level: entry.level,
    event: entry.event,
    message: entry.message || humanizeEventName(entry.event),
    userId: entry.userId ?? null,
    userEmail: entry.userEmail ?? null,
    userName: entry.userName ?? null,
    companyId: entry.companyId ?? null,
    companyName: entry.companyName ?? null,
    screen: entry.screen ?? null,
    details: entry.details ?? null,
  };

  try {
    const dir = path.join(LOG_ROOT_DIR, source);
    fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${dateStamp(time)}.log`);
    fs.appendFileSync(filePath, JSON.stringify(record) + '\n', 'utf8');
  } catch {
    // Logging to disk must never crash application execution.
  }

  return record;
}

export function listSourceLogFiles(source?: LogSource): LogFileInfo[] {
  const sources = source ? [source] : LOG_SOURCES;
  const results: LogFileInfo[] = [];

  for (const src of sources) {
    const dir = path.join(LOG_ROOT_DIR, src);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const filename of files) {
      if (!filename.endsWith('.log')) continue;
      const fullPath = path.join(dir, filename);
      try {
        const stats = fs.statSync(fullPath);
        if (!stats.isFile()) continue;
        results.push({
          source: src,
          filename,
          sizeBytes: stats.size,
          lastModified: stats.mtime.toISOString(),
        });
      } catch {
        // Ignore unreadable files
      }
    }
  }

  return results.sort(
    (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime(),
  );
}

export function readSourceLogFile(
  source: LogSource,
  filename: string,
): { source: LogSource; filename: string; sizeBytes: number; content: string } | null {
  if (
    !LOG_SOURCES.includes(source) ||
    !filename ||
    filename.includes('..') ||
    filename.includes('/') ||
    filename.includes('\\') ||
    !filename.endsWith('.log')
  ) {
    return null;
  }

  const fullPath = path.join(LOG_ROOT_DIR, source, filename);
  if (!fs.existsSync(fullPath)) return null;

  const stats = fs.statSync(fullPath);
  const content = fs.readFileSync(fullPath, 'utf8');
  return {
    source,
    filename,
    sizeBytes: stats.size,
    content,
  };
}

export function readRecentSourceLogs(options: {
  source?: LogSource;
  sinceMs?: number;
  limit?: number;
} = {}): StructuredLogEntry[] {
  const { source, sinceMs, limit = 500 } = options;
  const files = listSourceLogFiles(source);
  const entries: StructuredLogEntry[] = [];

  for (const file of files) {
    if (sinceMs && new Date(file.lastModified).getTime() < sinceMs - 86_400_000) {
      continue;
    }
    const read = readSourceLogFile(file.source, file.filename);
    if (!read) continue;

    const lines = read.content.split(/\r?\n/).filter((l) => l.trim().length > 0);
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(lines[i]) as Partial<StructuredLogEntry>;
        const time = typeof parsed.time === 'string' ? parsed.time : file.lastModified;
        if (sinceMs && new Date(time).getTime() < sinceMs) continue;

        entries.push({
          id: typeof parsed.id === 'string' ? parsed.id : `${file.source}-${file.filename}-${i}`,
          time,
          source: parsed.source ?? file.source,
          level: parsed.level === 'error' || parsed.level === 'warn' ? parsed.level : 'info',
          event: typeof parsed.event === 'string' ? parsed.event : 'log_event',
          message:
            typeof parsed.message === 'string' && parsed.message.length > 0
              ? parsed.message
              : humanizeEventName(typeof parsed.event === 'string' ? parsed.event : 'log_event'),
          userId: typeof parsed.userId === 'string' ? parsed.userId : null,
          userEmail: typeof parsed.userEmail === 'string' ? parsed.userEmail : null,
          userName: typeof parsed.userName === 'string' ? parsed.userName : null,
          companyId: typeof parsed.companyId === 'string' ? parsed.companyId : null,
          companyName: typeof parsed.companyName === 'string' ? parsed.companyName : null,
          screen: typeof parsed.screen === 'string' ? parsed.screen : null,
          details:
            parsed.details && typeof parsed.details === 'object'
              ? (parsed.details as Record<string, unknown>)
              : null,
        });
      } catch {
        // Ignore malformed log line
      }
      if (entries.length >= limit) break;
    }
    if (entries.length >= limit) break;
  }

  return entries.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
}

export function log(
  level: 'info' | 'error' | 'warn',
  event: string,
  fields: Record<string, unknown> = {},
) {
  const time = new Date().toISOString();
  const record = JSON.stringify({
    time,
    level,
    event,
    ...fields,
  });
  (level === 'error' ? process.stderr : process.stdout).write(record + '\n');

  const message =
    typeof fields.message === 'string' && fields.message.length > 0
      ? fields.message
      : humanizeEventName(event);

  writeSourceLog('backend', {
    time,
    level,
    event,
    message,
    userId: typeof fields.userId === 'string' ? fields.userId : null,
    userEmail: typeof fields.userEmail === 'string' ? fields.userEmail : null,
    userName: typeof fields.userName === 'string' ? fields.userName : null,
    companyId: typeof fields.companyId === 'string' ? fields.companyId : null,
    companyName: typeof fields.companyName === 'string' ? fields.companyName : null,
    screen: typeof fields.screen === 'string' ? fields.screen : null,
    details: Object.keys(fields).length > 0 ? fields : null,
  });
}

export function errorMetadata(error: unknown) {
  if (!(error instanceof Error)) return { errorType: 'non_error_exception' };
  const code =
    'code' in error &&
    typeof error.code === 'string' &&
    /^[A-Za-z0-9_]{1,40}$/.test(error.code)
      ? error.code
      : undefined;
  // Raw database/validation error messages can contain credentials or submitted data.
  return { errorType: error.name, errorCode: code };
}
