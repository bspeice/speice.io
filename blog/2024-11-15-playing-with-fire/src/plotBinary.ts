import { camera, histIndex } from "./camera";

export function plotBinary(x: number, y: number, image: ImageData) {
  const [pixelX, pixelY] = camera(x, y, image.width);
  if (pixelX < 0 || pixelX >= image.width || pixelY < 0 || pixelY >= image.height)
    return;

  const pixelIndex = histIndex(pixelX, pixelY, image.width, 4);

  image.data[pixelIndex] = 0;
  image.data[pixelIndex + 1] = 0;
  image.data[pixelIndex + 2] = 0;
  image.data[pixelIndex + 3] = 0xff;
}