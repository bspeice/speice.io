import {useContext, useEffect, useState} from "react";
import {Coefs} from "../src/coefs"
import {
    xform1Coefs,
    xform1Weight,
    xform1Variations,
    xform1CoefsPost,
    xform2Coefs,
    xform2Weight,
    xform2Variations,
    xform2CoefsPost,
    xform3Coefs,
    xform3Weight,
    xform3Variations,
    xform3CoefsPost,
    xformFinalCoefs as xformFinalCoefsDefault,
    xformFinalCoefsPost as xformFinalCoefsPostDefault,
} from "../src/params";
import {PainterContext} from "../src/Canvas"
import {buildBlend, buildTransform} from "./buildTransform";
import {transformPost} from "./post";
import {chaosGameFinal} from "./chaosGameFinal"
import {VariationEditor, VariationProps} from "./VariationEditor";
import {CoefEditor} from "./CoefEditor";
import {Transform} from "../src/transform";

export default function FlameFinal() {
    const {width, height, setPainter} = useContext(PainterContext);

    const [xformFinalCoefs, setXformFinalCoefs] = useState<Coefs>(xformFinalCoefsDefault);
    const resetXformFinalCoefs = () => setXformFinalCoefs(xformFinalCoefsDefault);

    const xformFinalVariationsDefault: VariationProps = {
        linear: 0,
        julia: 1,
        popcorn: 0,
        pdj: 0
    }
    const [xformFinalVariations, setXformFinalVariations] = useState<VariationProps>(xformFinalVariationsDefault);
    const resetXformFinalVariations = () => setXformFinalVariations(xformFinalVariationsDefault);

    const [xformFinalCoefsPost, setXformFinalCoefsPost] = useState<Coefs>(xformFinalCoefsPostDefault);
    const resetXformFinalCoefsPost = () => setXformFinalCoefsPost(xformFinalCoefsPostDefault);

    useEffect(() => {
        const transforms: [number, Transform][] = [
            [xform1Weight, transformPost(buildTransform(xform1Coefs, xform1Variations), xform1CoefsPost)],
            [xform2Weight, transformPost(buildTransform(xform2Coefs, xform2Variations), xform2CoefsPost)],
            [xform3Weight, transformPost(buildTransform(xform3Coefs, xform3Variations), xform3CoefsPost)]
        ];

        const finalBlend = buildBlend(xformFinalCoefs, xformFinalVariations);
        const finalTransform = buildTransform(xformFinalCoefs, finalBlend);
        const finalPost = transformPost(finalTransform, xformFinalCoefsPost);

        setPainter(chaosGameFinal(width, height, transforms, finalPost));
    }, [xformFinalCoefs, xformFinalVariations, xformFinalCoefsPost]);

    return (
        <>
            <CoefEditor title={"Final Transform"} isPost={false} coefs={xformFinalCoefs} setCoefs={setXformFinalCoefs}
                        resetCoefs={resetXformFinalCoefs}/>
            <VariationEditor title={"Final Transform Variations"} variations={xformFinalVariations}
                             setVariations={setXformFinalVariations} resetVariations={resetXformFinalVariations}/>
            <CoefEditor title={"Final Transform Post"} isPost={true} coefs={xformFinalCoefsPost}
                        setCoefs={setXformFinalCoefsPost} resetCoefs={resetXformFinalCoefsPost}/>
        </>
    )
}