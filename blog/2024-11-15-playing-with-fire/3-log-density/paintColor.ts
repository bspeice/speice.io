export function paintColor(
  width: number,
  height: number,
  red: number[],
  green: number[],
  blue: number[],
  alpha: number[]
): ImageData {
  const pixels = width * height;
  const img =
    new ImageData(width, height);

  for (let i = 0; i < pixels; i++) {
    const scale =
      Math.log10(alpha[i]) /
      (alpha[i] * 1.5);

    const pixelIndex = i * 4;

    const rVal = red[i] * scale * 0xff;
    img.data[pixelIndex] = rVal;

    const gVal = green[i] * scale * 0xff;
    img.data[pixelIndex + 1] = gVal;

    const bVal = blue[i] * scale * 0xff;
    img.data[pixelIndex + 2] = bVal;

    const aVal = alpha[i] * scale * 0xff;
    img.data[pixelIndex + 3] = aVal;
  }

  return img;
}