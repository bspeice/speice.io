export function paintLogarithmic(
  width: number,
  height: number,
  hist: number[]
) {
  const img =
    new ImageData(width, height);

  const histLog = hist.map(Math.log);

  let hLogMax = -Infinity;
  for (let value of histLog) {
    hLogMax = Math.max(hLogMax, value);
  }

  for (let i = 0; i < hist.length; i++) {
    const pixelIndex = i * 4;

    img.data[pixelIndex] = 0; // red
    img.data[pixelIndex + 1] = 0; // green
    img.data[pixelIndex + 2] = 0; // blue

    const alpha =
      histLog[i] / hLogMax * 0xff;
    img.data[pixelIndex + 3] = alpha;
  }

  return img;
}