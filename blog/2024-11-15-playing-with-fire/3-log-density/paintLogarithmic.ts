export function paintLogarithmic(width: number, height: number, histogram: number[]): ImageData {
    const image = new ImageData(width, height);

    const histogramLog = new Array<number>();
    histogram.forEach(value => histogramLog.push(Math.log(value)));

    let histogramLogMax = -Infinity;
    for (let value of histogramLog) {
        histogramLogMax = Math.max(histogramLogMax, value);
    }

    for (let i = 0; i < histogram.length; i++) {
        const pixelIndex = i * 4;
        image.data[pixelIndex] = 0; // red
        image.data[pixelIndex + 1] = 0; // green
        image.data[pixelIndex + 2] = 0; // blue
        image.data[pixelIndex + 3] = histogramLog[i] / histogramLogMax * 0xff;
    }

    return image;
}