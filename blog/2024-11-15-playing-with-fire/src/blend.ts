// hidden-start
import { Variation } from "./variation";
// hidden-end
export type Blend = [number, Variation][];

export function blend(
  x: number,
  y: number,
  varFns: Blend
): [number, number] {
  let [outX, outY] = [0, 0];

  for (const [weight, varFn] of varFns) {
    const [varX, varY] = varFn(x, y);
    outX += weight * varX;
    outY += weight * varY;
  }

  return [outX, outY];
}