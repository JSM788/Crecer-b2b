import { decryptInvitationToken } from "../src/modules/mail/token-cipher";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { createTestDatabase, migrate, provision } from "./support";
import { createApp } from "../src/app";
import { OperatorService } from "../src/modules/identity/services/operator.service";
import { CredentialsService } from "../src/modules/identity/services/credentials.service";

test("owner edits member details without replacing identity, credentials or history", async () => {
  const db = await createTestDatabase();
  let app: Awaited<ReturnType<typeof createApp>> | undefined;
  try {
    await migrate(db);
    const owner = await provision(
      db,
      "edit",
      "Edit company",
      "edit-owner@example.com",
      "edit-test-password",
    );
    await db.prisma.user.update({
      where: { id: owner.userId },
      data: { isPlatformOwner: true },
    });
    const operator = new OperatorService(db.prisma, new CredentialsService());
    const worker = await operator.addMember(
      owner.companyId,
      "edit-worker@example.com",
      "edit-test-password",
      "commercial",
    );
    const other = await provision(
      db,
      "other-edit",
      "Other company",
      "edit-other@example.com",
      "edit-test-password",
    );
    app = await createApp(
      db.prisma,
      false,
      [],
      [{ host: "edit.example", company: "edit" }],
    );
    await app.listen(0, "127.0.0.1");
    const url = await app.getUrl();
    const login = async (email: string, password = "edit-test-password") => {
      const r = await fetch(url + "/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Host": "edit.example",
        },
        body: JSON.stringify({ email, password }),
      });
      assert.equal(r.status, 200);
      return ((await r.json()) as { token: string }).token;
    };
    const token = await login("edit-owner@example.com");
    const workerToken = await login("edit-worker@example.com");
    const path = `/platform/companies/${owner.companyId}/members/${worker.membershipId}/details`;
    const input = {
      displayName: "Edited worker",
      phone: "+51999111222",
      email: "UPDATED@example.com",
      role: "merchandiser",
    };
    const post = (
      body: unknown,
      route = path,
      bearer = token,
      key = randomUUID(),
    ) =>
      fetch(url + "/v1" + route, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-Host": "edit.example",
          Authorization: `Bearer ${bearer}`,
          "Idempotency-Key": key,
        },
        body: JSON.stringify(body),
      });
    const snapshot = async () =>
      JSON.stringify(
        await Promise.all([
          db.prisma.user.findMany({ orderBy: { id: "asc" } }),
          db.prisma.membership.findMany({ orderBy: { id: "asc" } }),
          db.prisma.session.findMany({ orderBy: { tokenHash: "asc" } }),
          db.prisma.platformOperation.findMany(),
          db.prisma.platformAuditEntry.findMany(),
        ]),
      );
    for (const [body, route, bearer, status] of [
      [input, path, workerToken, 403],
      [
        input,
        `/platform/companies/${other.companyId}/members/${worker.membershipId}/details`,
        token,
        404,
      ],
      [{ ...input, email: "edit-other@example.com" }, path, token, 409],
      [{ ...input, password: "short" }, path, token, 400],
      [
        input,
        `/platform/companies/${owner.companyId}/members/${owner.membershipId}/details`,
        token,
        409,
      ],
    ] as const) {
      const before = await snapshot();
      assert.equal((await post(body, route, bearer)).status, status);
      assert.equal(await snapshot(), before);
    }
    const beforeUser = await db.prisma.user.findUniqueOrThrow({
      where: { id: worker.userId },
    });
    const key = randomUUID();
    const response = await post(input, path, token, key);
    assert.equal(response.status, 200);
    const updated = (await response.json()) as {
      id: string;
      userId: string;
      companyId: string;
      email: string;
      role: string;
    };
    assert.equal(updated.id, worker.membershipId);
    assert.equal(updated.userId, worker.userId);
    assert.equal(updated.companyId, owner.companyId);
    assert.equal(updated.email, "updated@example.com");
    assert.equal(updated.role, "merchandiser");
    assert.equal('password' in updated, false);
    assert.equal('passwordHash' in updated, false);
    const afterUser = await db.prisma.user.findUniqueOrThrow({
      where: { id: worker.userId },
    });
    assert.equal(afterUser.passwordHash, beforeUser.passwordHash);
    assert.equal(
      await db.prisma.session.count({
        where: { membershipId: worker.membershipId },
      }),
      0,
    );
    const after = await snapshot();
    assert.deepEqual(
      await (await post(input, path, token, key)).json(),
      updated,
    );
    assert.equal(await snapshot(), after);
    await login("updated@example.com");
    const customer = await db.prisma.customer.create({
      data: {
        companyId: owner.companyId,
        name: "Assigned",
        address: "Address",
      },
    });
    await db.prisma.customerAssignment.create({
      data: {
        companyId: owner.companyId,
        customerId: customer.id,
        membershipId: worker.membershipId,
      },
    });
    const beforeBlockedRole = await snapshot();
    const blockedRole = await post({
      ...input,
      email: updated.email,
      role: "manager",
    });
    assert.equal(blockedRole.status, 409);
    assert.equal(
      ((await blockedRole.json()) as { code: string }).code,
      "platform_role_in_use",
    );
    assert.equal(await snapshot(), beforeBlockedRole);
    await db.prisma.customerAssignment.deleteMany({
      where: { membershipId: worker.membershipId },
    });
    const visit = await operator.assignVisit({
      companyId: owner.companyId,
      membershipId: worker.membershipId,
      customerName: "Pending visit",
      customerAddress: "Address",
      scheduledAt: "2020-01-01T12:00:00Z",
    });
    await db.prisma.customerAssignment.deleteMany({
      where: { membershipId: worker.membershipId },
    });
    assert.equal(
      (await post({ ...input, email: updated.email, role: "manager" })).status,
      409,
    );
    // assignVisit also adds a customer assignment; remove it explicitly before changing roles.
    await db.prisma.customerAssignment.deleteMany({
      where: { membershipId: worker.membershipId },
    });
    const workday = await db.prisma.workday.create({
      data: {
        companyId: owner.companyId,
        membershipId: worker.membershipId,
        businessDate: new Date("2020-01-01"),
        status: "active",
      },
    });
    await db.prisma.visit.update({
      where: { id: visit.visitId },
      data: {
        status: "completed",
        result: "closed",
        workdayId: workday.id,
        arrivedAt: new Date(),
        endedAt: new Date(),
      },
    });
    assert.equal(
      (await post({ ...input, email: updated.email, role: "manager" })).status,
      409,
    );
    await db.prisma.workday.update({
      where: { id: workday.id },
      data: { status: "completed", endedAt: new Date() },
    });
    const managerResponse = await post({
      ...input,
      email: updated.email,
      role: "manager",
    });
    assert.equal(managerResponse.status, 200);
    const membership = await db.prisma.membership.findUniqueOrThrow({
      where: { id: worker.membershipId },
    });
    assert.equal(membership.canManageCustomers, true);
    assert.equal(membership.canManageFieldOperations, true);
    assert.equal(
      await db.prisma.visit.count({
        where: { id: visit.visitId, status: "completed" },
      }),
      1,
    );
    const resetKey = randomUUID();
    const passwordInput = {
      ...input,
      email: updated.email,
      role: "manager",
      password: "updated-test-password",
    };
    await db.prisma.user.update({
      where: { id: worker.userId },
      data: { failures: 4, blockedUntil: new Date(Date.now() + 60000) },
    });
    const resetResponse = await post(passwordInput, path, token, resetKey);
    assert.equal(resetResponse.status, 200);
    const resetMember = await resetResponse.json();
    assert.ok(!JSON.stringify(resetMember).includes("password"));
    const resetUser = await db.prisma.user.findUniqueOrThrow({
      where: { id: worker.userId },
    });
    assert.notEqual(resetUser.passwordHash, beforeUser.passwordHash);
    assert.equal(resetUser.failures, 0);
    assert.equal(resetUser.blockedUntil, null);
    assert.equal(
      await db.prisma.session.count({
        where: { membershipId: worker.membershipId },
      }),
      0,
    );
    assert.deepEqual(
      await (await post(passwordInput, path, token, resetKey)).json(),
      resetMember,
    );
    const beforeBadReplay = await snapshot();
    assert.equal(
      (
        await post(
          { ...passwordInput, password: "different-test-password" },
          path,
          token,
          resetKey,
        )
      ).status,
      409,
    );
    assert.equal(await snapshot(), beforeBadReplay);
    const oldPasswordResponse = await fetch(url + "/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Host": "edit.example",
      },
      body: JSON.stringify({
        email: updated.email,
        password: "edit-test-password",
      }),
    });
    assert.equal(oldPasswordResponse.status, 401);
    await login(updated.email, passwordInput.password);
    const receipts = await db.prisma.platformOperation.findMany();
    assert.ok(!JSON.stringify(receipts).includes(passwordInput.password));
    await db.prisma.company.update({
      where: { id: owner.companyId },
      data: { status: "suspended" },
    });
    const beforeSuspended = await snapshot();
    assert.equal(
      (await post({ ...input, email: updated.email, role: "manager" })).status,
      409,
    );
    assert.equal(await snapshot(), beforeSuspended);
  } finally {
    if (app) await app.close();
    await db.close();
  }
});

