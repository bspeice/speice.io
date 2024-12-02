import React, {useContext, useEffect} from "react";
import * as params from "../src/params";
import {PainterContext} from "../src/Canvas";
import {chaosGameHistogram} from "@site/blog/2024-11-15-playing-with-fire/3-log-density/chaosGameHistogram";

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