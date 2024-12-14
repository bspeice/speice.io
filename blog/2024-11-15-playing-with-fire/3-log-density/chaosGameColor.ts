// hidden-start
import {Props as ChaosGameFinalProps} from "../2-transforms/chaosGameFinal";
import {randomBiUnit} from "../src/randomBiUnit";
import {randomChoice} from "../src/randomChoice";
import {camera, histIndex} from "../src/camera";
import {colorFromPalette} from "./colorFromPalette";
import {mixColor} from "./mixColor";
import {paintColor} from "./paintColor";

const quality = 15;
const step = 100_000;
// hidden-end
export type TransformColor = {
    color: number;
    colorSpeed: number;
}

export type Props = ChaosGameFinalProps & {
    palette: number[];
    colors: TransformColor[];
    finalColor: TransformColor;
}
export function* chaosGameColor({width, height, transforms, final, palette, colors, finalColor}: Props) {
    const imgRed = Array<number>(width * height).fill(0);
    const imgGreen = Array<number>(width * height).fill(0);
    const imgBlue = Array<number>(width * height).fill(0);
    const imgAlpha = Array<number>(width * height).fill(0);

    let [x, y] = [randomBiUnit(), randomBiUnit()];
    let c = Math.random();

    const iterations = width * height * quality;
    for (let i = 0; i < iterations; i++) {
        const [transformIndex, transform] = randomChoice(transforms);
        [x, y] = transform(x, y);

        // highlight-start
        const transformColor = colors[transformIndex];
        c = mixColor(c, transformColor.color, transformColor.colorSpeed);
        // highlight-end

        const [finalX, finalY] = final(x, y);

        if (i > 20) {
            const [pixelX, pixelY] = camera(finalX, finalY, width);
            const pixelIndex = histIndex(pixelX, pixelY, width, 1);

            if (pixelIndex < 0 || pixelIndex >= imgAlpha.length)
                continue;

            const colorFinal = mixColor(c, finalColor.color, finalColor.colorSpeed);
            const [r, g, b] = colorFromPalette(palette, colorFinal);
            imgRed[pixelIndex] += r;
            imgGreen[pixelIndex] += g;
            imgBlue[pixelIndex] += b;
            imgAlpha[pixelIndex] += 1;
        }

        if (i % step === 0)
            yield paintColor(width, height, imgRed, imgGreen, imgBlue, imgAlpha);
    }

    yield paintColor(width, height, imgRed, imgGreen, imgBlue, imgAlpha);
}