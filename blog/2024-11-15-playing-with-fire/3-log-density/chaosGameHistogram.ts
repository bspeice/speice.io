// hidden-start
import {randomBiUnit} from "../src/randomBiUnit";
import {randomChoice} from "../src/randomChoice";
import {Props as ChaosGameFinalProps} from "../2-transforms/chaosGameFinal";
import {camera, histIndex} from "../src/camera";

const quality = 10;
const step = 100_000;
// hidden-end
export type Props = ChaosGameFinalProps & {
    paint: (width: number, height: number, histogram: number[]) => ImageData;
}
export function* chaosGameHistogram({width, height, transforms, final, paint}: Props) {
    let iterations = quality * width * height;

    // highlight-start
    const histogram = Array<number>(width * height).fill(0);
    // highlight-end

    let [x, y] = [randomBiUnit(), randomBiUnit()];

    for (let i = 0; i < iterations; i++) {
        const [_, transform] = randomChoice(transforms);
        [x, y] = transform(x, y);
        const [finalX, finalY] = final(x, y);

        if (i > 20) {
            // highlight-start
            const [pixelX, pixelY] = camera(finalX, finalY, width);
            const hIndex = histIndex(pixelX, pixelY, width, 1);

            if (hIndex < 0 || hIndex >= histogram.length) {
                continue;
            }

            histogram[hIndex] += 1;
            // highlight-end
        }

        if (i % step === 0)
            yield paint(width, height, histogram);
    }

    yield paint(width, height, histogram);
}