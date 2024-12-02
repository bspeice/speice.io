import {useEffect, useState, useContext} from "react";
import {PainterContext} from "../src/Canvas";
import {chaosGameWeighted} from "./chaosGameWeighted";
import TeX from '@matejmazur/react-katex';

import styles from "../src/css/styles.module.css"

type Transform = (x: number, y: number) => [number, number];

export default function GasketWeighted() {
    const [f0Weight, setF0Weight] = useState<number>(1);
    const [f1Weight, setF1Weight] = useState<number>(1);
    const [f2Weight, setF2Weight] = useState<number>(1);

    const f0: Transform = (x, y) => [x / 2, y / 2];
    const f1: Transform = (x, y) => [(x + 1) / 2, y / 2];
    const f2: Transform = (x, y) => [x / 2, (y + 1) / 2];

    const {width, height, setPainter} = useContext(PainterContext);

    useEffect(() => {
        const transforms: [number, Transform][] = [
            [f0Weight, f0],
            [f1Weight, f1],
            [f2Weight, f2]
        ];
        setPainter(chaosGameWeighted({width, height, transforms}));
    }, [f0Weight, f1Weight, f2Weight]);

    const weightInput = (title, weight, setWeight) => (
        <>
            <div className={styles.inputElement}>
                <p><TeX>{title}</TeX> weight: {weight}</p>
                <input type={'range'} min={0} max={1} step={.01} style={{width: '100%'}} value={weight}
                    onInput={e => setWeight(Number(e.currentTarget.value))}/>
            </div>
        </>
    )

    return (
        <>
            <div className={styles.inputGroup} style={{display: 'grid', gridTemplateColumns: 'auto auto auto'}}>
                {weightInput("F_0", f0Weight, setF0Weight)}
                {weightInput("F_1", f1Weight, setF1Weight)}
                {weightInput("F_2", f2Weight, setF2Weight)}
            </div>
        </>
    )
}