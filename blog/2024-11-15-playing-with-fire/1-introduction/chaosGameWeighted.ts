// hidden-start
import { randomBiUnit } from "../src/randomBiUnit";
import { randomChoice } from "../src/randomChoice";
import { plot } from "./plot"
import {Transform} from "../src/transform";

const quality = 0.5;
const step = 1000;
// hidden-end
export type Props = {
    width: number,
    height: number,
    transforms: [number, Transform][]
}
export function* chaosGameWeighted(
    {width, height, transforms}: Props
) {
  let img = new ImageData(width, height);
  let [x, y] = [
      randomBiUnit(),
      randomBiUnit()
  ];

  const iterations = width * height * quality;
  for (let c = 0; c < iterations; c++) {
    // highlight-start
    const [_, xform] = randomChoice(transforms);
    // highlight-end
    [x, y] = xform(x, y);

    if (c > 20)
      plot(x, y, img);

    if (c % step === 0)
      yield img;
  }

  yield img;
}