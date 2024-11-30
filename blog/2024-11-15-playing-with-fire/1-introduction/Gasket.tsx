import Canvas, {PainterContext} from "../src/Canvas";
import {useContext} from "react";

export function Render({f}) {
    const {setPainter} = useContext(PainterContext);
    setPainter(f);
    return <></>;
}

export default function Gasket({f}) {
    return (
        <Canvas width={500} height={500}>
            <Render f={f}/>
        </Canvas>
    )
}