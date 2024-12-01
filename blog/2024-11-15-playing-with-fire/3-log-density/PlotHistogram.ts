// hidden-start
import {VictoryChart} from "victory";
import {camera, histIndex} from "../src/camera";
// hidden-end
export class PlotHistogram {
    public readonly pixels: Uint32Array;

    public constructor(private readonly width: number, height: number) {
        this.pixels = new Uint32Array(width * height);
    }

    public plot(x: number, y: number) {
        const [pixelX, pixelY] = camera(x, y, this.width);
        const pixelIndex = histIndex(pixelX, pixelY, this.width, 1);
        this.pixels[pixelIndex] += 1;
    }

    public getHistogram() {
        const data = new Map<number, number>();
        this.pixels.forEach(value => {
            const bucket = 32 - Math.clz32(value);

            if (bucket in data) {
                data[bucket] += 1;
            } else {
                data[bucket] = 1;
            }
        })

        const output: {x: number, y: number}[] = [];
        data.forEach((bucket, value) =>
            output.push({x: Math.pow(bucket, 2), y: value}));
        return output;
    }
}