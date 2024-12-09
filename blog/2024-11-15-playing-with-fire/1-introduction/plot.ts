/**
 * ImageData is an array that contains
 * four elements per pixel (one for each
 * red, green, blue, and alpha value).
 * This maps from pixel coordinates
 * to the array index
 */
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
  // Translate (x,y) coordinates
  // to pixel coordinates.
  // Also known as a "camera" function.
  //
  // The display range is:
  //  x=[0, 1]
  //  y=[0, 1]
  let pixelX = Math.floor(x * img.width);
  let pixelY = Math.floor(y * img.height);

  const index = imageIndex(
      img.width,
      pixelX,
      pixelY
  );

  // Skip pixels outside the display range
  if (
      index < 0 ||
      index > img.data.length
  ) {
      return;
  }

  // Set the pixel to black by writing 0
  // to the first three elements,
  // and 255 to the last element
  img.data[index] = 0;
  img.data[index + 1] = 0;
  img.data[index + 2] = 0;
  img.data[index + 3] = 0xff;
}