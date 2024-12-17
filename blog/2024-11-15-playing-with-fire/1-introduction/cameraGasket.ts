export function camera(
  x: number,
  y: number,
  size: number
): [number, number] {
  return [
    Math.floor(x * size),
    Math.floor(y * size)
  ];
}