test("operator assignment accepts field roles and rejects web managers without changing stored data", async () => {
  const db = await createTestDatabase();
  try {
    await migrate(db);
    const operator = new OperatorService(db.prisma, new CredentialsService());
    const commercial = await provision(
      db,
      "operator",
      "Operator",
      "operator@example.com",
      "operator-test-password",
    );
    const merchandiser = await operator.addMember(
      commercial.companyId,
      "operator-merch@example.com",
      "operator-test-password",
      "merchandiser",
    );
    const manager = await operator.addMember(
      commercial.companyId,
      "operator-manager@example.com",
      "operator-test-password",
      "manager",
    );
    const assignment = (membershipId: string) =>
      operator.assignVisit({
        companyId: commercial.companyId,
        membershipId,
        customerName: "Operator test customer",
        customerAddress: "Test address",
        scheduledAt: "2020-01-01T15:00:00Z",
      });
    for (const member of [commercial, merchandiser]) {
      const assigned = await assignment(member.membershipId);
      const [visit] = await db.query(
        "SELECT membership_id FROM visits WHERE id=$1",
        [assigned.visitId],
      );
      assert.equal(visit.membership_id, member.membershipId);
    }
    const snapshot = async () => {
      const tables = await db.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema=$1 AND table_type='BASE TABLE' ORDER BY table_name",
        [db.schema],
      );
      const state: unknown[] = [];
      for (const { table_name } of tables) {
        assert.match(table_name, /^[a-z_]+$/);
        const rows = await db.query(
          `SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text),'[]'::jsonb) AS data FROM "${table_name}" t`,
        );
        state.push([table_name, rows[0].data]);
      }
      return createHash("sha256").update(JSON.stringify(state)).digest("hex");
    };
    const before = await snapshot();
    await assert.rejects(
      assignment(manager.membershipId),
      /Active company membership not found/,
    );
    assert.equal(await snapshot(), before);
  } finally {
    await db.close();
  }
});

