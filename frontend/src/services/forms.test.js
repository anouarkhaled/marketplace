import test from "node:test";
import assert from "node:assert/strict";
import { imageError, MAX_IMAGE_SIZE, safeReturnPath } from "./forms.js";
import { fetchAllPages } from "./collections.js";
import { extractErrorMessage } from "./errors.js";

test("image validation accepts the size boundary and rejects oversized or unsupported files", () => {
  assert.equal(imageError({ type: "image/png", size: MAX_IMAGE_SIZE }), null);
  assert.ok(imageError({ type: "image/png", size: MAX_IMAGE_SIZE + 1 }));
  assert.ok(imageError({ type: "text/html", size: 5 }));
  assert.equal(imageError(null), null);
  for (const type of ["image/jpeg", "image/webp"]) assert.equal(imageError({ type, size: 100 }), null);
});

test("login return paths stay local and avoid authentication redirect loops", () => {
  assert.equal(safeReturnPath("/annonce/12?source=favoris"), "/annonce/12?source=favoris");
  for (const path of [null, "https://example.org", "//example.org", "/\\example.org", "/login?next=/login", "/reset-password"]) assert.equal(safeReturnPath(path), "/annonces");
});

test("category loading follows every page without trusting the next URL", async () => {
  const pages = [];
  const items = await fetchAllPages({ get: async (path, config) => {
    assert.equal(path, "/categories/");
    pages.push(config.params.page);
    return { data: { results: [config.params.page], next: config.params.page < 3 ? "http://internal-host/categories/" : null } };
  } }, "/categories/");
  assert.deepEqual(pages, [1, 2, 3]);
  assert.deepEqual(items, [1, 2, 3]);
});

test("errors distinguish network, throttling, server failure and field validation", () => {
  assert.match(extractErrorMessage({}), /Connexion/);
  assert.match(extractErrorMessage({ response: { status: 429 } }), /Trop de tentatives/);
  assert.match(extractErrorMessage({ response: { status: 500, data: "<html>Traceback</html>" } }), /temporairement indisponible/);
  assert.equal(extractErrorMessage({ response: { status: 400, data: { email: ["Déjà utilisée."] } } }), "Email : Déjà utilisée.");
  assert.equal(extractErrorMessage({ response: { status: 400, data: { detail: "Refusé" } } }), "Refusé");
  for (const data of [null, "<html>Error</html>", {}, { nested: {} }]) {
    assert.equal(extractErrorMessage({ response: { status: 400, data } }, "Réessayez"), "Réessayez");
  }
});

test("collection loading also supports an unpaginated response", async () => {
  const result = await fetchAllPages({ get: async () => ({ data: [1, 2] }) }, "/categories/");
  assert.deepEqual(result, [1, 2]);
});
