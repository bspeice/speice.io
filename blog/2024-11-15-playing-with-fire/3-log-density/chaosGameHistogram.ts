import {plot} from "./plotHistogram";
import {randomBiUnit} from "../src/randomBiUnit";
import {randomChoice} from "../src/randomChoice";
import {buildTransform} from "../2-transforms/buildTransform";
import {transformPost} from "../2-transforms/post";
import {transforms} from "../2-transforms/FlameFinal";
import * as params from "../src/params";

const finalTransform = buildTransform(params.xformFinalCoefs, params.xformFinalVariations);
const finalTransformPost = transformPost(finalTransform, params.xformFinalCoefsPost);

const step = 1000;
const quality = 1;

export function* chaosGameHistogram(width: number, height: number) {
    let iterations = quality * width * height;
    let histogram = new Uint32Array(width * height);

    let [x, y] = [randomBiUnit(), randomBiUnit()];

    for (let i = 0; i < iterations; i++) {
        const [_, transform] = randomChoice(transforms);
        [x, y] = transform(x, y);
        [x, y] = finalTransformPost(x, y);

        if (i > 20)
            plot(x, y, width, histogram);

        if (i % step === 0)
            yield histogram;
    }

    yield histogram;
}