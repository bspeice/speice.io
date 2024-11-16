/**
 * Generate a uniform random number in the range (-1, 1)
 * 
 * @returns
 */
export function randomBiUnit() {
  return Math.random() * 2 - 1;
}

/**
 * Generate a uniform random integer in the range [min, max)
 * 
 * @param min 
 * @param max 
 * @returns 
 */
export function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// https://stackoverflow.com/a/34356351
export function hexToBytes(hex: string) {
  var bytes = [];
  for (var i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }

  return bytes;
}