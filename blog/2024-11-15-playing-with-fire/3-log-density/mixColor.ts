export function mixColor(
  color1: number,
  color2: number,
  colorSpeed: number
) {
  return color1 * (1 - colorSpeed) +
    color2 * colorSpeed;
}