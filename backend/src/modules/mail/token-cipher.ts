import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
export function encryptInvitationToken(token: string, encodedKey: string): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(encodedKey, 'base64'), nonce);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return [nonce, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
}
export function decryptInvitationToken(payload: string, encodedKey: string): string {
  const parts = payload.split('.');
  if (parts.length !== 3) throw new Error('Invalid invitation encryption payload');
  const [nonce, tag, encrypted] = parts.map((part) => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(encodedKey, 'base64'), nonce);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
