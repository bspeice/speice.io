// hidden-start
import {randomBiUnit} from "../src/randomBiUnit";
import {randomChoice} from "../src/randomChoice";
import {ChaosGameFinalProps} from "../2-transforms/chaosGameFinal";
import {camera, histIndex} from "../src/camera";
// hidden-end
export type ChaosGameHistogramProps = ChaosGameFinalProps & {
    paint: (width: number, histogram: Uint32Array) => ImageData;
}
export function* chaosGameHistogram({width, height, transforms, final, quality, step, paint}: ChaosGameHistogramProps) {
    let iterations = (quality ?? 1) * width * height;
    step = step ?? 100_000;

    const histogram = new Uint32Array(width * height);

    let [x, y] = [randomBiUnit(), randomBiUnit()];

    for (let i = 0; i < iterations; i++) {
        const [_, transform] = randomChoice(transforms);
        [x, y] = transform(x, y);
        const [finalX, finalY] = final(x, y);

        if (i > 20) {
            const [pixelX, pixelY] = camera(finalX, finalY, width);
            const pixelIndex = histIndex(pixelX, pixelY, width, 1);
            histogram[pixelIndex] += 1;
        }

        if (i % step === 0)
            yield paint(width, histogram);
    }

    yield paint(width, histogram);
}