import React, { useEffect, useRef } from "react";
import { renderFn } from "./0-utility";

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
