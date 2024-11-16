import { Variation } from "./types";

export const linear: Variation = (x, y) => [x, y];

function r(x: number, y: number) {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

function theta(x: number, y: number) {
  return Math.atan2(x, y);
}

function omega(): number {
  return Math.random() > 0.5 ? Math.PI : 0;
}

export const julia: Variation = (x, y) => {
  const sqrtR = Math.sqrt(r(x, y));
  const thetaVal = theta(x, y) / 2 + omega();
  return [sqrtR * Math.cos(thetaVal), sqrtR * Math.sin(thetaVal)];
};

export const popcorn: Variation = (x, y, transformCoefs) => {
  return [
    x + transformCoefs.c * Math.sin(Math.tan(3 * y)),
    y + transformCoefs.f * Math.sin(Math.tan(3 * x)),
  ];
};

export const pdj: (
  pdjA: number,
  pdjB: number,
  pdjC: number,
  pdjD: number
) => Variation = (pdjA, pdjB, pdjC, pdjD) => {
  return (x, y) => [
    Math.sin(pdjA * y) - Math.cos(pdjB * x),
    Math.sin(pdjC * x) - Math.cos(pdjD * y),
  ];
};
