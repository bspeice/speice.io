import { CanvasParams } from "./0-canvas";
import {
  randomBiUnit,
  randomInteger,
  imageIndex,
  Renderer,
  histIndex,
} from "./0-utility";

type Transform = (x: number, y: number) => [number, number];

export class RendererGasket extends Renderer {
  private values = new Uint8Array(this.size * this.size);

  /**
   * Translate values in the flame coordinate system to pixel coordinates
   *
   * A trivial implementation would take the range [-1, 1], shift it to [0, 2],
   * then scale by the image size:
   *  pixelX = Math.floor((x + 1) * this.size / 2)
   *  pixelY = Math.floor((y + 1) * this.size / 2)
   *
   * However, because the gasket solution set only has values in the range [0, 1],
   * that would lead to wasting 3/4 of the pixels. We'll instead plot just the range
   * we care about:
   *  pixelX = Math.floor(x * this.size)
   *  pixelY = Math.floor(x * this.size)
   *
   * @param x point in the range [-1, 1]
   * @param y point in the range [-1, 1]
   */
  plot(x: number, y: number): void {
    var pixelX = Math.floor(x * this.size);
    var pixelY = Math.floor(y * this.size);

    if (
      pixelX < 0 ||
      pixelX >= this.size ||
      pixelY < 0 ||
      pixelY >= this.size
    ) {
      return;
    }

    const index = histIndex(pixelX, pixelY, this.size);
    this.values[index] = 1;
  }

  run(quality: number): void {
    const transforms: Transform[] = [
      (x, y) => [x / 2, y / 2],
      (x, y) => [(x + 1) / 2, y / 2],
      (x, y) => [x / 2, (y + 1) / 2],
    ];

    let x = randomBiUnit();
    let y = randomBiUnit();

    const iterations = quality * this.size * this.size;
    for (var i = 0; i < iterations; i++) {
      const transformIndex = randomInteger(0, transforms.length);
      [x, y] = transforms[transformIndex](x, y);

      if (i >= 20) {
        this.plot(x, y);
      }
    }
  }

  render(image: ImageData): void {
    for (var pixelX = 0; pixelX < image.width; pixelX++) {
      for (var pixelY = 0; pixelY < image.height; pixelY++) {
        const hIndex = histIndex(pixelX, pixelY, this.size);
        if (!this.values[hIndex]) {
          continue;
        }

        // Set the pixel black
        const iIndex = imageIndex(pixelX, pixelY, this.size);
        image.data[iIndex + 0] = 0;
        image.data[iIndex + 1] = 0;
        image.data[iIndex + 2] = 0;
        image.data[iIndex + 3] = 0xff;
      }
    }
  }
}
