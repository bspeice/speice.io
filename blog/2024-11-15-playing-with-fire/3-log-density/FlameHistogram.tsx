import React, {useContext, useEffect} from "react";
import {xforms as transforms, xformFinal as final} from "../src/params";
import {PainterContext} from "../src/Canvas";
import {chaosGameHistogram} from "./chaosGameHistogram";

type Props = {
    quality?: number;
    paint: (width: number, histogram: Uint32Array) => ImageData;
    children?: React.ReactElement;
}
export default function FlameHistogram({quality, paint, children}: Props) {
    const {width, height, setPainter} = useContext(PainterContext);

    useEffect(() => {
        const gameParams = {
            width,
            height,
            transforms,
            final,
            quality,
            paint
        }
        setPainter(chaosGameHistogram(gameParams));
    }, []);

    return children;
}