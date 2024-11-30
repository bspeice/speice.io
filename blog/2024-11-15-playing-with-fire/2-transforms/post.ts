// hidden-start
import {Coefs} from "../src/coefs";
import {Transform} from "../src/transform";
import {applyCoefs} from "../src/coefs";
// hidden-end
export const transformPost = (transform: Transform, coefs: Coefs): Transform =>
    (x, y): [number, number] => applyCoefs(...transform(x, y), coefs)