// hidden-start
import { randomBiUnit } from "../src/randomBiUnit";
import { randomChoice } from "../src/randomChoice";
import { plotBinary as plot } from "../src/plotBinary"
import {Transform} from "../src/transform";
import {Props as ChaosGameWeightedProps} from "../1-introduction/chaosGameWeighted";

const quality = 0.5;
const step = 1000;
// hidden-end
export type Props = ChaosGameWeightedProps & {
    final: Transform,
}
export function* chaosGameFinal({width, height, transforms, final}: Props) {
    let image = new ImageData(width, height);
    let [x, y] = [randomBiUnit(), randomBiUnit()];

    const iterations = width * height * quality;
    for (let i = 0; i < iterations; i++) {
        const [_, transform] = randomChoice(transforms);
        [x, y] = transform(x, y);

        // highlight-start
        const [finalX, finalY] = final(x, y);
        // highlight-end

        if (i > 20)
            // highlight-start
            plot(finalX, finalY, image);
            // highlight-end

        if (i % step === 0)
            yield image;
    }

    yield image;
}