import test from "node:test";
import assert from "node:assert/strict";
import { CARNET_KEY, readCarnet, toggleCarnet } from "./carnet.js";

test("carnet restores only three unique valid listing IDs from local storage", () => {
  const storage = { getItem: (key) => { assert.equal(key, CARNET_KEY); return '[1,1,-2,"3",null,2,3,4,1.5]'; } };
  assert.deepEqual(readCarnet(storage), [1, 2, 3]);
  for (const raw of [null, 'null', '{}', 'broken']) assert.deepEqual(readCarnet({ getItem: () => raw }), []);
  assert.deepEqual(readCarnet({ getItem: () => { throw new Error("Storage blocked"); } }), []);
});
test("carnet toggles selection without mutation and enforces its three-item limit", () => {
  const initial = [1, 2];
  assert.deepEqual(toggleCarnet(initial, 3), [1, 2, 3]);
  assert.deepEqual(initial, [1, 2]);
  assert.deepEqual(toggleCarnet(initial, 1), [2]);
  assert.deepEqual(toggleCarnet([1, 2, 3], 4), [1, 2, 3]);
  for (const id of [0, -1, 1.2, "3", NaN]) assert.deepEqual(toggleCarnet(initial, id), initial);
  assert.deepEqual(toggleCarnet(toggleCarnet([1, 2, 3], 2), 4), [1, 3, 4]);
});
