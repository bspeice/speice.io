import {
  Flame,
  Transform,
  julia,
  transform1Weight,
  transform2Weight,
  transform3Weight,
  render,
  identityCoefs,
} from "./2a-variations";
import {
  TransformPost,
  transform1Post,
  transform2Post,
  transform3Post,
} from "./2b-post";

export class FlameFinal extends Flame {
  didLog: boolean = false;

  constructor(
    transforms: [number, Transform][],
    public readonly final: Transform
  ) {
    super(transforms);
  }

  override current(): [number, number] {
    return this.final.apply(this.x, this.y);
  }
}

export const transformFinal = new TransformPost(
  {
    a: 2,
    b: 0,
    c: 0,
    d: 0,
    e: 2,
    f: 0,
  },
  [[1, julia]],
  identityCoefs
);

export const flameFinal = new FlameFinal(
  [
    [transform1Weight, transform1Post],
    [transform2Weight, transform2Post],
    [transform3Weight, transform3Post],
  ],
  transformFinal
);

export function renderFinal(image: ImageData) {
  render(flameFinal, 1, image);
}
