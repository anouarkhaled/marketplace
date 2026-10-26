import test from "node:test";
import assert from "node:assert/strict";
import { fetchRecentMessages, mergeMessages } from "./messages.js";

const message = (id, changes = {}) => ({ id, created_at: "2026-01-01T12:00:00Z", body: `Message ${id}`, ...changes });

test("polling merges without duplicates, preserves history and updates read receipts", () => {
  const previous = [message(1), message(2, { read_at: null })];
  const merged = mergeMessages(previous, [message(3), message(2, { read_at: "2026-01-01T13:00:00Z" })]);
  assert.deepEqual(merged.map((item) => item.id), [1, 2, 3]);
  assert.equal(merged[1].read_at, "2026-01-01T13:00:00Z");
  assert.equal(previous[1].read_at, null);
});

test("display order uses dates before the identifier tie-breaker", () => {
  const merged = mergeMessages([message(10, { created_at: "2026-01-01T10:00:00Z" })], [message(1)]);
  assert.deepEqual(merged.map((item) => item.id), [10, 1]);
});

test("initial load fetches the latest page and exposes older history", async () => {
  let calls = 0;
  const client = { get: async () => { calls += 1; return { data: { results: [message(12)], next: "/messages/?page=2" } }; } };
  const result = await fetchRecentMessages(client, "/messages/", new Set(), { initial: true });
  assert.equal(calls, 1);
  assert.equal(result.hasOlder, true);
});

test("more than nine new messages are fetched until previously known history is reached", async () => {
  const pages = [];
  const batches = [Array.from({ length: 9 }, (_, index) => message(24 - index)), Array.from({ length: 9 }, (_, index) => message(15 - index))];
  const known = new Set([8, 9]);
  const client = { get: async (path, { params }) => {
    assert.equal(path, "/messages/");
    pages.push(params.page);
    return { data: { results: batches[params.page - 1], next: "http://internal-host/messages/?page=3" } };
  } };
  const result = await fetchRecentMessages(client, "/messages/", known);
  assert.deepEqual(pages, [1, 2]);
  const merged = mergeMessages([message(8), message(9)], result.messages);
  assert.deepEqual(merged.map((item) => item.id), Array.from({ length: 18 }, (_, index) => index + 7));
  assert.deepEqual([...known], [8, 9]);
});

test("polling stops at the end if known messages were deleted", async () => {
  const client = { get: async () => ({ data: { results: [message(3)], next: null } }) };
  const result = await fetchRecentMessages(client, "/messages/", new Set([999]));
  assert.deepEqual(result.messages.map((item) => item.id), [3]);
  assert.equal(result.hasOlder, false);
});

test("request failure is propagated so the page can offer retry", async () => {
  const failure = new Error("offline");
  await assert.rejects(fetchRecentMessages({ get: async () => { throw failure; } }, "/messages/", new Set()), failure);
});

test("an aborted refresh does not start another page", async () => {
  const controller = new AbortController();
  let calls = 0;
  const client = { get: async () => {
    calls += 1;
    controller.abort();
    return { data: { results: [message(3)], next: "/messages/?page=2" } };
  } };
  await fetchRecentMessages(client, "/messages/", new Set(), { signal: controller.signal });
  assert.equal(calls, 1);
});
