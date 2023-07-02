import {
  Coefs,
  Flame,
  Transform,
  julia,
  transform1Weight,
  transform1,
  transform2Weight,
  transform3Weight,
  transform3,
  render,
} from "./2a-variations";
import { transform2Post } from "./2b-post";

export class FlameFinal extends Flame {
  constructor(
    transforms: [number, Transform][],
    public readonly final: Transform
  ) {
    super(transforms);
  }

  step() {
    super.step();
    [this.x, this.y] = this.final.apply(this.x, this.y);
  }
}

export const transformFinal = new Transform(
  {
    a: 2,
    b: 0,
    c: 0,
    d: 0,
    e: 2,
    f: 0,
  },
  [[1, julia]]
);

export function renderFinal(image: ImageData) {
  const flame = new FlameFinal(
    [
      [transform1Weight, transform1],
      [transform2Weight, transform2Post],
      [transform3Weight, transform3],
    ],
    transformFinal
  );

  render(flame, 1, image);
}
