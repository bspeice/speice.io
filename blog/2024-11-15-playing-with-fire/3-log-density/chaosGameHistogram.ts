// hidden-start
import { randomBiUnit } from "../src/randomBiUnit";
import { randomChoice } from "../src/randomChoice";
import { Props as ChaosGameFinalProps } from "../2-transforms/chaosGameFinal";
import { camera, histIndex } from "../src/camera";

const quality = 10;
const step = 100_000;
// hidden-end
type Props = ChaosGameFinalProps & {
  paint: (
    width: number,
    height: number,
    histogram: number[]
  ) => ImageData;
}

export function* chaosGameHistogram(
  {
    width,
    height,
    transforms,
    final,
    paint
  }: Props
) {
  const pixels = width * height;
  const iterations = quality * pixels;

  // highlight-start
  const hist = Array<number>(pixels)
    .fill(0);

  const plotHist = (
    x: number,
    y: number
  ) => {
    const [pixelX, pixelY] =
      camera(x, y, width);

    if (
      pixelX < 0 ||
      pixelX >= width ||
      pixelY < 0 ||
      pixelY >= height
    )
      return;

    const hIndex =
      histIndex(pixelX, pixelY, width, 1);

    hist[hIndex] += 1;
  };
  // highlight-end

  let [x, y] = [
    randomBiUnit(),
    randomBiUnit()
  ];

  for (let i = 0; i < iterations; i++) {
    const [_, transform] =
      randomChoice(transforms);
    [x, y] = transform(x, y);
    const [finalX, finalY] = final(x, y);

    if (i > 20) {
      // highlight-start
      plotHist(finalX, finalY);
      // highlight-end
    }

    if (i % step === 0)
      yield paint(width, height, hist);
  }

  yield paint(width, height, hist);
}