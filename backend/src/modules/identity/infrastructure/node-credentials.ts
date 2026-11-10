import { createHash, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { Clock, PasswordHasher, TokenGenerator } from '../application/ports/credentials';

const derive = promisify(scrypt);

export class ScryptPasswordHasher implements PasswordHasher {
  private readonly dummy = this.hash('not-a-valid-user-password');

  async hash(password: string): Promise<string> {
    return this.encode(password, randomBytes(16).toString('hex'));
  }

  private async encode(password: string, salt: string): Promise<string> {
    const key = await derive(password, salt, 64) as Buffer;
    return `${salt}:${key.toString('hex')}`;
  }

  async matches(password: string, encoded: string): Promise<boolean> {
    const candidate = await this.encode(password, encoded.split(':')[0]);
    const actualBytes = Buffer.from(encoded);
    const candidateBytes = Buffer.from(candidate);
    return candidateBytes.length === actualBytes.length && timingSafeEqual(candidateBytes, actualBytes);
  }

  async compareUnknownAccount(password: string): Promise<void> {
    await this.matches(password, await this.dummy);
  }
}

export class CryptoTokenGenerator implements TokenGenerator {
  generate(): string { return randomBytes(32).toString('base64url'); }
  digest(token: string): string { return createHash('sha256').update(token).digest('hex'); }
  createId(): string { return randomUUID(); }
}

export class SystemClock implements Clock {
  now(): Date { return new Date(); }
}
