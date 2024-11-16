/**
 * Affine transformation coefficients
 */
export type Coefs = {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
};

export type Variation = (
  x: number,
  y: number,
  coefs: Coefs
) => [number, number];

export type Transform = {
    coefs: Coefs,
    coefsPost: Coefs,
    variations: [number, Variation][],
    color: number
}
