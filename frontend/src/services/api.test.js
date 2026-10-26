import test from "node:test";
import assert from "node:assert/strict";
import axios from "axios";
import { createApiClient, redirectToLogin } from "./api.js";

function setup() {
  const values = new Map([["access", "expired"], ["refresh", "refresh-old"]]);
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
  let expired = 0;
  const clients = createApiClient({ baseURL: "http://localhost/api", storage, onSessionExpired: () => { expired += 1; } });
  return { ...clients, storage, expiredCount: () => expired };
}
function fail(config, status) {
  throw new axios.AxiosError("Request failed", "ERR_BAD_REQUEST", config, null, { status, data: { detail: "Invalid" }, headers: {}, config });
}
function ok(config, data) { return { status: 200, data, headers: {}, config }; }

test("concurrent 401s share a refresh and persist the rotated refresh token", async () => {
  const app = setup();
  let refreshes = 0;
  app.client.defaults.adapter = async (config) => config.headers.Authorization === "Bearer fresh" ? ok(config, { success: true }) : fail(config, 401);
  app.refreshClient.defaults.adapter = async (config) => {
    refreshes += 1;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return ok(config, { access: "fresh", refresh: "rotated" });
  };
  const responses = await Promise.all([app.client.get("/profile/"), app.client.get("/favorites/"), app.client.get("/my-listings/")]);
  assert.equal(refreshes, 1);
  assert.equal(responses.length, 3);
  assert.equal(app.storage.getItem("refresh"), "rotated");
  assert.equal(app.expiredCount(), 0);
});

test("invalid refresh clears credentials and requests one redirect", async () => {
  const app = setup();
  app.client.defaults.adapter = async (config) => fail(config, 401);
  app.refreshClient.defaults.adapter = async (config) => fail(config, 401);
  await Promise.allSettled([app.client.get("/profile/"), app.client.get("/favorites/")]);
  assert.equal(app.storage.getItem("access"), null);
  assert.equal(app.storage.getItem("refresh"), null);
  assert.equal(app.expiredCount(), 1);
});

test("network failure during refresh preserves the session for retry", async () => {
  const app = setup();
  app.client.defaults.adapter = async (config) => fail(config, 401);
  app.refreshClient.defaults.adapter = async (config) => { throw new axios.AxiosError("Network Error", "ERR_NETWORK", config); };
  await assert.rejects(app.client.get("/profile/"));
  assert.equal(app.storage.getItem("refresh"), "refresh-old");
  assert.equal(app.expiredCount(), 0);
});

test("login and reset requests never send an expired access token", async () => {
  const app = setup();
  app.client.defaults.adapter = async (config) => {
    assert.equal(config.headers.Authorization, undefined);
    return fail(config, 401);
  };
  for (const path of ["/token/", "/register/", "/password-reset/", "/password-reset/confirm/"]) await assert.rejects(app.client.post(path, {}));
  assert.equal(app.expiredCount(), 0);
});

test("a refresh completing after logout cannot restore the session", async () => {
  const app = setup();
  app.client.defaults.adapter = async (config) => fail(config, 401);
  app.refreshClient.defaults.adapter = async (config) => {
    app.storage.removeItem("access");
    app.storage.removeItem("refresh");
    return ok(config, { access: "fresh", refresh: "rotated" });
  };
  await assert.rejects(app.client.get("/profile/"));
  assert.equal(app.storage.getItem("access"), null);
});

test("a failed refresh from an old session does not clear a new login", async () => {
  const app = setup();
  app.client.defaults.adapter = async (config) => fail(config, 401);
  app.refreshClient.defaults.adapter = async (config) => {
    app.storage.setItem("access", "new-login");
    app.storage.setItem("refresh", "new-session");
    return fail(config, 401);
  };
  await assert.rejects(app.client.get("/profile/"));
  assert.equal(app.storage.getItem("access"), "new-login");
  assert.equal(app.expiredCount(), 0);
});

test("a retried request still returning 401 terminates without a loop", async () => {
  const app = setup();
  let attempts = 0;
  app.client.defaults.adapter = async (config) => { attempts += 1; return fail(config, 401); };
  app.refreshClient.defaults.adapter = async (config) => ok(config, { access: "fresh" });
  await assert.rejects(app.client.get("/profile/"));
  assert.equal(attempts, 2);
  assert.equal(app.expiredCount(), 1);
});

test("a delayed 401 uses the already refreshed token instead of refreshing again", async () => {
  const app = setup();
  let release;
  let started;
  const ready = new Promise((resolve) => { started = resolve; });
  const wait = new Promise((resolve) => { release = resolve; });
  let refreshes = 0;
  app.client.defaults.adapter = async (config) => {
    if (config.headers.Authorization === "Bearer fresh") return ok(config, {});
    if (config.url === "/slow/") { started(); await wait; }
    return fail(config, 401);
  };
  app.refreshClient.defaults.adapter = async (config) => {
    refreshes += 1;
    return ok(config, { access: "fresh", refresh: "rotated" });
  };
  const slow = app.client.get("/slow/");
  await ready;
  await app.client.get("/profile/");
  release();
  await slow;
  assert.equal(refreshes, 1);
});

test("a forbidden response does not refresh or clear a valid session", async () => {
  const app = setup();
  app.client.defaults.adapter = async (config) => fail(config, 403);
  app.refreshClient.defaults.adapter = async () => { assert.fail("Unexpected refresh"); };
  await assert.rejects(app.client.get("/stats/"));
  assert.equal(app.storage.getItem("access"), "expired");
  assert.equal(app.expiredCount(), 0);
});

test("the expiration redirect preserves the destination and avoids a login loop", () => {
  const redirects = [];
  for (const pathname of ["/annonce/7", "/login"]) {
    redirectToLogin({ pathname, search: "?source=favoris", replace: (url) => redirects.push(url) });
  }
  assert.deepEqual(redirects, ["/login?expired=1&next=%2Fannonce%2F7%3Fsource%3Dfavoris"]);
});

test("a missing refresh token expires the session without requesting a refresh", async () => {
  const app = setup();
  app.storage.removeItem("refresh");
  app.client.defaults.adapter = async (config) => fail(config, 401);
  app.refreshClient.defaults.adapter = async () => { assert.fail("Unexpected refresh"); };
  await assert.rejects(app.client.get("/profile/"));
  assert.equal(app.storage.getItem("access"), null);
  assert.equal(app.expiredCount(), 1);
});
