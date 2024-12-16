// hidden-start
import { camera } from "./cameraGasket";

// hidden-end
function imageIndex(
  x: number,
  y: number,
  width: number
) {
  return y * (width * 4) + x * 4;
}

export function plot(
  x: number,
  y: number,
  img: ImageData
) {
  let [pixelX, pixelY] =
    camera(x, y, img.width);

  // Skip coordinates outside the display
  if (
    pixelX < 0 ||
    pixelX >= img.width ||
    pixelY < 0 ||
    pixelY >= img.height
  )
    return;

  const i = imageIndex(
    pixelX,
    pixelY,
    img.width
  );

  // Set the pixel to black by setting
  // the first three elements to 0
  // (red, green, and blue, respectively),
  // and 255 to the last element (alpha)
  img.data[i] = 0;
  img.data[i + 1] = 0;
  img.data[i + 2] = 0;
  img.data[i + 3] = 0xff;
}