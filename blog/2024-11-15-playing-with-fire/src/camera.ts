/**
 * Translate values in the flame coordinate system to pixel coordinates
 *
 * The way `flam3` actually calculates the "camera" for mapping a point
 * to its pixel coordinate is fairly involved - it also needs to calculate
 * zoom and rotation (see the bucket accumulator code in rect.c).
 * We simplify things here by assuming a square image
 *
 * The reference parameters were designed in Apophysis, which uses the
 * range [-2, 2] by default (the `scale` parameter in XML defines the
 * "pixels per unit", and with the default zoom, is chosen to give a
 * range of [-2, 2]).
 *
 * @param x point in the range [-2, 2]
 * @param y point in the range [-2, 2]
 * @param size image width/height in pixels
 * @returns pair of pixel coordinates
 */
export function camera(x: number, y: number, size: number): [number, number] {
    return [Math.floor(((x + 2) * size) / 4), Math.floor(((y + 2) * size) / 4)];
}

/**
 * Translate values in pixel coordinates to a 1-dimensional array index
 *
 * Unlike the camera function, this mapping doesn't assume a square image,
 * and only requires knowing the image width.
 *
 * The stride parameter is used to calculate indices that take into account
 * how many "values" each pixel has. For example, in an ImageData, each pixel
 * has a red, green, blue, and alpha component per pixel, so a stride of 4
 * is appropriate. For situations where there are separate red/green/blue/alpha
 * arrays per pixel, a stride of 1 is appropriate
 *
 * @param x point in the range [0, size)
 * @param y point in the range [0, size)
 * @param width width of image in pixel units
 * @param stride values per pixel coordinate
 */
export function histIndex(x: number, y: number, width: number, stride: number): number {
    return y * (width * stride) + x * stride;
}