import { RenderParams, histIndex, imageIndex } from "./0-utility.js";
import {
  camera,
  transform1Weight,
  transform2Weight,
  transform3Weight,
} from "./2a-baseline.js";
import {
  TransformPost,
  transform1Post,
  transform2Post,
  transform3Post,
  transformAllPost,
} from "./2b-post.js";
import { RendererFinal, transformFinal } from "./2c-final.js";

export class RendererHistogram extends RendererFinal {
  protected histogram: number[] = [];

  constructor(
    size: number,
    transforms: [number, TransformPost][],
    final: TransformPost
  ) {
    super(size, transforms, final);

    for (var i = 0; i < this.size * this.size; i++) {
      this.histogram.push(0);
    }
  }

  plot(x: number, y: number): void {
    [x, y] = this.final.apply(x, y);
    const [pixelX, pixelY] = camera(x, y, this.size);

    if (
      pixelX < 0 ||
      pixelY >= this.size ||
      pixelY < 0 ||
      pixelY >= this.size
    ) {
      return;
    }

    const hIndex = histIndex(pixelX, pixelY, this.size);
    this.histogram[hIndex] += 1;
  }

  render(image: ImageData): void {
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        const hIndex = histIndex(x, y, this.size);
        const iIndex = imageIndex(x, y, this.size);
        image.data[iIndex + 0] = 0;
        image.data[iIndex + 1] = 0;
        image.data[iIndex + 2] = 0;
        image.data[iIndex + 3] = (this.histogram[hIndex] > 0 ? 1 : 0) * 0xff;
      }
    }
  }
}

export const paramsBinary: RenderParams = {
  quality: 1,
  renderer: (size) =>
    new RendererHistogram(size, transformAllPost, transformFinal),
};
