import test from "node:test";
import assert from "node:assert/strict";
import { FieldApi, FieldError } from "../src/shared/api";
import { guard, validateAttachment } from "../src/modules/visits/domain/field";
import type { Command } from "../src/modules/visits/domain/field";

test("native LAN HTTP is allowed only for development and private IPv4 hosts", () => {
  for (const apiUrl of [
    "http://192.168.100.2:3002",
    "http://10.0.0.2:3002",
    "http://172.16.1.2:3002",
  ]) {
    assert.doesNotThrow(
      () =>
        new FieldApi({
          web: false,
          apiUrl,
          development: true,
        }),
    );
    assert.throws(
      () =>
        new FieldApi({
          web: false,
          apiUrl,
          development: false,
        }),
      /configuration_error/,
    );
  }
  for (const apiUrl of [
    "http://example.com",
    "http://8.8.8.8",
    "http://172.32.0.1",
    "http://192.168.100.2/path",
  ]) {
    assert.throws(
      () =>
        new FieldApi({
          web: false,
          apiUrl,
          development: true,
        }),
      /configuration_error/,
    );
  }
  assert.doesNotThrow(
    () =>
      new FieldApi({
        web: false,
        apiUrl: "https://api.example.com",
      }),
  );
  assert.doesNotThrow(
    () =>
      new FieldApi({
        web: false,
        apiUrl: "http://127.0.0.1:3002",
      }),
  );
});

test("company managers receive a web-only message before field data is requested", async () => {
  const requests: string[] = [];
  const api = new FieldApi({
    web: true,
    fetch: async (url) => {
      requests.push(String(url));
      return new Response(
        JSON.stringify({
          companyId: "company",
          membershipId: "manager",
          userId: "user",
          role: "manager",
          email: "manager@example.com",
          timeZone: "America/Lima",
        }),
      );
    },
  });
  await assert.rejects(
    api.load(),
    (error: unknown) =>
      error instanceof FieldError && error.code === "web_access_only",
  );
  assert.deepEqual(requests, ["/api/field/me/"]);
});

test("visit closure sends audit with the same uncertain operation and restores persisted audit", async () => {
  const audit = {
    hasShelfStock: false,
    noStockReason: "Producto agotado",
    brandDisplay: "inadequate",
    pricesVisible: false,
  };
  const bodies: unknown[] = [];
  const keys: string[] = [];
  const api = new FieldApi({
    web: true,
    fetch: async (_url, init) => {
      bodies.push(JSON.parse(String(init?.body)));
      keys.push(new Headers(init?.headers).get("Idempotency-Key")!);
      if (bodies.length === 1) throw new TypeError("disconnected");
      return new Response(
        JSON.stringify({
          id: "visit",
          status: "completed",
          result: "attended",
          arrived_at: "2026-10-29T17:00:00Z",
          ended_at: "2026-10-29T18:00:00Z",
        }),
      );
    },
  });
  const command = {
    type: "FINISH_VISIT",
    visitId: "visit",
    result: "attended",
    observations: " Audit ",
    audit,
    attachment: { mimeType: "image/png", base64: "YQ==" },
  } as Command;
  await assert.rejects(api.command(command), /network_error/);
  await api.command(command);
  assert.deepEqual((bodies[0] as Record<string, unknown>).audit, audit);
  assert.deepEqual(bodies[0], bodies[1]);
  assert.equal(keys[0], keys[1]);
  const data: Record<string, unknown> = {
    "/api/field/me/": {
      companyId: "company",
      membershipId: "member",
      userId: "user",
      role: "merchandiser",
      email: "field@example.com",
      timeZone: "America/Lima",
    },
    "/api/field/me/customers/": [],
    "/api/field/me/workday/": null,
    "/api/field/me/agenda/": [
      {
        id: "visit",
        company_id: "company",
        membership_id: "member",
        customer_id: "customer",
        customer_name: "Customer",
        customer_address: "Address",
        scheduled_at: "2026-10-29T14:00:00Z",
        workday_id: null,
        status: "completed",
        arrived_at: null,
        ended_at: null,
        result: "attended",
        observations: "",
        audit,
      },
    ],
  };
  const reader = new FieldApi({
    web: true,
    fetch: async (url) => new Response(JSON.stringify(data[String(url)])),
  });
  const saved = (await reader.load()).visits[0] as unknown as Record<
    string,
    unknown
  >;
  assert.deepEqual(saved.audit, audit);
  (data["/api/field/me/agenda/"] as Record<string, unknown>[])[0].audit = {
    ...audit,
    pricesVisible: "false",
  };
  await assert.rejects(reader.load(), /invalid_response/);
});

