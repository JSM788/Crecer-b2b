import test from "node:test";
import assert from "node:assert/strict";
import { FieldApi, FieldError } from "../src/shared/api";

const token = "i".repeat(43);
const details = {
  companyId: "company-id", companyName: "Invited company", tenantHost: "invited.example",
  email: "field@example.com", role: "commercial", expiresAt: "2099-01-01T00:00:00.000Z", purpose: "activation",
};

test("native invitation establishes a password without configuring company access", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const api = new FieldApi({ web: false, apiUrl: "https://api.example.com", fetch: async (input, init) => {
    const url = String(input);
    calls.push({url, init});
    if (url.endsWith("/auth/login")) return Response.json({token: "a".repeat(43), expiresAt: details.expiresAt});
    return Response.json(url.endsWith("/accept") ? {companyId: details.companyId, tenantHost: details.tenantHost, email: details.email, purpose: details.purpose} : details);
  }});
  const metadata = await api.invitation(token);
  assert.equal(metadata.companyName, details.companyName);
  const accepted = await api.acceptInvitation(token, "chosen-password");
  assert.equal(accepted.tenantHost, details.tenantHost);
  assert.equal(calls[1].init?.method, "POST");
  assert.deepEqual(JSON.parse(String(calls[1].init?.body)), {password: "chosen-password"});
  assert.equal(calls[1].url.includes("chosen-password"), false);
  await api.login(accepted.email, "chosen-password");
  assert.equal(new Headers(calls[2].init?.headers).has("X-Tenant-Host"), false);
  assert.equal(accepted.purpose, "activation");
});

test("native recovery metadata and completion retain password-reset purpose", async () => {
  const api = new FieldApi({web: false, apiUrl: "https://api.example.com", fetch: async () => Response.json({...details, purpose: "password_reset"})});
  assert.equal((await api.invitation(token)).purpose, "password_reset");
  assert.equal((await api.acceptInvitation(token, "new-recovery-password")).purpose, "password_reset");
});

test("native invitation rejects malformed links, unsafe tenant responses and expired tokens", async () => {
  let calls = 0;
  const api = new FieldApi({web: false, apiUrl: "https://api.example.com", fetch: async () => {
    calls++;
    return Response.json({...details, tenantHost: "https://wrong.example/path"});
  }});
  await assert.rejects(api.invitation("bad"), /invitation_invalid/);
  assert.equal(calls, 0);
  await assert.rejects(api.invitation(token), /invalid_response/);
  const expired = new FieldApi({web: false, apiUrl: "https://api.example.com", fetch: async () => Response.json({code:"invitation_expired"}, {status:410})});
  await assert.rejects(expired.acceptInvitation(token, "chosen-password"), (error: unknown) => error instanceof FieldError && error.status === 410 && error.code === "invitation_expired");
});
