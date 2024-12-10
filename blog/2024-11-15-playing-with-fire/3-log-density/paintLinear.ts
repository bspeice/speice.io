export function paintLinear(width: number, height: number, histogram: number[]): ImageData {
    const image = new ImageData(width, height);

    let valueMax = 0;
    for (let value of histogram) {
        valueMax = Math.max(valueMax, value);
    }

    for (let i = 0; i < histogram.length; i++) {
        const pixelIndex = i * 4;
        image.data[pixelIndex] = 0;
        image.data[pixelIndex + 1] = 0;
        image.data[pixelIndex + 2] = 0;
        image.data[pixelIndex + 3] = histogram[i] / valueMax * 0xff;
    }

    return image;
}