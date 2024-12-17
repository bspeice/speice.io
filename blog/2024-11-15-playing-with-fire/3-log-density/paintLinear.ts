export function paintLinear(
  width: number,
  height: number,
  hist: number[]
) {
  const img =
    new ImageData(width, height);

  let hMax = 0;
  for (let value of hist) {
    hMax = Math.max(hMax, value);
  }

  for (let i = 0; i < hist.length; i++) {
    const pixelIndex = i * 4;

    img.data[pixelIndex] = 0;
    img.data[pixelIndex + 1] = 0;
    img.data[pixelIndex + 2] = 0;

    const alpha = hist[i] / hMax * 0xff;
    img.data[pixelIndex + 3] = alpha;
  }

  return img;
}