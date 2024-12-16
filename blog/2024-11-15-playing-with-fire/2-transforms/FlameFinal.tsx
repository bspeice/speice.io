import { useContext, useEffect, useState } from "react";
import { Coefs } from "../src/transform";
import * as params from "../src/params";
import { PainterContext } from "../src/Canvas";
import { buildBlend } from "./buildBlend";
import { chaosGameFinal } from "./chaosGameFinal";
import { VariationEditor, VariationProps } from "./VariationEditor";
import { CoefEditor } from "./CoefEditor";
import { applyPost, applyTransform } from "../src/applyTransform";

export default function FlameFinal() {
  const { width, height, setPainter } = useContext(PainterContext);

  const [xformFinalCoefs, setXformFinalCoefs] = useState<Coefs>(params.xformFinalCoefs);
  const resetXformFinalCoefs = () => setXformFinalCoefs(params.xformFinalCoefs);

  const xformFinalVariationsDefault: VariationProps = {
    linear: 0,
    julia: 1,
    popcorn: 0,
    pdj: 0
  };
  const [xformFinalVariations, setXformFinalVariations] = useState<VariationProps>(xformFinalVariationsDefault);
  const resetXformFinalVariations = () => setXformFinalVariations(xformFinalVariationsDefault);

  const [xformFinalCoefsPost, setXformFinalCoefsPost] = useState<Coefs>(params.xformFinalCoefsPost);
  const resetXformFinalCoefsPost = () => setXformFinalCoefsPost(params.xformFinalCoefsPost);

  useEffect(() => {
    const finalBlend = buildBlend(xformFinalCoefs, xformFinalVariations);
    const finalXform = applyPost(xformFinalCoefsPost, applyTransform(xformFinalCoefs, finalBlend));

    setPainter(chaosGameFinal({ width, height, transforms: params.xforms, final: finalXform }));
  }, [xformFinalCoefs, xformFinalVariations, xformFinalCoefsPost]);

  return (
    <>
      <CoefEditor title={"Final Transform"} isPost={false} coefs={xformFinalCoefs} setCoefs={setXformFinalCoefs}
                  resetCoefs={resetXformFinalCoefs} />
      <VariationEditor title={"Final Transform Variations"} variations={xformFinalVariations}
                       setVariations={setXformFinalVariations} resetVariations={resetXformFinalVariations} />
      <CoefEditor title={"Final Transform Post"} isPost={true} coefs={xformFinalCoefsPost}
                  setCoefs={setXformFinalCoefsPost} resetCoefs={resetXformFinalCoefsPost} />
    </>
  );
}