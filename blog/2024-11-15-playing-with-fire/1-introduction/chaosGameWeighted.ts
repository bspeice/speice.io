// hidden-start
import { randomBiUnit } from "../src/randomBiUnit";
import { randomChoice } from "../src/randomChoice";
import { plot } from "./plot"
export type Transform = (x: number, y: number) => [number, number];
export type Params = {
    transforms: [number, Transform][],
    image: ImageData,
    iterations: number,
    step: number
}
// hidden-end
export function* chaosGameWeighted({transforms, image, iterations, step}: Params) {
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