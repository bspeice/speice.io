import { camera, histIndex } from "./camera"

export function plotBinary(x: number, y: number, image: ImageData) {
    const [pixelX, pixelY] = camera(x, y, image.width);
    const pixelIndex = histIndex(pixelX, pixelY, image.width, 4);
    if (pixelIndex < 0 || pixelIndex > image.data.length) {
        return;
    }

    image.data[pixelIndex] = 0;
    image.data[pixelIndex + 1] = 0;
    image.data[pixelIndex + 2] = 0;
    image.data[pixelIndex + 3] = 0xff;
}