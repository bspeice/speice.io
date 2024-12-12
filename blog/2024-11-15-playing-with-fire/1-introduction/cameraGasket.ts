export function camera(
    size: number,
    x: number,
    y: number
): [number, number] {
    return [
        Math.floor(x * size),
        Math.floor(y * size)
    ];
}