import {
  Coefs,
  Variation,
  Flame,
  Transform,
  linear,
  julia,
  popcorn,
  pdj,
  render,
  transform1Coefs,
  transform1Weight,
  transform2Coefs,
  transform2Weight,
  transform3Coefs,
  transform3Pdj,
  transform3Weight,
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

export function variationPost(coefs: Coefs, variation: Variation): Variation {
  return (x, y, transformCoefs) => {
    const [varX, varY] = variation(x, y, transformCoefs);
    return [
      varX * coefs.a + varY * coefs.b + coefs.c,
      varX * coefs.d + varY * coefs.e + coefs.f,
    ];
  };
}

export const transform2Post: Coefs = {
  a: 1,
  b: 0,
  c: 0.241352,
  d: 0,
  e: 1,
  f: 0.271521,
};

export function renderPost(image: ImageData) {
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

  const flame = new Flame([
    [transform1Weight, transform1],
    [transform2Weight, transform2],
    [transform3Weight, transform3],
  ]);

  render(flame, 1, image);
}
