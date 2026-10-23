import assert from "node:assert/strict";
import test from "node:test";
import { demoProfile, demoScenario, visitSeeds } from "../src/data/fixtures";
import {
  createInitialState,
  demoReducer,
  type DemoAction,
  type DemoState,
} from "../src/modules/visits/domain/demo";

const login: DemoAction = {
  type: "LOGIN",
  email: demoProfile.email,
  password: demoProfile.password,
};
const start: DemoAction = {
  type: "START_WORKDAY",
  at: demoScenario.timestamps.start,
};
const arrive = (visitId: string): DemoAction => ({
  type: "ARRIVE",
  visitId,
  at: demoScenario.timestamps.arrivals[visitId],
});
const finish = (
  visitId: string,
): Extract<DemoAction, { type: "FINISH_VISIT" }> => ({
  type: "FINISH_VISIT",
  visitId,
  at: demoScenario.timestamps.departures[visitId],
  result: "attended",
  observations: "  Follow-up requested.  ",
  photoAttached: false,
});
const activeDay = () =>
  demoReducer(demoReducer(createInitialState(), login), start);

function expectRejected(state: DemoState, action: DemoAction, error: string) {
  const snapshot = structuredClone(state);
  const actual = demoReducer(state, action);
  assert.equal(actual.error, error);
  assert.deepEqual(
    { ...actual, error: undefined },
    { ...snapshot, error: undefined },
  );
  assert.deepEqual(state, snapshot, "Commands must never mutate their input");
}

test("two visits complete and the workday closes through public commands", () => {
  let state = activeDay();
  for (const { id } of visitSeeds) {
    state = demoReducer(state, arrive(id));
    assert.equal(
      state.visits.find((visit) => visit.id === id)?.status,
      "active",
    );
    state = demoReducer(state, finish(id));
    const visit = state.visits.find((entry) => entry.id === id)!;
    assert.equal(visit.status, "completed");
    assert.equal(visit.arrivedAt, demoScenario.timestamps.arrivals[id]);
    assert.equal(visit.endedAt, demoScenario.timestamps.departures[id]);
    assert.equal(visit.observations, "Follow-up requested.");
    assert.equal(visit.result, "attended");
    assert.equal(visit.photoAttached, false);
  }
  state = demoReducer(state, {
    type: "END_WORKDAY",
    at: demoScenario.timestamps.end,
  });
  assert.deepEqual(state.workday, {
    status: "completed",
    startedAt: demoScenario.timestamps.start,
    endedAt: demoScenario.timestamps.end,
  });
  assert.equal(state.error, undefined);
  expectRejected(state, start, "workday_already_started");
  expectRejected(state, arrive("visit-1"), "active_workday_required");
});

test("unauthenticated actions and incorrect credentials preserve business state", () => {
  const state = createInitialState();
  expectRejected(state, start, "authentication_required");
  expectRejected(
    state,
    { type: "LOGIN", email: demoProfile.email, password: "wrong" },
    "invalid_credentials",
  );
});

test("arrival requires an active workday and only one visit may be active", () => {
  expectRejected(
    demoReducer(createInitialState(), login),
    arrive("visit-1"),
    "active_workday_required",
  );
  const state = demoReducer(activeDay(), arrive("visit-1"));
  expectRejected(state, arrive("visit-2"), "another_visit_active");
  expectRejected(state, arrive("visit-1"), "visit_not_pending");
  expectRejected(state, arrive("missing"), "visit_not_found");
});

test("completion requires arrival and an outcome; closure requires every visit", () => {
  expectRejected(activeDay(), finish("visit-1"), "active_visit_required");
  const state = demoReducer(activeDay(), arrive("visit-1"));
  expectRejected(
    state,
    { ...finish("visit-1"), result: undefined },
    "visit_result_required",
  );
  expectRejected(
    state,
    { type: "END_WORKDAY", at: demoScenario.timestamps.end },
    "visits_remaining",
  );
  const completed = demoReducer(state, finish("visit-1"));
  expectRejected(
    completed,
    { type: "END_WORKDAY", at: demoScenario.timestamps.end },
    "visits_remaining",
  );
});

test("logout and login retain progress; closed and unavailable outcomes are accepted", () => {
  let state = demoReducer(activeDay(), arrive("visit-1"));
  const before = structuredClone(state);
  state = demoReducer(state, { type: "LOGOUT" });
  assert.equal(state.authenticated, false);
  expectRejected(state, finish("visit-1"), "authentication_required");
  state = demoReducer(state, login);
  assert.deepEqual(state, before);
  state = demoReducer(state, {
    ...finish("visit-1"),
    result: "closed",
    photoAttached: true,
  });
  assert.equal(state.visits[0].result, "closed");
  assert.equal(state.visits[0].photoAttached, true);
  state = demoReducer(state, arrive("visit-2"));
  state = demoReducer(state, { ...finish("visit-2"), result: "unavailable" });
  assert.equal(state.visits[1].result, "unavailable");
});

test("reset restores independent seeds and clear error preserves progress", () => {
  const fixturesBefore = structuredClone(visitSeeds);
  const state = demoReducer(activeDay(), arrive("visit-1"));
  const rejected = demoReducer(state, arrive("visit-2"));
  assert.deepEqual(demoReducer(rejected, { type: "CLEAR_ERROR" }), {
    ...state,
    error: undefined,
  });
  const reset = demoReducer(state, { type: "RESET" });
  assert.deepEqual(reset, createInitialState());
  reset.visits[0].status = "completed";
  assert.equal(createInitialState().visits[0].status, "pending");
  assert.deepEqual(visitSeeds, fixturesBefore);
});
