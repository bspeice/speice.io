import {Transform, Coefs, applyCoefs} from "./transform";
import {blend, VariationBlend} from "./blend";

export const applyTransform = (coefs: Coefs, variations: VariationBlend): Transform =>
    (x, y) => blend(...applyCoefs(x, y, coefs), variations);

export const applyPost = (coefsPost: Coefs, transform: Transform): Transform =>
    (x, y) => applyCoefs(...transform(x, y), coefsPost);