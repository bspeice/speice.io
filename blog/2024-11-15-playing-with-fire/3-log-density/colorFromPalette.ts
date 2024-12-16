export function colorFromPalette(
  palette: number[],
  colorIndex: number
): [number, number, number] {
  const numColors = palette.length / 3;
  const paletteIndex = Math.floor(
    colorIndex * (numColors)
  ) * 3;
  return [
    palette[paletteIndex], // red
    palette[paletteIndex + 1], // green
    palette[paletteIndex + 2] // blue
  ];
}