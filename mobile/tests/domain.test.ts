import assert from "node:assert/strict";
import test from "node:test";
import {
  guard,
  type Snapshot,
  type Command,
} from "../src/modules/visits/domain/field";
const state: Snapshot = {
  session: {
    companyId: "company",
    membershipId: "member",
    userId: "user",
    role: "commercial",
    email: "field@example.com",
    timeZone: "America/Lima",
  },
  customers: [],
  workday: { status: "active" },
  visits: [
    {
      id: "visit",
      customerId: "customer",
      customerName: "Assigned customer",
      customerAddress: "Address",
      scheduledAt: "2026-10-24T14:00:00Z",
      status: "pending",
    },
  ],
};
function rejects(snapshot: Snapshot, command: Command, error: string) {
  const before = structuredClone(snapshot);
  assert.throws(() => guard(snapshot, command), new RegExp(error));
  assert.deepEqual(
    snapshot,
    before,
    "Rejected actions preserve server snapshot",
  );
}
test("arrival guards active workday, pending visit and single active visit", () => {
  rejects(
    { ...state, workday: { status: "not-started" } },
    { type: "ARRIVE", visitId: "visit" },
    "active_workday_required",
  );
  rejects(state, { type: "ARRIVE", visitId: "unknown" }, "visit_not_found");
  const active = {
    ...state,
    visits: [{ ...state.visits[0], status: "active" as const }],
  };
  rejects(active, { type: "ARRIVE", visitId: "visit" }, "visit_not_pending");
  rejects(
    {
      ...state,
      visits: [
        ...state.visits,
        { ...state.visits[0], id: "other", status: "active" },
      ],
    },
    { type: "ARRIVE", visitId: "visit" },
    "another_visit_active",
  );
  assert.doesNotThrow(() => guard(state, { type: "ARRIVE", visitId: "visit" }));
});
test("closure requires arrival, valid outcome and completed planned visits", () => {
  rejects(
    state,
    {
      type: "FINISH_VISIT",
      visitId: "visit",
      result: "attended",
      observations: "",
    },
    "active_visit_required",
  );
  const active = {
    ...state,
    visits: [{ ...state.visits[0], status: "active" as const }],
  };
  rejects(
    active,
    { type: "FINISH_VISIT", visitId: "visit", observations: "" },
    "visit_result_required",
  );
  for (const result of ["attended", "closed", "unavailable"] as const)
    assert.doesNotThrow(() =>
      guard(active, {
        type: "FINISH_VISIT",
        visitId: "visit",
        result,
        observations: "",
      }),
    );
  rejects(state, { type: "END_WORKDAY" }, "visits_remaining");
  assert.doesNotThrow(() =>
    guard(
      { ...state, visits: [{ ...state.visits[0], status: "completed" }] },
      { type: "END_WORKDAY" },
    ),
  );
  rejects(state, { type: "START_WORKDAY" }, "workday_already_started");
});

test("day closure includes overdue work but excludes tomorrow's pending visits in company timezone", () => {
  const now = new Date("2026-10-24T23:30:00Z");
  const future = {
    ...state.visits[0],
    id: "future",
    scheduledAt: "2026-10-25T14:00:00Z",
  };
  const overdue = {
    ...state.visits[0],
    id: "overdue",
    scheduledAt: "2026-10-23T14:00:00Z",
  };
  assert.doesNotThrow(() =>
    guard({ ...state, visits: [future] }, { type: "END_WORKDAY" }, now),
  );
  assert.throws(
    () =>
      guard(
        { ...state, visits: [future, overdue] },
        { type: "END_WORKDAY" },
        now,
      ),
    /visits_remaining/,
  );
  assert.throws(
    () =>
      guard(
        { ...state, visits: [future] },
        { type: "ARRIVE", visitId: "future" },
        now,
      ),
    /visit_scheduled_in_future/,
  );
});

test("merchandiser attended closure requires an exhibition audit and photograph without changing commercial closure", () => {
  const merchandiser: Snapshot = {
    ...state,
    session: { ...state.session, role: "merchandiser" },
    visits: [{ ...state.visits[0], status: "active" }],
  };
  const close = {
    type: "FINISH_VISIT" as const,
    visitId: "visit",
    result: "attended" as const,
    observations: "",
  };
  const audit = {
    hasShelfStock: false,
    noStockReason: "Producto agotado",
    brandDisplay: "adequate" as const,
    pricesVisible: true,
  };
  const attachment = { mimeType: "image/png" as const, base64: "YQ==" };
  rejects(merchandiser, close, "audit_required");
  rejects(merchandiser, { ...close, audit } as Command, "audit_photo_required");
  rejects(
    merchandiser,
    {
      ...close,
      audit: { ...audit, noStockReason: " " },
      attachment,
    } as Command,
    "invalid_audit",
  );
  rejects(
    merchandiser,
    {
      ...close,
      audit: { ...audit, noStockReason: "x".repeat(1001) },
      attachment,
    } as Command,
    "invalid_audit",
  );
  rejects(
    merchandiser,
    {
      ...close,
      audit: { ...audit, pricesVisible: undefined },
      attachment,
    } as unknown as Command,
    "invalid_audit",
  );
  assert.doesNotThrow(() =>
    guard(merchandiser, { ...close, audit, attachment } as Command),
  );
  for (const result of ["closed", "unavailable"] as const)
    assert.doesNotThrow(() => guard(merchandiser, { ...close, result }));
  const commercial = { ...merchandiser, session: state.session };
  assert.doesNotThrow(() => guard(commercial, close));
  rejects(
    commercial,
    { ...close, audit, attachment } as Command,
    "audit_not_allowed",
  );
  rejects(
    merchandiser,
    { ...close, result: "closed", audit, attachment } as Command,
    "audit_not_allowed",
  );
});
