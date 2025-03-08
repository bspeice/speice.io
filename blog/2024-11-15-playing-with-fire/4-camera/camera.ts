export function camera(
    x: number,
    y: number,
    width: number,
    height: number,
    scale: number,
    zoom: number,
    rotate: number,
    offsetX: number,
    offsetY: number,
): [number, number] {
    const zoomFactor = Math.pow(2, zoom);

    // Zoom, offset, and rotation are
    // applied in IFS coordinates
    [x, y] = [
        (x - offsetX) * zoomFactor,
        (y - offsetY) * zoomFactor,
    ];

    [x, y] = [
        x * Math.cos(rotate) -
        y * Math.sin(rotate),
        x * Math.sin(rotate) +
        y * Math.cos(rotate),
    ]

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
