import {
  Coefs,
  Flame,
  Transform,
  linear,
  julia,
  popcorn,
  pdj,
  transform1Coefs,
  transform1Weight,
  transform2Coefs,
  transform2Weight,
  transform3Coefs,
  transform3Pdj,
  transform3Weight,
  weightedChoice,
  plot,
} from "./2a-variations";
import { TransformPost, transform2Post } from "./2b-post";

export class FlameFinal extends Flame {
  constructor(
    transforms: [number, Transform][],
    public readonly final: Transform
  ) {
    super(transforms);
  }

  render(quality: number, image: ImageData) {
    var x = Math.random() * 2 - 1;
    var y = Math.random() * 2 - 1;

    const iter = quality * (image.width * image.height);
    for (var i = 0; i < iter; i++) {
      const transform = weightedChoice(this.transforms);
      [x, y] = transform.apply(x, y);

      // This line is the only thing that changes:
      [x, y] = this.final.apply(x, y);

      if (i > 20) {
        plot(x, y, image);
      }
    }
  }
}

export const finalCoefs: Coefs = {
  a: 2,
  b: 0,
  c: 0,
  d: 0,
  e: 2,
  f: 0,
};

export function renderFinal(image: ImageData) {
  const transform1 = new Transform(transform1Coefs, [[1, julia]]);

  const transform2 = new TransformPost(
    transform2Coefs,
    [
      [1, linear],
      [1, popcorn],
    ],
    transform2Post
  );

  const [pdjA, pdjB, pdjC, pdjD] = transform3Pdj;
  const transform3 = new Transform(transform3Coefs, [
    [1, pdj(pdjA, pdjB, pdjC, pdjD)],
  ]);

  const transformFinal = new Transform(finalCoefs, [[1, julia]]);

  const flame = new FlameFinal(
    [
      [transform1Weight, transform1],
      [transform2Weight, transform2],
      [transform3Weight, transform3],
    ],
    transformFinal
  );

  flame.render(1, image);
}