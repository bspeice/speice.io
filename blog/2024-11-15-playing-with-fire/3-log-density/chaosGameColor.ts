// hidden-start
import { Props as ChaosGameFinalProps } from "../2-transforms/chaosGameFinal";
import { randomBiUnit } from "../src/randomBiUnit";
import { randomChoice } from "../src/randomChoice";
import { camera, histIndex } from "../src/camera";
import { colorFromPalette } from "./colorFromPalette";
import { mixColor } from "./mixColor";
import { paintColor } from "./paintColor";

const quality = 15;
const step = 100_000;
// hidden-end
export type TransformColor = {
  color: number;
  colorSpeed: number;
}

export type Props = ChaosGameFinalProps & {
  palette: number[];
  colors: TransformColor[];
  finalColor: TransformColor;
}

export function* chaosGameColor(
  {
    width,
    height,
    transforms,
    final,
    palette,
    colors,
    finalColor
  }: Props
) {
  const pixels = width * height;

  // highlight-start
  const imgRed = Array<number>(pixels)
    .fill(0);
  const imgGreen = Array<number>(pixels)
    .fill(0);
  const imgBlue = Array<number>(pixels)
    .fill(0);
  const imgAlpha = Array<number>(pixels)
    .fill(0);

  const plotColor = (
    x: number,
    y: number,
    c: number
  ) => {
    const [pixelX, pixelY] =
      camera(x, y, width);

    if (
      pixelX < 0 ||
      pixelX >= width ||
      pixelY < 0 ||
      pixelY >= width
    )
      return;

    const hIndex =
      histIndex(pixelX, pixelY, width, 1);

    const [r, g, b] =
      colorFromPalette(palette, c);

    imgRed[hIndex] += r;
    imgGreen[hIndex] += g;
    imgBlue[hIndex] += b;
    imgAlpha[hIndex] += 1;
  }
  // highlight-end

  let [x, y] = [
    randomBiUnit(),
    randomBiUnit()
  ];
  let c = Math.random();

  const iterations = quality * pixels;
  for (let i = 0; i < iterations; i++) {
    const [transformIndex, transform] =
      randomChoice(transforms);
    [x, y] = transform(x, y);

    // highlight-start
    const transformColor =
      colors[transformIndex];

    c = mixColor(
      c,
      transformColor.color,
      transformColor.colorSpeed
    );
    // highlight-end

    const [finalX, finalY] = final(x, y);

    // highlight-start
    const finalC = mixColor(
      c,
      finalColor.color,
      finalColor.colorSpeed
    );
    // highlight-end

    if (i > 20)
      plotColor(
        finalX,
        finalY,
        finalC
      )

    if (i % step === 0)
      yield paintColor(
        width,
        height,
        imgRed,
        imgGreen,
        imgBlue,
        imgAlpha
      );
  }

  yield paintColor(
    width,
    height,
    imgRed,
    imgGreen,
    imgBlue,
    imgAlpha
  );
}