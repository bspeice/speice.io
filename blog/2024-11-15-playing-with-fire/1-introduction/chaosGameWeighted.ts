// hidden-start
import { randomBiUnit } from "../src/randomBiUnit";
import { randomChoice } from "../src/randomChoice";
import { plot } from "./plot"
import {Transform} from "../src/transform";
const iterations = 50_000;
const step = 1000;
// hidden-end
export function* chaosGameWeighted(transforms: [number, Transform][]) {
    let image = new ImageData(500, 500);
    var [x, y] = [randomBiUnit(), randomBiUnit()];

    for (let i = 0; i < iterations; i++) {
        // highlight-start
        const [_, transform] = randomChoice(transforms);
        // highlight-end
        [x, y] = transform(x, y);

        if (i > 20)
            plot(x, y, image);

        if (i % step === 0)
            yield image;
    }

    yield image;
}