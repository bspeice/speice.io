import React, { useEffect, useRef } from "react";
import { Renderer, renderFn } from "./0-utility";

export const Canvas: React.FC<{ f: renderFn }> = ({ f }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  let image: ImageData | null = null;
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return;
      }

      if (
        !image ||
        image.width !== canvas.width ||
        image.height !== canvas.height
      ) {
        image = ctx.createImageData(canvas.width, canvas.height);
      }

      f(image);

      ctx.putImageData(image, 0, 0);
    }
  });

  return <canvas ref={canvasRef} width={400} height={400} />;
};

export type CanvasParams = {
  defaultUrl: string;
  size: number;
  qualityMax: number;
  qualityStep: number;
  renderer: Renderer;
};

export const CanvasRenderer: React.FC<{ params: CanvasParams }> = ({
  params,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  var qualityCurrent: number = 0;

  const animate = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) {
      return;
    }

    const image = ctx.createImageData(params.size, params.size);
    params.renderer.run(params.qualityStep);
    params.renderer.render(image);
    ctx.putImageData(image, 0, 0);

    qualityCurrent += params.qualityStep;
    if (qualityCurrent < params.qualityMax) {
      requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (canvasRef.current) {
      requestAnimationFrame(animate);
    }
  }, []);

  return <canvas ref={canvasRef} width={params.size} height={params.size} />;
};
