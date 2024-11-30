// hidden-start
import { randomBiUnit } from "../src/randomBiUnit";
import { randomChoice } from "../src/randomChoice";
import { plotBinary as plot } from "../src/plotBinary"
import {Transform} from "../src/transform";
const iterations = 500_000;
const step = 1000;
// hidden-end
export function* chaosGameFinal(width: number, height: number, transforms: [number, Transform][], final: Transform) {
    let image = new ImageData(width, height);
    let [x, y] = [randomBiUnit(), randomBiUnit()];

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