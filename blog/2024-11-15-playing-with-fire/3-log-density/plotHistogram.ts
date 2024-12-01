// hidden-start
import {camera, histIndex} from "../src/camera";
// hidden-end
export function plot(x: number, y: number, width: number, hitCount: Uint32Array) {
    const [pixelX, pixelY] = camera(x, y, width);
    const pixelIndex = histIndex(pixelX, pixelY, width, 1);
    hitCount[pixelIndex] += 1;
}

export type PlotData = {x: number, y: number}[];
export function plotHistogram(hitCount: Uint32Array) {
    const data = new Map<number, number>();
    hitCount.forEach(value => {
        const bucket = 32 - Math.clz32(value);
        const currentCount = data.get(bucket) ?? 0;
        data.set(bucket, currentCount + 1);
    })

    const output: PlotData = [];
    data.forEach((value, bucket) =>
        output.push({x: Math.pow(2, bucket), y: value}));
    return output;
}