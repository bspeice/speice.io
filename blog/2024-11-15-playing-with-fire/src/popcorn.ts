// hidden-start
import {Coefs} from './coefs'
import {Variation} from './variation'
// hidden-end
export function popcorn({c, f}: Coefs): Variation {
    return (x, y) => [
        x + c * Math.sin(Math.tan(3 * y)),
        y + f * Math.sin(Math.tan(3 * x))
    ];
}