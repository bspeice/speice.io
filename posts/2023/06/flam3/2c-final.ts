import {
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
  didLog: boolean = false;

  constructor(
    transforms: [number, Transform][],
    public readonly final: Transform
  ) {
    super(transforms);
  }

  override step(): void {
    super.step();
    [this.x, this.y] = this.final.apply(this.x, this.y);
  }

  override current() {
    if (!this.didLog) {
      this.didLog = true;
      console.trace(`Getting final xform to plot`);
    }
    // NOTE: The final transform does not modify the iterator point
    // return this.final.apply(this.x, this.y);
    return [this.x, this.y];
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

export const flameFinal = new FlameFinal(
  [
    [transform1Weight, transform1],
    [transform2Weight, transform2Post],
    [transform3Weight, transform3],
  ],
  transformFinal
);

export function renderFinal(image: ImageData) {
  render(flameFinal, 1, image);
}
