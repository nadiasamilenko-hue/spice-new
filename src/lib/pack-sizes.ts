export function isDoyPak(packLabel?: string | null): boolean {
  if (!packLabel) return false;
  return /дой\s*пак/i.test(packLabel);
}

export function parseSizes(weight?: string | null): string[] {
  if (!weight) return [];
  return weight
    .split(/[;,/]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
