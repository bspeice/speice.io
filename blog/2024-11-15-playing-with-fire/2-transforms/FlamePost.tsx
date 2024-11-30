import {useContext, useEffect, useState} from "react";
import {Coefs} from "../src/coefs"
import {Transform} from "../src/transform";
import {
    xform1Coefs,
    xform1Weight,
    xform1Variations,
    xform1CoefsPost as xform1CoefsPostDefault,
    xform2Coefs,
    xform2Weight,
    xform2Variations,
    xform2CoefsPost as xform2CoefsPostDefault,
    xform3Coefs,
    xform3Weight,
    xform3Variations,
    xform3CoefsPost as xform3CoefsPostDefault
} from "../src/params";
import {PainterContext} from "../src/Canvas"
import {chaosGameFinal} from "./chaosGameFinal"
import {CoefEditor} from "./CoefEditor"
import {transformPost} from "./post";
import {buildTransform} from "./buildTransform";

export default function FlamePost() {
    const {width, height, setPainter} = useContext(PainterContext);

    const [xform1CoefsPost, setXform1PostCoefs] = useState<Coefs>(xform1CoefsPostDefault);
    const [xform2CoefsPost, setXform2PostCoefs] = useState<Coefs>(xform2CoefsPostDefault);
    const [xform3CoefsPost, setXform3PostCoefs] = useState<Coefs>(xform3CoefsPostDefault);

    const identityXform: Transform = (x, y) => [x, y];

    useEffect(() => setPainter(chaosGameFinal(width, height, [
        [xform1Weight, transformPost(buildTransform(xform1Coefs, xform1Variations), xform1CoefsPost)],
        [xform2Weight, transformPost(buildTransform(xform2Coefs, xform2Variations), xform2CoefsPost)],
        [xform3Weight, transformPost(buildTransform(xform3Coefs, xform3Variations), xform3CoefsPost)]
    ], identityXform)), [xform1CoefsPost, xform2CoefsPost, xform3CoefsPost]);

    return (
        <>
            <CoefEditor title={"Transform 1 Post"} isPost={true} coefs={xform1CoefsPost} setCoefs={setXform1PostCoefs}/>
            <CoefEditor title={"Transform 2 Post"} isPost={true} coefs={xform2CoefsPost} setCoefs={setXform2PostCoefs}/>
            <CoefEditor title={"Transform 3 Post"} isPost={true} coefs={xform3CoefsPost} setCoefs={setXform3PostCoefs}/>
        </>
    )
}