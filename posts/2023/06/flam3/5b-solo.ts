import { RenderParams, weightedChoice } from "./0-utility.js";
import { TransformPost, transformAllPost } from "./2b-post.js";
import { transformFinal } from "./2c-final.js";
import { RendererLogarithmic } from "./3c-logarithmic.js";

export class RendererSolo extends RendererLogarithmic {
  constructor(
    size: number,
    transforms: [number, TransformPost][],
    final: TransformPost,
    private readonly transformSolo: number
  ) {
    super(size, transforms, final);
  }

  run(quality: number): void {
    const iterations = quality * this.size * this.size;
    for (var i = 0; i < iterations; i++) {
      const [transformIndex, transform] = weightedChoice(this.transforms);
      [this.x, this.y] = transform.apply(this.x, this.y);

      // NOTE: Only plot if the current point is from the solo transform
      if (i > 20 && transformIndex == this.transformSolo) {
        this.plot(this.x, this.y);
      }
    }
  }
}

export const paramsSolo1: RenderParams = {
  quality: 10,
  renderer: (size) =>
    new RendererSolo(size, transformAllPost, transformFinal, 0),
};

export const paramsSolo2: RenderParams = {
  quality: 10,
  renderer: (size) =>
    new RendererSolo(size, transformAllPost, transformFinal, 1),
};

export const paramsSolo3: RenderParams = {
  quality: 10,
  renderer: (size) =>
    new RendererSolo(size, transformAllPost, transformFinal, 2),
};
