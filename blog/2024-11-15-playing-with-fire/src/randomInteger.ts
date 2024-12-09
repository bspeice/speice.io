export function randomInteger(
    min: number,
    max: number
) {
    let v = Math.random() * (max - min);
    return Math.floor(v) + min;
}