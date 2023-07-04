import { weightedChoice } from "./0-utility";
import {
  transform1,
  transform1Weight,
  transform2Weight,
  transform3,
  transform3Weight,
} from "./2a-variations";
import { transform2Post } from "./2b-post";
import { FlameFinal, transformFinal } from "./2c-final";
import { AccumulateLogarithmic } from "./3c-logarithmic";

export class AccumulateSolo extends AccumulateLogarithmic {
  constructor(
    width: number,
    height: number,
    public readonly soloTransform: number
  ) {
    super(width, height);
  }

  accumulateWithIndex(x: number, y: number, index: number) {
    if (index === this.soloTransform) {
      super.accumulate(x, y);
    }
  }
}

export class FlameIndex extends FlameFinal {
  protected index: number = -1;

  step() {
    const [index, transform] = weightedChoice(this.transforms);
    this.index = index;
    [this.x, this.y] = transform.apply(this.x, this.y);
  }

  currentWithIndex(): [number, number, number] {
    const [finalX, finalY] = this.final.apply(this.x, this.y);
    return [finalX, finalY, this.index];
  }
}

export function render(
  flame: FlameIndex,
  quality: number,
  accumulator: AccumulateSolo,
  image: ImageData
) {
  const iterations = quality * image.width * image.height;

  for (var i = 0; i < iterations; i++) {
    flame.step();

    if (i > 20) {
      const [flameX, flameY, index] = flame.currentWithIndex();
      accumulator.accumulateWithIndex(flameX, flameY, index);
    }
  }

  accumulator.render(image);
}

export const flameIndex = new FlameIndex(
  [
    [transform1Weight, transform1],
    [transform2Weight, transform2Post],
    [transform3Weight, transform3],
  ],
  transformFinal
);

export function renderTransform1(image: ImageData) {
  const accumulateTransform1 = new AccumulateSolo(image.width, image.height, 0);
  render(flameIndex, 10, accumulateTransform1, image);
}

export function renderTransform2(image: ImageData) {
  const accumulateTransform2 = new AccumulateSolo(image.width, image.height, 1);
  render(flameIndex, 10, accumulateTransform2, image);
}

export function renderTransform3(image: ImageData) {
  const accumulateTransform3 = new AccumulateSolo(image.width, image.height, 2);
  render(flameIndex, 10, accumulateTransform3, image);
}
