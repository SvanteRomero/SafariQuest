/** Converts one snake_case key to camelCase: `image_alt` -> `imageAlt`. */
function snakeToCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())
}

/** Converts one camelCase key to snake_case: `imageAlt` -> `image_alt`. */
function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

/**
 * Converts a flat API response object's snake_case keys to their camelCase
 * equivalents. Every key of `raw` is copied over renamed, value unchanged,
 * UNLESS `overrides` supplies a function for that *output* key — for a field
 * that's renamed beyond mere case (`id` from `raw.slug`), a type coercion
 * (`Number(raw.rating)`), a default (`raw.badge || undefined`), or a nested
 * array/object that needs its own mapping. An override's key does not have
 * to correspond to any auto-generated one at all.
 *
 * When an override's source is a *different* raw key than its output name
 * (`id` overridden from `raw.slug`), list that raw key in `drop` — otherwise
 * the auto-converted `slug` field would also appear in the result alongside
 * `id`, duplicating the same value under two names.
 *
 * This intentionally does not recurse into nested objects/arrays on its own
 * — that would mean guessing at a shape it can't see. Nest another
 * `fromApiShape` call (or a small hand-written literal, for a shape too
 * small to bother) inside an override instead; see api/guides.ts or
 * api/support.ts for examples of both.
 */
export function fromApiShape<TRaw extends object, TOut>(
  raw: TRaw,
  overrides: { [K in keyof TOut]?: (raw: TRaw) => TOut[K] } = {},
  drop: (keyof TRaw)[] = [],
): TOut {
  // TRaw is typically a plain `interface` (BookingApiShape, etc.), and an
  // interface has no index signature unless it declares one — so it isn't
  // assignable to Record<string, unknown> even though every real instance of
  // it obviously has string keys at runtime. Casting once here, rather than
  // widening the public TRaw extends bound, keeps every override's `raw`
  // parameter (and the overrides object itself) checked against the real
  // TRaw shape everywhere else in this function.
  const rawRecord = raw as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const rawKey of Object.keys(rawRecord)) {
    if ((drop as string[]).includes(rawKey)) continue
    result[snakeToCamel(rawKey)] = rawRecord[rawKey]
  }
  for (const outKey of Object.keys(overrides)) {
    result[outKey] = (overrides as Record<string, (raw: TRaw) => unknown>)[outKey](raw)
  }
  return result as TOut
}

/**
 * The write-direction mirror of `fromApiShape`: camelCase input keys to their
 * snake_case API equivalents. Same override/drop mechanism, same rule about
 * not recursing into nested shapes on its own, and the same requirement to
 * pass both type arguments explicitly rather than leaving them to inference.
 */
export function toApiShape<TIn extends object, TOut>(
  input: TIn,
  overrides: { [K in keyof TOut]?: (input: TIn) => TOut[K] } = {},
  drop: (keyof TIn)[] = [],
): TOut {
  const inputRecord = input as Record<string, unknown>
  const result: Record<string, unknown> = {}
  for (const inKey of Object.keys(inputRecord)) {
    if ((drop as string[]).includes(inKey)) continue
    result[camelToSnake(inKey)] = inputRecord[inKey]
  }
  for (const outKey of Object.keys(overrides)) {
    result[outKey] = (overrides as Record<string, (input: TIn) => unknown>)[outKey](input)
  }
  return result as TOut
}
