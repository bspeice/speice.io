import {VictoryChart, VictoryLine, VictoryScatter, VictoryTheme} from "victory";
import {useContext, useEffect, useState} from "react";
import {PainterContext} from "../src/Canvas";
import {chaosGameHistogram} from "./chaosGameHistogram";
import {PlotData, plotHistogram} from "./plotHistogram";

function* plotChaosGame(width: number, height: number, setPdf: (data: PlotData) => void, setCdf: (data: PlotData) => void) {
    const emptyImage = new ImageData(width, height);
    for (let histogram of chaosGameHistogram(width, height)) {
        const plotData = plotHistogram(histogram);
        setPdf(plotData);
        yield emptyImage;
    }
}

export default function FlameHistogram() {
    const {width, height, setPainter} = useContext(PainterContext);
    const [pdfData, setPdfData] = useState<{ x: number, y: number }[]>(null);

    useEffect(() => setPainter(plotChaosGame(width, height, setPdfData, null)), []);

    return (
        <VictoryChart theme={VictoryTheme.clean}>
            <VictoryLine
                data={pdfData}
                interpolation='natural'
            />
        </VictoryChart>
    )
}