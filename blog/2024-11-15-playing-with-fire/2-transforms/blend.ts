// hidden-start
import {VariationBlend} from "../src/variationBlend";
// hidden-end
export function blend(
    x: number,
    y: number,
    variations: VariationBlend): [number, number] {
    let [finalX, finalY] = [0, 0];

    for (const [weight, variation] of variations) {
        const [varX, varY] = variation(x, y);
        finalX += weight * varX;
        finalY += weight * varY;
    }

    return [finalX, finalY];
}