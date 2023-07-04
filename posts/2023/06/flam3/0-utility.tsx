import React, { useEffect, useRef } from "react";

export type renderFn = (image: ImageData) => void;

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

export function randomBiUnit() {
  // Math.random() produces a number in the range [0, 1),
  // scale to (-1, 1)
  return Math.random() * 2 - 1;
}

export function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min;
}

export function weightedChoice<T>(choices: [number, T][]): [number, T] {
  const weightSum = choices.reduce(
    (current, [weight, _t]) => current + weight,
    0
  );
  var choice = Math.random() * weightSum;

  for (var i = 0; i < choices.length; i++) {
    const [weight, t] = choices[i];
    if (choice < weight) {
      return [i, t];
    }

    choice -= weight;
  }

  throw "unreachable";
}

export function imageIndex(x: number, y: number, width: number) {
  // Taken from: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Pixel_manipulation_with_canvas
  return y * (width * 4) + x * 4;
}

export function histIndex(x: number, y: number, width: number) {
  return y * width + x;
}
