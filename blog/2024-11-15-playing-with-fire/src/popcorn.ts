// hidden-start
import { Coefs } from "./transform";
import { Variation } from "./variation";
// hidden-end
export const popcorn =
  ({ c, f }: Coefs): Variation =>
    (x, y) => [
      x + c * Math.sin(Math.tan(3 * y)),
      y + f * Math.sin(Math.tan(3 * x))
    ];