export type Parsed<T, P extends string> = { ok: true; value: T } | { ok: false; problem: P };

export function valid<T>(value: T): { ok: true; value: T } {
  return { ok: true, value };
}

export function invalid<P extends string>(problem: P): { ok: false; problem: P } {
  return { ok: false, problem };
}

export function requireValid<T>(parsed: Parsed<T, string>): T {
  if (!parsed.ok) {
    throw new Error(`Expected a valid value, but found the problem '${parsed.problem}'.`);
  }
  return parsed.value;
}
