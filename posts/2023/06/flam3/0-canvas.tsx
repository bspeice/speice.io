import React, { useEffect, useRef } from "react";
import { Renderer } from "./0-utility";

export type CanvasParams = {
  defaultUrl: string;
  size: number;
  qualityMax: number;
  qualityStep: number;
  renderer: (size: number) => Renderer;
};

export const CanvasRenderer: React.FC<{ params: CanvasParams }> = ({
  params,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  var qualityCurrent: number = 0;
  var rendererCurrent: Renderer = params.renderer(params.size);

  const animate = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) {
      return;
    }

    const image = ctx.createImageData(params.size, params.size);
    rendererCurrent.run(params.qualityStep);
    rendererCurrent.render(image);
    ctx.putImageData(image, 0, 0);

    if (qualityCurrent < params.qualityMax) {
      qualityCurrent += params.qualityStep;
      requestAnimationFrame(animate);
    }
  };

  const reset = () => {
    qualityCurrent = 0;
    rendererCurrent = params.renderer(params.size);
    requestAnimationFrame(animate);
  };

  useEffect(() => {
    if (canvasRef.current) {
      requestAnimationFrame(animate);
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={params.size}
      height={params.size}
      onClick={reset}
    />
  );
};
