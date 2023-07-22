import { RenderParams } from "./0-utility.js";
import { RendererFlame, Transform, linear } from "./2a-baseline.js";

export const transformGasket1 = new Transform(
  {
    a: 0.5,
    b: 0,
    c: 0,
    d: 0,
    e: 0.5,
    f: 0,
  },
  [[1, linear]]
);

export const transformGasket2 = new Transform(
  {
    a: 0.5,
    b: 0,
    c: 0.5,
    d: 0,
    e: 0.5,
    f: 0,
  },
  [[1, linear]]
);

export const transformGasket3 = new Transform(
  {
    a: 0.5,
    b: 0,
    c: 0,
    d: 0,
    e: 0.5,
    f: 0.5,
  },
  [[1, linear]]
);

export const transformGasket: [number, Transform][] = [
  [1 / 3, transformGasket1],
  [1 / 3, transformGasket2],
  [1 / 3, transformGasket3],
];

export const paramsGasketFlame: RenderParams = {
  quality: 1,
  renderer: (size) => new RendererFlame(size, transformGasket),
};
