import {useContext, useEffect, useState} from "react";
import {Transform} from "../src/transform";
import {
    identityCoefs,
    xform1Coefs,
    xform1Weight,
    xform2Coefs,
    xform2Weight,
    xform3Coefs,
    xform3Weight
} from "../src/params";
import {PainterContext} from "../src/Canvas"
import {buildBlend, buildTransform} from "./buildTransform"
import {chaosGameFinal} from "./chaosGameFinal"
import {VariationEditor, VariationProps} from "./VariationEditor"

export default function FlameBlend() {
    const {width, height, setPainter} = useContext(PainterContext);

    const xform1Default: VariationProps = {
        linear: 0,
        julia: 1,
        popcorn: 0,
        pdj: 0,
    }
    const [xform1Variations, setXform1Variations] = useState(xform1Default)

    const xform2Default: VariationProps = {
        linear: 1,
        julia: 0,
        popcorn: 1,
        pdj: 0
    }
    const [xform2Variations, setXform2Variations] = useState(xform2Default)

    const xform3Default: VariationProps = {
        linear: 0,
        julia: 0,
        popcorn: 0,
        pdj: 1
    }
    const [xform3Variations, setXform3Variations] = useState(xform3Default)

    // Cheating a bit here; for purposes of code re-use, use the post- and final-transform-enabled chaos game,
    // and swap in identity components for each
    const identityXform: Transform = (x, y) => [x, y];

    useEffect(() => setPainter(chaosGameFinal(width, height, [
        [xform1Weight, buildTransform(xform1Coefs, buildBlend(xform1Coefs, xform1Variations))],
        [xform2Weight, buildTransform(xform2Coefs, buildBlend(xform2Coefs, xform2Variations))],
        [xform3Weight, buildTransform(xform3Coefs, buildBlend(xform3Coefs, xform3Variations))]
    ], identityXform)), [xform1Variations, xform2Variations, xform3Variations]);

    return (
        <>
            <VariationEditor title={"Transform 1"} variations={xform1Variations} setVariations={setXform1Variations}/>
            <VariationEditor title={"Transform 2"} variations={xform2Variations} setVariations={setXform2Variations}/>
            <VariationEditor title={"Transform 3"} variations={xform3Variations} setVariations={setXform3Variations}/>
        </>
    )
}