import { PainterContext, SquareCanvas } from "../src/Canvas";
import { useContext, useEffect } from "react";

export function Render({ f }) {
  const { width, height, setPainter } = useContext(PainterContext);
  useEffect(() => {
    if (width && height) {
      const painter = f({ width, height });
      setPainter(painter);
    }
  }, [width, height]);
  return <></>;
}

export default function Gasket({ f }) {
  return (
    <SquareCanvas name={"gasket"}>
      <Render f={f} />
    </SquareCanvas>
  );
}