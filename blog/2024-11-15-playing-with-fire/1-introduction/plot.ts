export function imageIndex(x: number, y: number, width: number, stride: number): number {
    return y * (width * stride) + x * 4;
}

export class Plotter {
    private readonly pixels: Array<boolean>;

    constructor(private readonly width: number, private readonly height: number) {
        this.pixels = new Array(width * height).fill(false);
    }

    public plot(x: number, y: number) {
        // Translate (x,y) coordinates to pixel coordinates.
        // The display range we care about is x=[0, 1], y=[0, 1],
        // so our pixelX and pixelY coordinates are easy to calculate:
        const pixelX = Math.floor(x * this.width);
        const pixelY = Math.floor(y * this.height);

        // Translate the pixel coordinates into an index
        const pixelIndex = imageIndex(pixelX, pixelY, this.width, 1);

        // If the index is valid, enable that pixel
        if (0 <= pixelIndex && pixelIndex < this.pixels.length) {
            this.pixels[pixelIndex] = true;
        }
    }

    public paint(image: ImageData) {
        // "Paint" all our pixels by setting their value to black
        for (var pixelIndex = 0; pixelIndex < this.pixels.length; pixelIndex++) {
            if (this.pixels[pixelIndex]) {
                const imageIndex = pixelIndex * 4;
                image.data[imageIndex] = 0; // red
                image.data[imageIndex + 1] = 0; // green
                image.data[imageIndex + 2] = 0; // blue
                image.data[imageIndex + 3] = 0xff; // alpha
            }
        }
    }
}