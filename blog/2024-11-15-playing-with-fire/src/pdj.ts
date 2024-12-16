// hidden-start
import { Variation } from './variation'
//hidden-end
export type PdjParams = {
    a: number,
    b: number,
    c: number,
    d: number
};
export const pdj =
  ({a, b, c, d}: PdjParams): Variation =>
    (x, y) => [
        Math.sin(a * y) - Math.cos(b * x),
        Math.sin(c * x) - Math.cos(d * y)
    ]