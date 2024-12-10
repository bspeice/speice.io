// hidden-start
import {Variation} from "./variation";
// hidden-end
export type VariationBlend = [number, Variation][];
export function blend(
    x: number,
    y: number,
    variations: VariationBlend
): [number, number] {
    let [outX, outY] = [0, 0];

    for (const [weight, variation] of variations) {
        const [varX, varY] = variation(x, y);
        outX += weight * varX;
        outY += weight * varY;
    }

    return [outX, outY];
}