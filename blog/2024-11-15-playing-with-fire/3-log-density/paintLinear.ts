export function paintLinear(width: number, histogram: Uint32Array): ImageData {
    const image = new ImageData(width, histogram.length / width);

    let countMax = 0;
    for (let value of histogram) {
        countMax = Math.max(countMax, value);
    }

    for (let i = 0; i < histogram.length; i++) {
        const pixelIndex = i * 4;
        image.data[pixelIndex] = 0; // red
        image.data[pixelIndex + 1] = 0; // green
        image.data[pixelIndex + 2] = 0; // blue
        image.data[pixelIndex + 3] = Number(histogram[i]) / countMax * 0xff;
    }

    return image;
}