export type Transform =
  (x: number, y: number) =>
    [number, number];

export interface Coefs {
  a: number,
  b: number,
  c: number,
  d: number,
  e: number,
  f: number
}

export function applyCoefs(
  x: number,
  y: number,
  coefs: Coefs
): [number, number] {
  return [
    (x * coefs.a + y * coefs.b + coefs.c),
    (x * coefs.d + y * coefs.e + coefs.f)
  ];
}