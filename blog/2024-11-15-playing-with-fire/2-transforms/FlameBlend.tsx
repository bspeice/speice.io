import {useContext, useEffect, useState} from "react";
import { blend } from "./blend";
import { applyCoefs, Coefs } from "../src/coefs"
import {randomBiUnit} from "../src/randomBiUnit";
import {linear} from "../src/linear";
import {julia} from "../src/julia";
import {popcorn} from "../src/popcorn";
import {pdj} from "../src/pdj";
import {Variation} from "../src/variation";
import {Transform} from "../src/transform";
import {
    pdjParams,
    xform1Coefs,
    xform1Weight,
    xform2Coefs,
    xform2Weight,
    xform3Coefs,
    xform3Weight
} from "../src/params";
import {randomChoice} from "../src/randomChoice";
import {plotBinary} from "../src/plotBinary"
import {PainterContext} from "../src/Canvas"

import styles from "../src/css/styles.module.css"

type VariationBlend = {
    linear: number,
    julia: number,
    popcorn: number,
    pdj: number
}

export default function FlameBlend() {
    const quality = 2;
    const step = 5000;

    const {width, height, setPainter} = useContext(PainterContext);

    const xform1Default: VariationBlend = {
        linear: 0,
        julia: 1,
        popcorn: 0,
        pdj: 0,
    }
    const [xform1Variations, setXform1Variations] = useState(xform1Default)

    const xform2Default: VariationBlend = {
        linear: 1,
        julia: 0,
        popcorn: 1,
        pdj: 0
    }
    const [xform2Variations, setXform2Variations] = useState(xform2Default)

    const xform3Default: VariationBlend = {
        linear: 0,
        julia: 0,
        popcorn: 0,
        pdj: 1
    }
    const [xform3Variations, setXform3Variations] = useState(xform3Default)

    function buildTransform(coefs: Coefs, variations: VariationBlend): Transform {
        return (x: number, y: number) => {
            const [varX, varY] = applyCoefs(x, y, coefs);
            const varFunctions: [number, Variation][] = [
                [variations.linear, linear],
                [variations.julia, julia],
                [variations.popcorn, popcorn(coefs)],
                [variations.pdj, pdj(pdjParams)]
            ]

            return blend(varX, varY, varFunctions);
        }
    }

    const image = new ImageData(width, height);
    function* chaosGame() {
        let [x, y] = [randomBiUnit(), randomBiUnit()];
        const transforms: [number, Transform][] = [
            [xform1Weight, buildTransform(xform1Coefs, xform1Variations)],
            [xform2Weight, buildTransform(xform2Coefs, xform2Variations)],
            [xform3Weight, buildTransform(xform3Coefs, xform3Variations)]
        ]

        const iterations = quality * image.width * image.height;
        for (let i = 0; i < iterations; i++) {
            let [_, transform] = randomChoice(transforms);
            [x, y] = transform(x, y);

            if (i > 20)
                plotBinary(x, y, image);

            if (i % step === 0) {
                console.log(`Checking in; iterations=${i}`)
                yield image;
            }
        }

        yield image;
    }
    useEffect(() => setPainter(chaosGame()), [xform1Variations, xform2Variations, xform3Variations]);

    const variationEditor = (title, variations, setVariations) => {
        return (
            <>
                <p style={{gridColumn: '1/-1'}}>{title}:</p>
                <div className={styles.inputDiv}>
                    <p>Linear: {variations.linear}</p>
                    <input type={'range'} min={0} max={1} step={0.01} style={{width: '100%'}} value={variations.linear}
                           onInput={e => setVariations({...variations, linear: Number(e.currentTarget.value)})}/>
                </div>
                <div className={styles.inputDiv}>
                    <p>Julia: {variations.julia}</p>
                    <input type={'range'} min={0} max={1} step={0.01} style={{width: '100%'}} value={variations.julia}
                           onInput={e => setVariations({...variations, julia: Number(e.currentTarget.value)})}/>
                </div>
                <div className={styles.inputDiv}>
                    <p>Popcorn: {variations.popcorn}</p>
                    <input type={'range'} min={0} max={1} step={0.01} style={{width: '100%'}} value={variations.popcorn}
                           onInput={e => setVariations({...variations, popcorn: Number(e.currentTarget.value)})}/>
                </div>
                <div className={styles.inputDiv}>
                    <p>PDJ: {variations.pdj}</p>
                    <input type={'range'} min={0} max={1} step={0.01} style={{width: '100%'}} value={variations.pdj}
                           onInput={e => setVariations({...variations, pdj: Number(e.currentTarget.value)})}/>
                </div>
            </>
        )
    }

    return (
        <div style={{paddingTop: '1em', display: 'grid', gridTemplateColumns: 'auto auto auto auto'}}>
            {variationEditor("Transform 1", xform1Variations, setXform1Variations)}
            {variationEditor("Transform 2", xform2Variations, setXform2Variations)}
            {variationEditor("Transform 3", xform3Variations, setXform3Variations)}
        </div>
    )
}