test("only the global owner creates companies and role-bound users with preserved credentials and idempotency", async () => {
  const originalEnv = { ...process.env };
  Object.assign(process.env, { MAIL_ENABLED: 'true', SMTP_HOST: '127.0.0.1', SMTP_PORT: '1', SMTP_REQUIRE_TLS: 'false', SMTP_SECURE: 'false', SMTP_FROM: 'app@example.com', WEB_PUBLIC_URL: 'http://localhost:3001', MAIL_ENCRYPTION_KEY: Buffer.alloc(32, 9).toString('base64') });
  delete process.env.SMTP_USER; delete process.env.SMTP_PASSWORD;
  const db = await createTestDatabase();
  let app: Awaited<ReturnType<typeof createApp>> | undefined;
  try {
    await migrate(db);
    const owner = await provision(
      db,
      "platform",
      "Platform",
      "owner@example.com",
      "platform-test-password",
    );
    app = await createApp(
      db.prisma,
      false,
      [],
      [{ host: "platform.example", company: "platform" }],
    );
    await app.listen(0, "127.0.0.1");
    const url = await app.getUrl();
    const login = async (
      email: string,
      password: string,
      host = "platform.example",
    ) => {
      const response = await fetch(url + "/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Tenant-Host": host },
        body: JSON.stringify({ email, password }),
      });
      assert.equal(response.status, 200);
      return ((await response.json()) as { token: string }).token;
    };
    let token = await login("owner@example.com", "platform-test-password");
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Tenant-Host": "platform.example",
    };
    const get = (path: string, extra = headers) =>
      fetch(url + "/v1" + path, { headers: extra });
    const post = (
      path: string,
      body: unknown,
      key = randomUUID(),
      extra = headers,
    ) =>
      fetch(url + "/v1" + path, {
        method: "POST",
        headers: { ...extra, "Idempotency-Key": key },
        body: JSON.stringify(body),
      });
    assert.equal((await get("/platform/companies")).status, 403);
    const [before] = await db.query(
      "SELECT password_hash FROM users WHERE id=$1",
      [owner.userId],
    );
    await db.query("UPDATE users SET is_platform_owner=true WHERE id=$1", [
      owner.userId,
    ]);
    assert.equal((await get("/me")).status, 401);
    token = await login("owner@example.com", "platform-test-password");
    headers.Authorization = `Bearer ${token}`;
    const me = (await (await get("/me")).json()) as {
      permissions: string[];
      scope: string;
      companyId: string | null;
      membershipId: string | null;
      role: string;
      timeZone: string | null;
    };
    assert.equal(me.scope, "platform");
    assert.equal(me.role, "platform_owner");
    assert.equal(me.companyId, null);
    assert.equal(me.membershipId, null);
    assert.equal(me.timeZone, null);
    assert.ok(me.permissions.includes("manage_platform"));
    assert.equal((await get("/customers")).status, 403);
    assert.equal((await get("/field-operations/members")).status, 403);
    assert.equal((await get("/team/members")).status, 403);
    const companyInput = {
      name: "New company",
      manager: { displayName: "Initial manager", email: "initial-manager@new.example", phone: "+51999111223" },
      timeZone: "America/Lima",
      hostname: "new-company.example",
    };
    const companyKey = randomUUID();
    const created = await post("/platform/companies", companyInput, companyKey);
    assert.equal(created.status, 200);
    const company = (await created.json()) as {
      id: string;
      status: string;
      suspendedAt: string | null;
    };
    assert.equal(company.status, "active");
    assert.equal(company.suspendedAt, null);
    assert.deepEqual(
      await (
        await post("/platform/companies", companyInput, companyKey)
      ).json(),
      company,
    );
    assert.equal(
      (
        await post("/platform/companies", {
          ...companyInput,
          hostname: "platform.example",
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await post("/platform/companies", {
          ...companyInput,
          hostname: "inject.example",
          isPlatformOwner: true,
        })
      ).status,
      400,
    );
    const members = "/platform/companies/" + company.id + "/members";
    const createdMembers: {
      id: string;
      userId: string;
      role: string;
      email: string;
    }[] = [];
    for (const role of ["commercial", "merchandiser", "manager"]) {
      const input = {
        displayName: role + " User",
        phone: "+51999111224",
        email: role + "@new.example",
        role,
      };
      const key = randomUUID();
      const response = await post(members, input, key);
      assert.equal(response.status, 200);
      const member = (await response.json()) as (typeof createdMembers)[number];
      createdMembers.push(member);
      assert.equal(member.role, role);
      assert.ok(!JSON.stringify(member).includes("password"));
      assert.deepEqual(await (await post(members, input, key)).json(), member);
      assert.equal(
        (await post(members, { ...input, password: "different-password" }, key))
          .status,
        400,
      );
      assert.equal(
        (
          await post(members, {
            ...input,
            email: "injected-" + role + "@new.example",
            isPlatformOwner: true,
          })
        ).status,
        400,
      );
      const invitation = await db.prisma.invitation.findFirstOrThrow({ where: { membershipId: member.id, revokedAt: null } });
      const invitationToken = decryptInvitationToken(invitation.tokenCiphertext!, process.env.MAIL_ENCRYPTION_KEY!);
      const activated = await fetch(url + '/v1/invitations/' + invitationToken + '/accept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'new-user-password' }) });
      assert.equal(activated.status, 200);
    }
    const manager = createdMembers.find((member) => member.role === "manager")!;
    const managerToken = await login(
      manager.email,
      "new-user-password",
      companyInput.hostname,
    );
    const managerHeaders = {
      ...headers,
      Authorization: `Bearer ${managerToken}`,
      "X-Tenant-Host": companyInput.hostname,
    };
    const team = (await (
      await get("/team/members", managerHeaders)
    ).json()) as { items: { companyId: string }[] };
    assert.equal(team.items.length, 4);
    assert.ok(team.items.every((member) => member.companyId === company.id));
    assert.ok(!JSON.stringify(team).includes("isPlatformOwner"));
    assert.equal(
      (await get("/team/members?companyId=" + owner.companyId, managerHeaders))
        .status,
      400,
    );
    assert.equal(
      (await get("/platform/companies", managerHeaders)).status,
      403,
    );
    const targets = (await (
      await get("/field-operations/members", managerHeaders)
    ).json()) as { items: { role: string }[] };
    assert.equal(targets.items.length, 2);
    assert.ok(targets.items.every((member) => member.role !== "manager"));
    assert.equal(
      (await post("/me/workdays/start", {}, randomUUID(), managerHeaders))
        .status,
      403,
    );
    const field = createdMembers.find(
      (member) => member.role === "commercial",
    )!;
    const fieldToken = await login(
      field.email,
      "new-user-password",
      companyInput.hostname,
    );
    const fieldHeaders = {
      ...managerHeaders,
      Authorization: `Bearer ${fieldToken}`,
    };
    assert.equal((await get("/team/members", fieldHeaders)).status, 403);
    assert.equal((await get("/platform/companies", fieldHeaders)).status, 403);
    assert.equal(
      (
        await get("/me", {
          ...fieldHeaders,
          "X-Tenant-Host": "platform.example",
        })
      ).status,
      401,
    );
    assert.equal(
      (await post(members + "/" + field.id + "/status", { active: false }))
        .status,
      200,
    );
    assert.equal((await get("/me", fieldHeaders)).status, 401);
    const companies = (await (await get("/platform/companies")).json()) as { items: {
      id: string;
      activeUserCount: number;
      totalUserCount: number;
    }[] };
    assert.deepEqual(
      companies.items
        .filter((row) => row.id === company.id)
        .map((row) => [row.activeUserCount, row.totalUserCount]),
      [[3, 4]],
    );
    const companyStatusPath = "/platform/companies/" + company.id + "/status";
    const suspensionKey = randomUUID();
    const suspendedResponse = await post(
      companyStatusPath,
      { status: "suspended" },
      suspensionKey,
    );
    assert.equal(suspendedResponse.status, 200);
    const suspended = (await suspendedResponse.json()) as {
      status: string;
      suspendedAt: string | null;
      activeUserCount: number;
    };
    assert.equal(suspended.status, "suspended");
    assert.ok(suspended.suspendedAt);
    assert.equal(suspended.activeUserCount, 0);
    assert.deepEqual(
      await (
        await post(companyStatusPath, { status: "suspended" }, suspensionKey)
      ).json(),
      suspended,
    );
    assert.equal((await get("/me", managerHeaders)).status, 401);
    assert.equal((await get("/me")).status, 200);
    assert.equal(
      (
        await fetch(url + "/v1/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Tenant-Host": companyInput.hostname,
          },
          body: JSON.stringify({
            email: manager.email,
            password: "new-user-password",
          }),
        })
      ).status,
      401,
    );
    assert.equal(
      (await post(members + "/" + manager.id + "/status", { active: false }))
        .status,
      409,
    );
    const resumed = await post(companyStatusPath, { status: "active" });
    assert.equal(resumed.status, 200);
    const resumedCompany = (await resumed.json()) as {
      status: string;
      suspendedAt: string | null;
      activeUserCount: number;
    };
    assert.equal(resumedCompany.status, "active");
    assert.equal(resumedCompany.suspendedAt, null);
    assert.equal(resumedCompany.activeUserCount, 3);
    assert.equal((await get("/me", managerHeaders)).status, 401);
    await login(manager.email, "new-user-password", companyInput.hostname);
    assert.equal(
      (
        await fetch(url + "/v1/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Tenant-Host": companyInput.hostname,
          },
          body: JSON.stringify({
            email: field.email,
            password: "new-user-password",
          }),
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await post(
          "/platform/companies/" +
            owner.companyId +
            "/members/" +
            owner.membershipId +
            "/status",
          { active: false },
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await post("/platform/companies/" + owner.companyId + "/status", {
          status: "suspended",
        })
      ).status,
      200,
    );
    assert.equal((await get("/me")).status, 200);
    assert.equal((await get("/platform/companies")).status, 200);
    assert.equal(
      (
        await post("/platform/companies/" + owner.companyId + "/status", {
          status: "active",
        })
      ).status,
      200,
    );
    const [after] = await db.query(
      "SELECT password_hash FROM users WHERE id=$1",
      [owner.userId],
    );
    assert.equal(after.password_hash, before.password_hash);
    const [user] = await db.query(
      "SELECT is_platform_owner FROM users WHERE id=$1",
      [manager.userId],
    );
    assert.equal(user.is_platform_owner, false);
    const [audit] = await db.query(
      "SELECT count(*)::integer AS count FROM platform_audit_log",
    );
    assert.equal(audit.count, 9);
    const receipts = await db.query(
      "SELECT fingerprint,response FROM platform_operations",
    );
    assert.ok(
      receipts.every(
        (row) => !JSON.stringify(row).includes("new-user-password"),
      ),
    );
    await db.query("UPDATE users SET is_platform_owner=false WHERE id=$1", [
      owner.userId,
    ]);
    assert.equal((await get("/platform/companies")).status, 401);
    assert.equal(
      (await post("/platform/companies", companyInput, companyKey)).status,
      401,
    );
  } finally {
    if (app) await app.close();
    await db.close();
    for (const name of Object.keys(process.env)) if (!(name in originalEnv)) delete process.env[name];
    Object.assign(process.env, originalEnv);
  }
});
