import {useEffect, useState} from "react";
import Canvas from "../src/Canvas";
import { Params, chaosGameWeighted } from "./chaosGameWeighted";
import TeX from '@matejmazur/react-katex';

type Transform = (x: number, y: number) => [number, number];

function WeightInput({value, setValue, children}) {
    return (
        <div style={{paddingLeft: '1.5em', paddingRight: '1.5em'}}>
            {children}
            <input type={'range'} min={0} max={1} step={.01} style={{width: '100%'}} value={value} onInput={e => setValue(Number(e.currentTarget.value))}/>
        </div>
    )
}

export default function GasketWeighted() {
    const image = new ImageData(600, 600);
    const iterations = 100_000;
    const step = 1000;

    const [f0Weight, setF0Weight] = useState<number>(1);
    const [f1Weight, setF1Weight] = useState<number>(1);
    const [f2Weight, setF2Weight] = useState<number>(1);

    const f0: Transform = (x, y) => [x / 2, y / 2];
    const f1: Transform = (x, y) => [(x + 1) / 2, y / 2];
    const f2: Transform = (x, y) => [x / 2, (y + 1) / 2];

    const [game, setGame] = useState<Generator<ImageData>>(null);
    useEffect(() => {
        const params: Params = {
            transforms: [
                [f0Weight, f0],
                [f1Weight, f1],
                [f2Weight, f2]
            ],
            image,
            iterations,
            step
        }
        setGame(chaosGameWeighted(params))
    }, [f0Weight, f1Weight, f2Weight]);

    return (
        <>
            <Canvas width={image.width} height={image.height} painter={game}/>
            <div style={{paddingTop: '1em', display: 'grid', gridTemplateColumns: 'auto auto auto'}}>
                <WeightInput value={f0Weight} setValue={setF0Weight}>
                    <p><TeX>F_0</TeX> weight:<span style={{float: 'right'}}>{f0Weight}</span></p>
                </WeightInput>
                <WeightInput value={f1Weight} setValue={setF1Weight}>
                    <p><TeX>F_1</TeX> weight:<span style={{float: 'right'}}>{f1Weight}</span></p>
                </WeightInput>
                <WeightInput value={f2Weight} setValue={setF2Weight}>
                    <p><TeX>F_2</TeX> weight:<span style={{float: 'right'}}>{f2Weight}</span></p>
                </WeightInput>
            </div>
        </>
    )
}