export const CARNET_KEY = "marketplace.carnet.v1";
export function readCarnet(storage) {
  try {
    const value = JSON.parse(storage.getItem(CARNET_KEY));
    return Array.isArray(value) ? [...new Set(value.filter((id) => Number.isSafeInteger(id) && id > 0))].slice(0, 3) : [];
  } catch { return []; }
}
export function toggleCarnet(ids, id) {
  if (ids.includes(id)) return ids.filter((value) => value !== id);
  return ids.length < 3 && Number.isSafeInteger(id) && id > 0 ? [...ids, id] : ids;
}
