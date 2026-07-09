export function normalizeText(value: string) {
  return value.trim().toUpperCase();
}

export function normalizeMobile(value: string) {
  return value.replace(/\D/g, '').trim();
}
