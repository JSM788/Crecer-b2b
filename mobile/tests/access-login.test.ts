import test from "node:test";
import assert from "node:assert/strict";
import { FieldApi, FieldError } from "../src/shared/api";

const identity = {
  companyId: "company-from-session", membershipId: "membership-from-session",
  userId: "user", role: "merchandiser", email: "field@example.com", timeZone: "America/Lima",
};

test("a fresh native installation logs in after web activation using credentials alone", async () => {
  const requests: {path: string; headers: Headers; body?: string}[] = [];
  const api = new FieldApi({web: false, apiUrl: "https://api.example.com", fetch: async (input, init) => {
    const path = new URL(String(input)).pathname;
    const headers = new Headers(init?.headers);
    requests.push({path, headers, body: init?.body?.toString()});
    if (path === "/v1/auth/login") return Response.json({token: "a".repeat(43), expiresAt: "2099-01-01T00:00:00Z"});
    assert.equal(headers.get("Authorization"), `Bearer ${"a".repeat(43)}`);
    if (path === "/v1/me") return Response.json(identity);
    if (path === "/v1/me/workday") return Response.json(null);
    if (path === "/v1/me/agenda") return Response.json({items: [], page: 1, pageSize: 100, total: 0});
    throw new Error("Unexpected request");
  }});
  await api.login(identity.email, "activated-password");
  const snapshot = await api.load();
  assert.equal(snapshot.session.companyId, identity.companyId);
  assert.equal(snapshot.session.membershipId, identity.membershipId);
  assert.equal(snapshot.session.role, "merchandiser");
  assert.deepEqual(JSON.parse(requests[0].body!), {email: identity.email, password: "activated-password"});
  assert.ok(requests.every(request => !request.headers.has("X-Tenant-Host")));
  assert.ok(requests.every(request => !request.path.includes("invitation")));
});

test("native login preserves an ambiguous-membership rejection without choosing a company", async () => {
  const api = new FieldApi({web: false, apiUrl: "https://api.example.com", fetch: async () => Response.json({code: "company_selection_required"}, {status: 409})});
  await assert.rejects(api.login(identity.email, "activated-password"), (error: unknown) => error instanceof FieldError && error.code === "company_selection_required" && error.status === 409);
});

test("a late native login response cannot restore a session after logout", async () => {
  let release!: () => void;
  const delayed = new Promise<void>(resolve => {release = resolve;});
  const api = new FieldApi({web: false, apiUrl: "https://api.example.com", fetch: async input => {
    if (String(input).endsWith("/auth/logout")) return Response.json({loggedOut: true});
    await delayed;
    return Response.json({token: "a".repeat(43), expiresAt: "2099-01-01T00:00:00Z"});
  }});
  const pending = api.login(identity.email, "activated-password");
  await api.logout();
  release();
  await assert.rejects(pending, /request_superseded/);
});
