// hidden-start
import {Props as ChaosGameFinalProps} from "../2-transforms/chaosGameFinal";
import {randomBiUnit} from "../src/randomBiUnit";
import {randomChoice} from "../src/randomChoice";
import {camera, histIndex} from "../src/camera";
import {colorFromPalette, paintColor} from "./paintColor";

const quality = 15;
const step = 100_000;
// hidden-end
export type TransformColor = {
    color: number;
    colorSpeed: number;
}

function mixColor(color1: number, color2: number, colorSpeed: number) {
    return color1 * (1 - colorSpeed) + color2 * colorSpeed;
}

export type Props = ChaosGameFinalProps & {
    palette: number[];
    colors: TransformColor[];
    finalColor: TransformColor;
}
export function* chaosGameColor({width, height, transforms, final, palette, colors, finalColor}: Props) {
    let currentColor = Math.random();
    const red = Array<number>(width * height).fill(0);
    const green = Array<number>(width * height).fill(0);
    const blue = Array<number>(width * height).fill(0);
    const alpha = Array<number>(width * height).fill(0);

    let [x, y] = [randomBiUnit(), randomBiUnit()];

    const iterations = width * height * quality;
    for (let i = 0; i < iterations; i++) {
        const [transformIndex, transform] = randomChoice(transforms);
        [x, y] = transform(x, y);
        const [finalX, finalY] = final(x, y);

        if (i > 20) {
            const [pixelX, pixelY] = camera(finalX, finalY, width);
            const pixelIndex = histIndex(pixelX, pixelY, width, 1);

            if (pixelIndex < 0 || pixelIndex >= alpha.length)
                continue;

            const transformColor = colors[transformIndex];
            currentColor = mixColor(currentColor, transformColor.color, transformColor.colorSpeed);

            const colorFinal = mixColor(currentColor, finalColor.color, finalColor.colorSpeed);
            const [r, g, b] = colorFromPalette(palette, colorFinal);
            red[pixelIndex] += r;
            green[pixelIndex] += g;
            blue[pixelIndex] += b;
            alpha[pixelIndex] += 1;
        }

        if (i % step === 0)
            yield paintColor(width, height, red, green, blue, alpha);
    }

    yield paintColor(width, height, red, green, blue, alpha);
}