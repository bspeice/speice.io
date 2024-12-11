import React, {useContext, useEffect} from "react";
import {xforms as transforms, xformFinal as final} from "../src/params";
import {PainterContext} from "../src/Canvas";
import {chaosGameHistogram} from "./chaosGameHistogram";

type Props = {
    paint: (width: number, height: number, histogram: number[]) => ImageData;
    children?: React.ReactElement;
}
export default function FlameHistogram({paint, children}: Props) {
    const {width, height, setPainter} = useContext(PainterContext);

    useEffect(() => {
        const gameParams = {
            width,
            height,
            transforms,
            final,
            paint
        }
        setPainter(chaosGameHistogram(gameParams));
    }, [width, height]);

    return children;
}