import test from "node:test";
import assert from "node:assert/strict";
import { FieldApi } from "../src/shared/api";

const identity = {
  companyId: "company", membershipId: "member", userId: "user",
  role: "commercial", email: "field@example.com", timeZone: "America/Lima",
};
const rawVisit = (id: string) => ({
  id, company_id: "company", membership_id: "member", customer_id: "customer",
  customer_name: "Cliente", customer_address: "Dirección", scheduled_at: "2026-11-02T14:00:00Z",
  workday_id: null, status: "pending", arrived_at: null, ended_at: null,
  result: null, observations: null, planned_role: "commercial", execution_role: null,
});

test("snapshot deduplicates hydration and loads additional agenda pages only when requested", async () => {
  const requests: string[] = [];
  const api = new FieldApi({web: true, fetch: async (input) => {
    const url = new URL(String(input), "https://web.example");
    requests.push(url.pathname + url.search);
    let value: unknown;
    if (url.pathname === "/api/field/me/") value = identity;
    else if (url.pathname === "/api/field/me/workday/") value = null;
    else if (url.pathname === "/api/field/me/agenda/") {
      const page = Number(url.searchParams.get("page"));
      value = {items: Array.from({length: page === 1 ? 100 : 1}, (_, i) => rawVisit(String((page - 1) * 100 + i))), page, pageSize: 100, total: 101};
    } else throw new Error("Unexpected request " + url);
    return new Response(JSON.stringify(value));
  }});
  const [first, second] = await Promise.all([api.load(), api.load()]);
  assert.equal(first, second);
  assert.equal(first.visits.length, 100);
  assert.equal(first.agendaPage?.total, 101);
  assert.deepEqual(first.customers, [{id: "customer", name: "Cliente", address: "Dirección"}]);
  assert.equal(requests.length, 3);
  const [more, sameMore] = await Promise.all([api.loadMore(), api.loadMore()]);
  assert.equal(more, sameMore);
  assert.equal(more.visits.length, 101);
  assert.equal(requests.length, 4);
  assert.equal(requests.some(path => path.includes("customers")), false);
});

test("late snapshot cannot restore a session after logout", async () => {
  let release!: () => void;
  const delayed = new Promise<void>(resolve => { release = resolve; });
  const api = new FieldApi({web: true, fetch: async (input) => {
    const url = String(input);
    if (url.includes("logout")) return new Response("{}");
    await delayed;
    return new Response(JSON.stringify(identity));
  }});
  const pending = api.load();
  await api.logout();
  release();
  await assert.rejects(pending, /request_superseded/);
});

test("cancelled visits do not block workday closure and execution role governs audits", async () => {
  const {guard, dueVisits} = await import("../src/modules/visits/domain/field");
  const snapshot = {
    session: identity, customers: [], workday: {id: "day", status: "active"},
    visits: [{id: "cancelled", customerId: "customer", customerName: "Cliente", customerAddress: "Dirección", scheduledAt: "2026-11-02T14:00:00Z", status: "cancelled"}],
  } as Parameters<typeof guard>[0] & {};
  assert.equal(dueVisits(snapshot).length, 0);
  assert.doesNotThrow(() => guard(snapshot, {type: "END_WORKDAY"}));
});
