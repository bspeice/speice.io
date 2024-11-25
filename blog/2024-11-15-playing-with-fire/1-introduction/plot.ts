export function plot(x: number, y: number, image: ImageData) {
    // Translate (x,y) coordinates to pixel coordinates.
    // The display range we care about is x=[0, 1], y=[0, 1],
    // so our pixelX and pixelY coordinates are easy to calculate:
    const pixelX = Math.floor(x * image.width);
    const pixelY = Math.floor(y * image.height);

    // If we have an (x,y) coordinate outside the display range,
    // skip it
    if (
        pixelX < 0 ||
        pixelX > image.width ||
        pixelY < 0 ||
        pixelY > image.height
    ) {
        return;
    }

    // ImageData is an array that contains four bytes per pixel
    // (one for each of the red, green, blue, and alpha values).
    // The (pixelX, pixelY) coordinates are used to find where
    // in the image we need to write.
    const index = pixelY * (image.width * 4) + pixelX * 4;

    // Set the pixel to black by writing a 0 to the first three
    // bytes (red, green, blue), and 256 to the last byte (alpha),
    // starting at our index:
    image.data[index] = 0;
    image.data[index + 1] = 0;
    image.data[index + 2] = 0;
    image.data[index + 3] = 0xff;
}