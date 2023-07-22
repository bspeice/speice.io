import React, { useEffect, useRef, useState } from "react";
import { DEFAULT_SIZE, RenderParams, Renderer } from "./0-utility.js";
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

// @ts-expect-error: Vite URL import
import urlGasket from "./images/1-gasket.png";
// @ts-expect-error: Vite URL import
import urlBaseline from "./images/2a-baseline.png";
// @ts-expect-error: Vite URL import
import urlPost from "./images/2b-post.png";
// @ts-expect-error: Vite URL import
import urlFinal from "./images/2c-final.png";
// @ts-expect-error: Vite URL import
import urlBinary from "./images/3a-binary.png";
// @ts-expect-error: Vite URL import
import urlLinear from "./images/3b-linear.png";
// @ts-expect-error: Vite URL import
import urlLogarithmic from "./images/3c-logarithmic.png";
// @ts-expect-error: Vite URL import
import urlColor from "./images/4-color.png";
// @ts-expect-error: Vite URL import
import urlGasketFlame from "./images/5a-gasket.png";
// @ts-expect-error: Vite URL import
import urlSolo1 from "./images/5b-solo1.png";
// @ts-expect-error: Vite URL import
import urlSolo2 from "./images/5b-solo2.png";
// @ts-expect-error: Vite URL import
import urlSolo3 from "./images/5b-solo3.png";

export const DEFAULT_STEP: number = 0.1;

export type CanvasParams = RenderParams & { url: string };

export const CanvasRenderer: React.FC<CanvasParams> = (params) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [useUrl, setUseUrl] = useState(true);

  var qualityCurrent: number = 0;
  var rendererCurrent: Renderer = params.renderer(DEFAULT_SIZE);

  const animate = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) {
      console.log("Ref not ready");
      requestAnimationFrame(animate);
      return;
    }

    const image = ctx.createImageData(DEFAULT_SIZE, DEFAULT_SIZE);
    rendererCurrent.run(DEFAULT_STEP);
    rendererCurrent.render(image);
    ctx.putImageData(image, 0, 0);

    if (qualityCurrent < params.quality) {
      qualityCurrent += DEFAULT_STEP;
      requestAnimationFrame(animate);
    }
  };

  const useCanvas = () => {
    setUseUrl(false);
    requestAnimationFrame(animate);
  };

  const reset = () => {
    qualityCurrent = 0;
    rendererCurrent = params.renderer(DEFAULT_SIZE);
    requestAnimationFrame(animate);
  };

  return (
    <>
      <img src={params.url} onClick={useCanvas} hidden={!useUrl} />
      <canvas
        ref={canvasRef}
        width={DEFAULT_SIZE}
        height={DEFAULT_SIZE}
        onClick={reset}
        hidden={useUrl}
      />
    </>
  );
};

export const CanvasGasket: React.FC<{}> = () =>
  CanvasRenderer({ url: urlGasket, ...paramsGasket });
export const CanvasBaseline: React.FC<{}> = () =>
  CanvasRenderer({ url: urlBaseline, ...paramsBaseline });
export const CanvasPost: React.FC<{}> = () =>
  CanvasRenderer({ url: urlPost, ...paramsPost });
export const CanvasFinal: React.FC<{}> = () =>
  CanvasRenderer({ url: urlFinal, ...paramsFinal });
export const CanvasBinary: React.FC<{}> = () =>
  CanvasRenderer({ url: urlBinary, ...paramsBinary });
export const CanvasLinear: React.FC<{}> = () =>
  CanvasRenderer({ url: urlLinear, ...paramsLinear });
export const CanvasLogarithmic: React.FC<{}> = () =>
  CanvasRenderer({ url: urlLogarithmic, ...paramsLogarithmic });
export const CanvasColor: React.FC<{}> = () =>
  CanvasRenderer({ url: urlColor, ...paramsColor });
export const CanvasGasketFlame: React.FC<{}> = () =>
  CanvasRenderer({ url: urlGasketFlame, ...paramsGasketFlame });
export const CanvasSolo1: React.FC<{}> = () =>
  CanvasRenderer({ url: urlSolo1, ...paramsSolo1 });
export const CanvasSolo2: React.FC<{}> = () =>
  CanvasRenderer({ url: urlSolo2, ...paramsSolo2 });
export const CanvasSolo3: React.FC<{}> = () =>
  CanvasRenderer({ url: urlSolo3, ...paramsSolo3 });
