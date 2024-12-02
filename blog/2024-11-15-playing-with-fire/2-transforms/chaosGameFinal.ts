// hidden-start
import { randomBiUnit } from "../src/randomBiUnit";
import { randomChoice } from "../src/randomChoice";
import { plotBinary as plot } from "../src/plotBinary"
import {Transform} from "../src/transform";
import {ChaosGameWeightedProps} from "../1-introduction/chaosGameWeighted";
// hidden-end
export type ChaosGameFinalProps = ChaosGameWeightedProps & {
    final: Transform,
    quality?: number,
    step?: number,
}
export function* chaosGameFinal({width, height, transforms, final, quality, step}: ChaosGameFinalProps) {
    let image = new ImageData(width, height);
    let [x, y] = [randomBiUnit(), randomBiUnit()];

    const iterations = (quality ?? 0.5) * width * height;
    step = step ?? 1000;

    for (let i = 0; i < iterations; i++) {
        const [_, transform] = randomChoice(transforms);
        [x, y] = transform(x, y);

        // highlight-start
        [x, y] = final(x, y);
        // highlight-end

        if (i > 20)
            plot(x, y, image);

        if (i % step === 0)
            yield image;
    }

    yield image;
}