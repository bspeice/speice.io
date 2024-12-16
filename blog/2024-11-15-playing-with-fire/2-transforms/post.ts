// hidden-start
import { applyCoefs, Coefs, Transform } from "../src/transform";
// hidden-end
export const transformPost = (
  transform: Transform,
  coefs: Coefs
): Transform =>
  (x, y) => {
    [x, y] = transform(x, y);
    return applyCoefs(x, y, coefs);
  }