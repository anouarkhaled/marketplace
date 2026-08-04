export function mediaUrl(path) {
  if (!path) return null;
  return path.startsWith("http") ? path : `http://127.0.0.1:8000${path}`;
}