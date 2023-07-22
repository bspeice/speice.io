import * as fs from "fs/promises";
import { createCanvas } from "canvas";
import { DEFAULT_SIZE, RenderParams } from "./0-utility.js";
import { paramsGasket } from "./1-gasket.js";
import { paramsBaseline } from "./2a-baseline.js";
import { paramsPost } from "./2b-post.js";
import { paramsFinal } from "./2c-final.js";
import { paramsBinary } from "./3a-binary.js";
import { paramsLinear } from "./3b-linear.js";
import { paramsLogarithmic } from "./3c-logarithmic.js";
import { paramsColor } from "./4-color.js";
import { paramsGasketFlame } from "./5a-gasket.js";
import { paramsSolo1, paramsSolo2, paramsSolo3 } from "./5b-solo.js";

export type OfflineParams = RenderParams & { filename: string };

const paramsAll: OfflineParams[] = [
  { filename: "images/1-gasket.png", ...paramsGasket },
  { filename: "images/2a-baseline.png", ...paramsBaseline },
  { filename: "images/2b-post.png", ...paramsPost },
  { filename: "images/2c-final.png", ...paramsFinal },
  { filename: "images/3a-binary.png", ...paramsBinary },
  { filename: "images/3b-linear.png", ...paramsLinear },
  { filename: "images/3c-logarithmic.png", ...paramsLogarithmic },
  { filename: "images/4-color.png", ...paramsColor },
  { filename: "images/5a-gasket.png", ...paramsGasketFlame },
  { filename: "images/5b-solo1.png", ...paramsSolo1 },
  { filename: "images/5b-solo2.png", ...paramsSolo2 },
  { filename: "images/5b-solo3.png", ...paramsSolo3 },
];

for (const param of paramsAll) {
  const render = param.renderer(DEFAULT_SIZE);
  render.run(param.quality);

  const canvas = createCanvas(DEFAULT_SIZE, DEFAULT_SIZE);
  const ctx = canvas.getContext("2d");
  const data = ctx.createImageData(DEFAULT_SIZE, DEFAULT_SIZE);

  render.render(data as any);
  ctx.putImageData(data, 0, 0);

  const buffer = canvas.toBuffer();
  await fs.writeFile(param.filename, buffer);
}
