export function colorFromPalette(palette: number[], colorIndex: number): [number, number, number] {
    const paletteIndex = Math.floor(colorIndex * (palette.length / 3)) * 3;
    return [palette[paletteIndex], palette[paletteIndex + 1], palette[paletteIndex + 2]];
}