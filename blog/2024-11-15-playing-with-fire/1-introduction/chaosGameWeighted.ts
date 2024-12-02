// hidden-start
import { randomBiUnit } from "../src/randomBiUnit";
import { randomChoice } from "../src/randomChoice";
import { plot } from "./plot"
import {Transform} from "../src/transform";
const iterations = 50_000;
const step = 1000;
// hidden-end
export type ChaosGameWeightedProps = {
    width: number,
    height: number,
    transforms: [number, Transform][]
}
export function* chaosGameWeighted({width, height, transforms}: ChaosGameWeightedProps) {
    let image = new ImageData(width, height);
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