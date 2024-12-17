import { useContext, useEffect, useState } from "react";
import { applyTransform } from "../src/applyTransform";
import { Coefs, Transform } from "../src/transform";
import * as params from "../src/params";
import { PainterContext } from "../src/Canvas";
import { chaosGameFinal, Props as ChaosGameFinalProps } from "./chaosGameFinal";
import { CoefEditor } from "./CoefEditor";
import { transformPost } from "./post";

export default function FlamePost() {
  const { width, height, setPainter } = useContext(PainterContext);

  const [xform1CoefsPost, setXform1CoefsPost] = useState<Coefs>(params.xform1CoefsPost);
  const resetXform1CoefsPost = () => setXform1CoefsPost(params.xform1CoefsPost);

  const [xform2CoefsPost, setXform2CoefsPost] = useState<Coefs>(params.xform2CoefsPost);
  const resetXform2CoefsPost = () => setXform2CoefsPost(params.xform2CoefsPost);

  const [xform3CoefsPost, setXform3CoefsPost] = useState<Coefs>(params.xform3CoefsPost);
  const resetXform3CoefsPost = () => setXform3CoefsPost(params.xform3CoefsPost);

  const identityXform: Transform = (x, y) => [x, y];

  const gameParams: ChaosGameFinalProps = {
    width,
    height,
    transforms: [
      [params.xform1Weight, transformPost(applyTransform(params.xform1Coefs, params.xform1Variations), xform1CoefsPost)],
      [params.xform2Weight, transformPost(applyTransform(params.xform2Coefs, params.xform2Variations), xform2CoefsPost)],
      [params.xform3Weight, transformPost(applyTransform(params.xform3Coefs, params.xform3Variations), xform3CoefsPost)]
    ],
    final: identityXform
  };
  useEffect(() => setPainter(chaosGameFinal(gameParams)), [xform1CoefsPost, xform2CoefsPost, xform3CoefsPost]);

  return (
    <>
      <CoefEditor title={"Transform 1 Post"} isPost={true} coefs={xform1CoefsPost} setCoefs={setXform1CoefsPost}
                  resetCoefs={resetXform1CoefsPost} />
      <CoefEditor title={"Transform 2 Post"} isPost={true} coefs={xform2CoefsPost} setCoefs={setXform2CoefsPost}
                  resetCoefs={resetXform2CoefsPost} />
      <CoefEditor title={"Transform 3 Post"} isPost={true} coefs={xform3CoefsPost} setCoefs={setXform3CoefsPost}
                  resetCoefs={resetXform3CoefsPost} />
    </>
  );
}