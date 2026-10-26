export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

export function imageError(file) {
  if (!file) return null;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Choisissez une image JPEG, PNG ou WebP.";
  if (file.size > MAX_IMAGE_SIZE) return "Chaque image doit peser au maximum 5 Mo.";
  return null;
}

export function safeReturnPath(value, fallback = "/annonces") {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    && !/[\\\r\n]/.test(value) && !/^\/(login|register|reset-password|mot-de-passe-oublie)([/?#]|$)/.test(value)
    ? value : fallback;
}