test("uncertain commands retain their exact key, confirmed success releases it before hydration", async () => {
  const keys: string[] = [];
  let count = 0;
  const api = new FieldApi({
    web: true,
    fetch: async (_url, init) => {
      keys.push((init?.headers as Record<string, string>)["Idempotency-Key"]);
      if (++count === 1) throw new TypeError("disconnected");
      return new Response(
        JSON.stringify({
          id: "workday",
          status: "active",
          started_at: "2026-10-24T13:00:00Z",
        }),
      );
    },
  });
  await assert.rejects(api.command({ type: "START_WORKDAY" }), /network_error/);
  await api.command({ type: "START_WORKDAY" });
  await api.command({ type: "START_WORKDAY" });
  assert.equal(keys[0], keys[1]);
  assert.notEqual(keys[1], keys[2]);
});

test("restored session maps actual records and evidence without fixtures or cached state", async () => {
  const session = {
    companyId: "company",
    membershipId: "member",
    userId: "user",
    role: "commercial",
    email: "field@example.com",
    timeZone: "America/Lima",
  };
  const visit = {
    id: "visit",
    company_id: "company",
    membership_id: "member",
    customer_id: "customer",
    customer_name: "Actual account",
    customer_address: "Actual address",
    scheduled_at: "2026-10-24T14:00:00Z",
    workday_id: "day",
    status: "completed",
    arrived_at: "2026-10-24T14:10:00Z",
    ended_at: "2026-10-24T14:30:00Z",
    result: "closed",
    observations: "Real note",
  };
  const data: Record<string, unknown> = {
    "/api/field/me/": session,
    "/api/field/me/customers/": [
      { id: "customer", name: "Actual account", address: "Actual address" },
    ],
    "/api/field/me/agenda/": [visit],
    "/api/field/me/workday/": {
      id: "day",
      company_id: "company",
      membership_id: "member",
      business_date: "2026-10-24",
      status: "completed",
      started_at: "2026-10-24T13:00:00Z",
      ended_at: "2026-10-24T15:00:00Z",
    },
    "/api/field/me/visits/visit/evidence/": {
      mimeType: "image/png",
      base64: "YQ==",
    },
  };
  const api = new FieldApi({
    web: true,
    fetch: async (url) => new Response(JSON.stringify(data[String(url)])),
  });
  const snapshot = await api.load(new Date("2026-10-24T23:30:00Z"));
  assert.equal(snapshot.visits[0].customerName, "Actual account");
  assert.equal(snapshot.visits[0].result, "closed");
  assert.equal(snapshot.visits[0].observations, "Real note");
  assert.equal(snapshot.workday.status, "completed");
  assert.deepEqual(await api.evidence("visit"), {
    mimeType: "image/png",
    base64: "YQ==",
  });
  data["/api/field/me/workday/"] = null;
  assert.equal((await api.load()).workday.status, "not-started");
  data["/api/field/me/agenda/"] = [{ ...visit, membership_id: "other" }];
  await assert.rejects(api.load(), /invalid_response/);
});

test("only a completed prior business date reopens the mobile start state", async () => {
  const session = {
    companyId: "company",
    membershipId: "member",
    userId: "user",
    role: "commercial",
    email: "field@example.com",
    timeZone: "America/Lima",
  };
  const visit = {
    id: "visit",
    company_id: "company",
    membership_id: "member",
    customer_id: "customer",
    customer_name: "Actual account",
    customer_address: "Actual address",
    scheduled_at: "2026-10-24T14:00:00Z",
    workday_id: "day",
    status: "completed",
    arrived_at: "2026-10-24T14:10:00Z",
    ended_at: "2026-10-24T14:30:00Z",
    result: "closed",
    observations: "Historical note",
  };
  const day = {
    id: "day",
    company_id: "company",
    membership_id: "member",
    business_date: "2026-10-24",
    status: "completed",
    started_at: "2026-10-24T13:00:00Z",
    ended_at: "2026-10-24T15:00:00Z" as string | null,
  };
  const data: Record<string, unknown> = {
    "/api/field/me/": session,
    "/api/field/me/customers/": [],
    "/api/field/me/agenda/": [visit],
    "/api/field/me/workday/": day,
  };
  const api = new FieldApi({
    web: true,
    fetch: async (url) => new Response(JSON.stringify(data[String(url)])),
  });
  const sameDay = await api.load(new Date("2026-10-25T03:30:00Z"));
  assert.equal(
    sameDay.workday.status,
    "completed",
    "UTC tomorrow remains today in Lima",
  );
  assert.throws(
    () => guard(sameDay, { type: "START_WORKDAY" }),
    /workday_already_started/,
  );
  const tomorrow = await api.load(new Date("2026-10-25T05:01:00Z"));
  assert.deepEqual(tomorrow.workday, { status: "not-started" });
  assert.doesNotThrow(() => guard(tomorrow, { type: "START_WORKDAY" }));
  assert.deepEqual(
    tomorrow.visits,
    sameDay.visits,
    "Historical visit records remain available",
  );
  day.status = "active";
  day.ended_at = null;
  const historicalActive = await api.load(new Date("2026-10-25T05:01:00Z"));
  assert.equal(historicalActive.workday.status, "active");
  assert.equal(historicalActive.workday.id, "day");
  assert.throws(
    () => guard(historicalActive, { type: "START_WORKDAY" }),
    /workday_already_started/,
  );
});

