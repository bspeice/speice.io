import {ChaosGameFinalProps} from "../2-transforms/chaosGameFinal";
import {randomBiUnit} from "../src/randomBiUnit";
import {randomChoice} from "../src/randomChoice";
import {camera, histIndex} from "../src/camera";
import {colorFromPalette, paintColor} from "./color";

type ChaosGameHistogramProps = ChaosGameFinalProps & {
    palette: number[];
    colors: number[];
}
export function* chaosGameColor({width, height, transforms, final, palette, colors, quality, step}: ChaosGameHistogramProps) {
    let iterations = (quality ?? 1) * width * height;
    step = step ?? 100_000;

    let currentColor = Math.random();
    const red = Array(width * height).fill(0);
    const green = Array(width * height).fill(0);
    const blue = Array(width * height).fill(0);
    const alpha = Array(width * height).fill(0);

    let [x, y] = [randomBiUnit(), randomBiUnit()];

    for (let i = 0; i < iterations; i++) {
        const [transformIndex, transform] = randomChoice(transforms);
        [x, y] = transform(x, y);

        const [finalX, finalY] = final(x, y);

        if (i > 20) {
            const [pixelX, pixelY] = camera(finalX, finalY, width);
            const pixelIndex = histIndex(pixelX, pixelY, width, 1);

            if (pixelIndex < 0 || pixelIndex >= alpha.length)
                continue;

            currentColor = (currentColor + colors[transformIndex]) / 2;
            const [r, g, b] = colorFromPalette(palette, currentColor);
            red[pixelIndex] += r;
            green[pixelIndex] += g;
            blue[pixelIndex] += b;
            alpha[pixelIndex] += 1;
        }

        if (i % step === 0)
            yield paintColor(width, height, red, green, blue, alpha);
    }

    yield paintColor(width, height, red, green, blue, alpha);
}