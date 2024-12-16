import { useContext, useEffect, useState } from "react";
import { Transform } from "../src/transform";
import * as params from "../src/params";
import { PainterContext } from "../src/Canvas";
import { chaosGameFinal } from "./chaosGameFinal";
import { VariationEditor, VariationProps } from "./VariationEditor";
import { applyTransform } from "../src/applyTransform";
import { buildBlend } from "./buildBlend";

export default function FlameBlend() {
  const { width, height, setPainter } = useContext(PainterContext);

  const xform1VariationsDefault: VariationProps = {
    linear: 0,
    julia: 1,
    popcorn: 0,
    pdj: 0
  };
  const [xform1Variations, setXform1Variations] = useState(xform1VariationsDefault);
  const resetXform1Variations = () => setXform1Variations(xform1VariationsDefault);

  const xform2VariationsDefault: VariationProps = {
    linear: 1,
    julia: 0,
    popcorn: 1,
    pdj: 0
  };
  const [xform2Variations, setXform2Variations] = useState(xform2VariationsDefault);
  const resetXform2Variations = () => setXform2Variations(xform2VariationsDefault);

  const xform3VariationsDefault: VariationProps = {
    linear: 0,
    julia: 0,
    popcorn: 0,
    pdj: 1
  };
  const [xform3Variations, setXform3Variations] = useState(xform3VariationsDefault);
  const resetXform3Variations = () => setXform3Variations(xform3VariationsDefault);

  const identityXform: Transform = (x, y) => [x, y];

  useEffect(() => {
    const transforms: [number, Transform][] = [
      [params.xform1Weight, applyTransform(params.xform1Coefs, buildBlend(params.xform1Coefs, xform1Variations))],
      [params.xform2Weight, applyTransform(params.xform2Coefs, buildBlend(params.xform2Coefs, xform2Variations))],
      [params.xform3Weight, applyTransform(params.xform3Coefs, buildBlend(params.xform3Coefs, xform3Variations))]
    ];

    const gameParams = {
      width,
      height,
      transforms,
      final: identityXform
    };
    setPainter(chaosGameFinal(gameParams));
  }, [xform1Variations, xform2Variations, xform3Variations]);

  return (
    <>
      <VariationEditor title={"Transform 1"} variations={xform1Variations} setVariations={setXform1Variations}
                       resetVariations={resetXform1Variations} />
      <VariationEditor title={"Transform 2"} variations={xform2Variations} setVariations={setXform2Variations}
                       resetVariations={resetXform2Variations} />
      <VariationEditor title={"Transform 3"} variations={xform3Variations} setVariations={setXform3Variations}
                       resetVariations={resetXform3Variations} />
    </>
  );
}