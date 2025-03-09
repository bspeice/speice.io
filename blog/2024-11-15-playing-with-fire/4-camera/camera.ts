export function camera(
    x: number,
    y: number,
    width: number,
    height: number,
    positionX: number,
    positionY: number,
    rotate: number,
    zoom: number,
    scale: number,
): [number, number] {
    // Position, rotation, and zoom are
    // applied in IFS coordinates
    [x, y] = [
        (x - positionX),
        (y - positionY),
    ];

    [x, y] = [
        x * Math.cos(rotate) -
        y * Math.sin(rotate),
        x * Math.sin(rotate) +
        y * Math.cos(rotate),
    ];

    [x, y] = [
      x * Math.pow(2, zoom),
      y * Math.pow(2, zoom)
    ];

    // Scale transforms IFS coordinates
    // to pixel coordinates. Shift by half
    // the image width and height
    // to compensate for IFS coordinates
    // being symmetric around the origin
    return [
        Math.floor(x * scale + width / 2),
        Math.floor(y * scale + height / 2)
    ];
}
