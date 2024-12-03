import React, {useContext, useEffect, useState} from "react";
import * as params from "../src/params";
import {PainterContext} from "../src/Canvas";
import {chaosGameColor} from "./chaosGameColor";

type Props = {
    quality?: number;
    children?: React.ReactElement;
}
export default function FlameHistogram({quality, children}: Props) {
    const {width, height, setPainter} = useContext(PainterContext);

    const [counter, setCount] = useState(0);
    const [xform1Color, setXform1Color] = useState(params.xform1Color);
    const [xform2Color, setXform2Color] = useState(params.xform2Color);
    const [xform3Color, setXform3Color] = useState(params.xform3Color);

    useEffect(() => {
        const gameParams = {
            width,
            height,
            transforms: params.xforms,
            final: params.xformFinal,
            quality,
            palette: params.palette,
            colors: [xform1Color, xform2Color, xform3Color]
        }
        setPainter(chaosGameColor(gameParams));
    }, [counter, xform1Color, xform2Color, xform3Color]);

    return (
        <>
            {children}
            <button onClick={() => setCount(counter + 1)}>Re-render {counter}</button>
        </>
    );
}