test("default browser transport invokes global fetch with the browser receiver", async () => {
  const original = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async function (this: unknown) {
    assert.equal(
      this,
      globalThis,
      "Browser fetch requires its global receiver",
    );
    requests++;
    return new Response("null");
  };
  try {
    assert.equal(await new FieldApi({ web: true }).evidence("visit"), null);
    assert.equal(requests, 1);
  } finally {
    globalThis.fetch = original;
  }
});

test("uncertain payload cannot change; definitive rejection releases its key", async () => {
  const keys: string[] = [];
  let status = 503;
  const api = new FieldApi({
    web: true,
    fetch: async (_url, init) => {
      keys.push((init?.headers as Record<string, string>)["Idempotency-Key"]);
      return new Response(JSON.stringify({ code: "conflict" }), { status });
    },
  });
  await assert.rejects(api.command({ type: "START_WORKDAY" }), /conflict/);
  await assert.rejects(
    api.command({ type: "END_WORKDAY" }),
    /uncertain_action_pending/,
  );
  assert.equal(keys.length, 1);
  status = 409;
  await assert.rejects(api.command({ type: "START_WORKDAY" }), /conflict/);
  assert.equal(keys[0], keys[1]);
  await assert.rejects(api.command({ type: "START_WORKDAY" }), /conflict/);
  assert.notEqual(keys[1], keys[2]);
});

test("hydration uses uncached real endpoints and rejects malformed or unauthenticated data", async () => {
  const calls: string[] = [];
  const api = new FieldApi({
    web: true,
    fetch: async (url, init) => {
      calls.push(String(url));
      assert.equal(init?.cache, "no-store");
      return new Response(JSON.stringify({}));
    },
  });
  await assert.rejects(api.load(), /invalid_response/);
  assert.deepEqual(calls, ["/api/field/me/"]);
  const expired = new FieldApi({
    web: true,
    fetch: async () =>
      new Response('{"error":{"code":"unauthorized"}}', { status: 401 }),
  });
  await assert.rejects(expired.load(), /authentication_required/);
});

test("native configuration refuses missing or invalid origins; attachments are bounded", () => {
  assert.throws(() => new FieldApi({ web: false }), /configuration_error/);
  assert.throws(
    () =>
      new FieldApi({
        web: false,
        apiUrl: "https://api.example/path",
      }),
    /configuration_error/,
  );
  assert.throws(
    () =>
      validateAttachment({
        mimeType: "image/jpeg",
        base64: "A".repeat(1398104),
      }),
    /attachment_too_large/,
  );
  assert.throws(
    () => validateAttachment({ mimeType: "text/html", base64: "YQ==" }),
    /invalid_attachment/,
  );
  assert.throws(
    () => guard(undefined, { type: "START_WORKDAY" }),
    /authentication_required/,
  );
});

test("login sends only credentials and native tokens never survive a new client", async () => {
  const calls: { url: string; body?: string | null; headers?: HeadersInit }[] =
    [];
  const fetcher: typeof fetch = async (url, init) => {
    calls.push({
      url: String(url),
      body: init?.body as string | undefined,
      headers: init?.headers,
    });
    return new Response(
      JSON.stringify(
        String(url).includes("login")
          ? { token: "a".repeat(43), expiresAt: "2036-10-24T13:00:00Z" }
          : null,
      ),
    );
  };
  const options = {
    web: false,
    apiUrl: "https://api.example",
    fetch: fetcher,
  };
  const native = new FieldApi(options);
  await native.login(" field@example.com ", "correct password");
  await native.evidence("visit");
  await new FieldApi(options).evidence("visit");
  assert.deepEqual(JSON.parse(calls[0].body!), {
    email: "field@example.com",
    password: "correct password",
  });
  assert.equal(calls[0].url, "https://api.example/v1/auth/login");
  assert.equal(
    new Headers(calls[1].headers).get("authorization"),
    `Bearer ${"a".repeat(43)}`,
  );
  assert.equal(
    new Headers(calls[1].headers).get("x-tenant-host"),
    null,
  );
  assert.equal(new Headers(calls[2].headers).get("authorization"), null);
});
