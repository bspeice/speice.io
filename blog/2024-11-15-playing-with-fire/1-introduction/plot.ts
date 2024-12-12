// hidden-start
import {camera} from "./cameraGasket"
// hidden-end
function imageIndex(
  width: number,
  x: number,
  y: number
) {
  return y * (width * 4) + x * 4;
}

export function plot(
  x: number,
  y: number,
  img: ImageData
) {
  let [pixelX, pixelY] = camera(img.width, x, y);

  const i = imageIndex(
    img.width,
    pixelX,
    pixelY
  );

  // Skip pixels outside the display range
  if (
    i < 0 ||
    i > img.data.length
  ) {
    return;
  }

  // Set the pixel to black by writing 0
  // to the first three elements at the index
  // (red, green, and blue, respectively),
  // and 255 to the last element (alpha)
  img.data[i] = 0;
  img.data[i + 1] = 0;
  img.data[i + 2] = 0;
  img.data[i + 3] = 0xff;
}