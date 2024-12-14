// hidden-start
import {colorFromPalette} from "./colorFromPalette";
// hidden-end
export function paintColor(
    width: number,
    height: number,
    red: number[],
    green: number[],
    blue: number[],
    alpha: number[]
): ImageData {
    const image = new ImageData(width, height);

    for (let i = 0; i < width * height; i++) {
        const alphaScale = Math.log10(alpha[i]) / (alpha[i] * 1.5);

        const pixelIndex = i * 4;
        image.data[pixelIndex] = red[i] * alphaScale * 0xff;
        image.data[pixelIndex + 1] = green[i] * alphaScale * 0xff;
        image.data[pixelIndex + 2] = blue[i] * alphaScale * 0xff;
        image.data[pixelIndex + 3] = alpha[i] * alphaScale * 0xff;
    }

    return image;
}