// hidden-start
import { Variation } from "../src/variation"
// hidden-end
export function blend(x: number, y: number, variations: [number, Variation][]): [number, number] {
    let [finalX, finalY] = [0, 0];

    for (const [weight, variation] of variations) {
        const [varX, varY] = variation(x, y);
        finalX += weight * varX;
        finalY += weight * varY;
    }

    return [finalX, finalY];
}