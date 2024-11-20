// hidden-start
import { Coefs } from './coefs'
import { Variation } from './variations'
// hidden-end
export function applyTransform(
    x: number,
    y: number,
    coefs: Coefs,
    variations: [number, Variation][])
{
    const transformX = coefs.a * x + coefs.b * y + coefs.c;
    const transformY = coefs.d * x + coefs.e * y + coefs.f;

    var finalX = 0;
    var finalY = 0;
    for (const [blend, variation] of variations) {
        const [variationX, variationY] = variation(transformX, transformY);
        finalX += blend * variationX;
        finalY += blend * variationY;
    }
    return [finalX, finalY];
}