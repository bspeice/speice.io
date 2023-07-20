import { histIndex, imageIndex, weightedChoice } from "./0-utility";
import {
  Coefs,
  Variation,
  camera,
  transform1Weight,
  transform2Weight,
  transform3Weight,
} from "./2a-variations";
import {
  TransformPost,
  transform1Post,
  transform2Post,
  transform3Post,
} from "./2b-post";
import { RendererFinal, transformFinal } from "./2c-final";

export class TransformColor extends TransformPost {
  constructor(
    coefs: Coefs,
    variations: [number, Variation][],
    post: Coefs,
    public readonly color: number
  ) {
    super(coefs, variations, post);
  }
}

export class RendererColor extends RendererFinal {
  protected color: number = Math.random();
  protected red: number[] = [];
  protected green: number[] = [];
  protected blue: number[] = [];
  protected alpha: number[] = [];

  constructor(
    size: number,
    transforms: [number, TransformColor][],
    final: TransformColor,
    private readonly palette: number[]
  ) {
    super(size, transforms, final);
    for (var i = 0; i < this.size * this.size; i++) {
      this.red.push(0);
      this.green.push(0);
      this.blue.push(0);
      this.alpha.push(0);
    }
  }

  colorFromIndex(c: number): [number, number, number] {
    // A smarter coloring implementation would interpolate between points in the palette,
    // but we'll use a step function here to keep things simple
    const colorIndex = Math.floor(c * (this.palette.length / 3)) * 3;
    return [
      paletteNumber[colorIndex + 0],
      paletteNumber[colorIndex + 1],
      paletteNumber[colorIndex + 2],
    ];
  }

  plotColor(x: number, y: number, color: number): void {
    const [finalX, finalY] = this.final.apply(x, y);
    const [pixelX, pixelY] = camera(finalX, finalY, this.size);
    if (pixelX < 0 || pixelX > this.size || pixelY < 0 || pixelY > this.size) {
      return;
    }

    // NOTE: The reference parameters use a final `symmetry` of 1,
    // which effectively disables the final transform's contribution
    // to color mixing (see the `color_speed` in flam3).
    // While we'd normally want to apply the same color transformation
    // like we do in the `run` method, it is skipped here so the output
    // image matches the reference image
    //
    //  const finalColor = (color + (final as TransformColor).color) / 2
    const finalColor = color;
    const [r, g, b] = this.colorFromIndex(finalColor);

    const hIndex = histIndex(pixelX, pixelY, this.size);
    this.red[hIndex] += r;
    this.green[hIndex] += g;
    this.blue[hIndex] += b;
    this.alpha[hIndex] += 1;
  }

  run(quality: number): void {
    const iterations = quality * this.size * this.size;
    for (var i = 0; i < iterations; i++) {
      const [_, transform] = weightedChoice(this.transforms);
      [this.x, this.y] = transform.apply(this.x, this.y);
      this.color = (this.color + (transform as TransformColor).color) / 2;

      if (i > 20) {
        this.plotColor(this.x, this.y, this.color);
      }
    }
  }

  render(image: ImageData): void {
    for (var x = 0; x < image.width; x++) {
      for (var y = 0; y < image.height; y++) {
        const hIndex = histIndex(x, y, image.width);

        // NOTE: Calculating the scaling factor for accumulated color value to final
        // pixel coloring is very involved (gamma, vibrancy, etc.). This scaling implementation
        // is only intended to approximate the reference parameters.
        const aScale =
          Math.log10(this.alpha[hIndex]) / (this.alpha[hIndex] * 1.5);

        const iIdx = imageIndex(x, y, this.size);
        image.data[iIdx + 0] = this.red[hIndex] * aScale * 0xff;
        image.data[iIdx + 1] = this.green[hIndex] * aScale * 0xff;
        image.data[iIdx + 2] = this.blue[hIndex] * aScale * 0xff;
        image.data[iIdx + 3] = this.alpha[hIndex] * aScale * 0xff;
      }
    }
  }
}

