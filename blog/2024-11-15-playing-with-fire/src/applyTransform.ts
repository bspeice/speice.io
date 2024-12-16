import { applyCoefs, Coefs, Transform } from "./transform";
import { blend, Blend } from "./blend";

export const applyTransform = (coefs: Coefs, variations: Blend): Transform =>
  (x, y) => blend(...applyCoefs(x, y, coefs), variations)

export const applyPost = (coefsPost: Coefs, transform: Transform): Transform =>
  (x, y) => applyCoefs(...transform(x, y), coefsPost);