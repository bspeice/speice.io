import { randomBiUnit, weightedChoice } from "./0-utility";
import {
  Coefs,
  Variation,
  Transform,
  transform1Weight,
  transform1,
  transform2Weight,
  transform2,
  transform3Weight,
  transform3,
  identityCoefs,
  RendererFlame,
} from "./2a-variations";

export class TransformPost extends Transform {
  constructor(
    coefs: Coefs,
    variations: [number, Variation][],
    public readonly post: Coefs
  ) {
    super(coefs, variations);
  }

  apply(x: number, y: number): [number, number] {
    const [transformX, transformY] = super.apply(x, y);
    return [
      transformX * this.post.a + transformY * this.post.b + this.post.c,
      transformX * this.post.d + transformY * this.post.e + this.post.f,
    ];
  }
}

export const transform1Post = new TransformPost(
  transform1.coefs,
  transform1.variations,
  identityCoefs
);

export const transform2Post = new TransformPost(
  transform2.coefs,
  transform2.variations,
  {
    a: 1,
    b: 0,
    c: 0.241352,
    d: 0,
    e: 1,
    f: 0.271521,
  }
);

export const transform3Post = new TransformPost(
  transform3.coefs,
  transform3.variations,
  identityCoefs
);

export const transformAllPost: [number, TransformPost][] = [
  [transform1Weight, transform1Post],
  [transform2Weight, transform2Post],
  [transform3Weight, transform3Post],
];

export function buildPost(size: number) {
  return new RendererFlame(size, transformAllPost);
}