export const transform1ColorValue = 0;
export const transform1Color = new TransformColor(
  transform1Post.coefs,
  transform1Post.variations,
  transform1Post.post,
  transform1ColorValue
);
export const transform2ColorValue = 0.844;
export const transform2Color = new TransformColor(
  transform2Post.coefs,
  transform2Post.variations,
  transform2Post.post,
  transform2ColorValue
);

export const transform3ColorValue = 0.349;
export const transform3Color = new TransformColor(
  transform3Post.coefs,
  transform3Post.variations,
  transform3Post.post,
  transform3ColorValue
);

export const transformFinalColorValue = 0;
export const transformFinalColor = new TransformColor(
  transformFinal.coefs,
  transformFinal.variations,
  transformFinal.post,
  transformFinalColorValue
);

// Copied from the reference parameters
export const paletteHex =
  "7E3037762C45722B496E2A4E6A29506728536527546326565C265C5724595322574D2155482153462050451F4E441E4D431E4C3F1E473F1E453F1E433F1E3F3F1E3B3E1E393E1E37421D36431C38451C3A471B3B491B3C4A1A3C4B1A3D4D1A3E4F19405318435517445817465A16475D15495E154960154A65134E6812506B12526E1153711055720F55740F55770E577A0E59810C58840B58880A588B09588F08589107569307559A05539D0451A1034FA5024BA90147AA0046AC0045B00242B4043DBB0634BE082EC20A29C30B27C50C26C90F1DCC1116D32110D6280EDA300CDC380ADF4109E04508E24A08E45106E75704EA6402EC6B01EE7300EE7600EF7A00F07E00F18300F29000F29300F39600F39900F39C00F3A000F3A100F3A201F2A502F1A805F0A906EFAA08EEA909EEA80AEDA60CEBA50FE5A313E1A113DD9F13DB9E13D99D14D49C15D09815CC9518C79318BE8B1ABB891BB9871DB4811FB07D1FAB7621A671239C6227975C289256299053298E502A89482C853F2D803A2E7E3037762C45742B47722B496E2A4E6A29516728536326565C265C5724595322575022564E2255482153452050451F4E431E4C3F1E473E1D463D1D453F1E43411E413F1E3B3E1E37421D36421D38431D3B451C3A471B3A491B3C4B1A3D4D1A3E4F19405318435418445518455817465A16475D154960154A65134E66124F6812506B12526E1153711055740F55770E577A0E597E0D57810C58840B58880A588B09588F08589307559A05539C04529E0452A1034FA5024BA90147AC0045B00242B4043DB7053ABB0634BE0831C20A29C50C26C90F1DCC1116D01711D32110D72A0EDA300CDD390ADF4109E24A08E45106E75704E95F03EA6402EC6C01EE7300EF7A00F07E00F18300F28900F29000F39300F39600F39C00F3A000F3A100F3A201F2A502F2A503F1A805F0A807EFAA08EEA80AEDA60CEBA50FE9A411E5A313E1A113DD9F13D99D14D49C15D09815CC9518C79318C38F1ABE8B1AB9871DB4811FB07D1FAB7621A67123A16A249C6227975E289256298E502A89482C853F2D803A2E";

// https://stackoverflow.com/a/34356351
export function hexToBytes(hex: string) {
  var bytes = [];
  for (var i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }

  return bytes;
}

export const paletteBytes = hexToBytes(paletteHex);

/**
 * Re-scale pixel color values to the range [0, 1], done to match
 * 'flam3_get_palette'
 */
export const paletteNumber = paletteBytes.map((b) => b / 0xff);

export function buildColor(size: number) {
  return new RendererColor(
    size,
    [
      [transform1Weight, transform1Color],
      [transform2Weight, transform2Color],
      [transform3Weight, transform3Color],
    ],
    transformFinalColor,
    paletteNumber
  );
}
