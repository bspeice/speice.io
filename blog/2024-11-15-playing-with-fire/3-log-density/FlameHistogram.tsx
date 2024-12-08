import React, {useContext, useEffect} from "react";
import * as params from "../src/params";
import {PainterContext} from "../src/Canvas";
import {chaosGameHistogram} from "./chaosGameHistogram";

type Props = {
    quality?: number;
    paintFn: (width: number, histogram: Uint32Array) => ImageData;
    children?: React.ReactElement;
}
export default function FlameHistogram({quality, paintFn, children}: Props) {
    const {width, height, setPainter} = useContext(PainterContext);

    useEffect(() => {
        const gameParams = {
            width,
            height,
            transforms: params.xforms,
            final: params.xformFinal,
            quality,
            painter: paintFn
        }
        setPainter(chaosGameHistogram(gameParams));
    }, []);

    return children;
}