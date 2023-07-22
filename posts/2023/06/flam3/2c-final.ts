import { RenderParams } from "./0-utility.js";
import { julia, identityCoefs, RendererFlame } from "./2a-baseline.js";
import { TransformPost, transformAllPost } from "./2b-post.js";

export class RendererFinal extends RendererFlame {
  constructor(
    size: number,
    transforms: [number, TransformPost][],
    public readonly final: TransformPost
  ) {
    super(size, transforms);
  }

  plot(x: number, y: number): void {
    super.plot(...this.final.apply(x, y));
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

export const paramsFinal: RenderParams = {
  quality: 1,
  renderer: (size) => new RendererFinal(size, transformAllPost, transformFinal),
};
