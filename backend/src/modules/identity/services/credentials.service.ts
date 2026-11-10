import { Injectable } from '@nestjs/common';
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const derive = promisify(scrypt);

@Injectable()
export class CredentialsService {
  private readonly dummy = this.hashPassword('not-a-valid-user-password');

  async hashPassword(
    password: string,
    salt = randomBytes(16).toString('hex'),
  ): Promise<string> {
    const key = (await derive(password, salt, 64)) as Buffer;
    return `${salt}:${key.toString('hex')}`;
  }

  async matchesPassword(password: string, encoded: string | null): Promise<boolean> {
    if (encoded === null) { await this.compareUnknownAccount(password); return false; }
    const candidate = Buffer.from(
      await this.hashPassword(password, encoded.split(':')[0]),
    );
    const actual = Buffer.from(encoded);
    return (
      candidate.length === actual.length && timingSafeEqual(candidate, actual)
    );
  }

  async compareUnknownAccount(password: string): Promise<void> {
    await this.matchesPassword(password, await this.dummy);
  }

  generateToken(): string {
    return randomBytes(32).toString('base64url');
  }
  digestToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
  createId(): string {
    return randomUUID();
  }
}
