import React, {useContext, useEffect, useMemo, useRef, useState} from "react";
import * as params from "../src/params";
import {InvertibleCanvas, PainterContext} from "../src/Canvas";
import {chaosGameColor, ChaosGameColorProps, TransformColor} from "./chaosGameColor";

import styles from "../src/css/styles.module.css";
import {colorFromPalette} from "@site/blog/2024-11-15-playing-with-fire/3-log-density/color";

type PaletteBarProps = {
    height: number;
    palette: number[];
    sizingStyle?: any;
    children?: React.ReactNode;
}
const PaletteBar: React.FC<PaletteBarProps> = ({height, palette, sizingStyle, children}) => {
    const sizingRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    useEffect(() => {
        if (!sizingRef.current) {
            return;
        }

        setWidth(sizingRef.current.offsetWidth);
    }, [sizingRef.current]);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }
    }, [canvasRef.current]);

    return (
        <div ref={sizingRef} style={sizingStyle}><canvas width={width} height={height}/></div>
    )
}

type AutoSizingCanvasProps = {
    painter: (width: number, height: number) => ImageData;
}
const AutoSizingCanvas: React.FC<AutoSizingCanvasProps> = ({painter}) => {
    const sizingRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState<number>(0);
    const [height, setHeight] = useState<number>(0);

    useEffect(() => {
        if (sizingRef) {
            console.log(`Sizing; width=${sizingRef.current.offsetWidth} height=${sizingRef.current.offsetHeight}`)
            setWidth(sizingRef.current.offsetWidth);
            setHeight(sizingRef.current.offsetHeight)
        }
    }, [sizingRef]);

    const image: [ImageData] = useMemo(() => (width && height) ? [painter(width, height)] : null, [painter, width, height]);

    return (
        <div ref={sizingRef} style={{width: '100%', height: '100%'}}><InvertibleCanvas width={width} height={height} image={image}/></div>
    )
}

const colorSwatchPainter = (palette: number[], color: number) =>
    (width: number, height: number) => {
        const [r, g, b] = colorFromPalette(palette, color);
        const image = new ImageData(width, height);
        for (let i = 0; i < image.data.length; i += 4) {
            image.data[i] = r * 0xff;
            image.data[i + 1] = g * 0xff;
            image.data[i + 2] = b * 0xff;
            image.data[i + 3] = 0xff;
        }

        return image;
    }

type ColorEditorProps = {
    title: string;
    palette: number[];
    transformColor: TransformColor;
    setTransformColor: (transformColor: TransformColor) => void;
    resetTransformColor: () => void;
    children?: React.ReactNode;
}
const ColorEditor: React.FC<ColorEditorProps> = ({title, palette, transformColor, setTransformColor, resetTransformColor, children}) => {
    const painter = useMemo(() => colorSwatchPainter(palette, transformColor.color), [palette, transformColor]);
    const resetButton = <button className={styles.inputReset} onClick={resetTransformColor}>Reset</button>

    return (
        <>
            <div className={styles.inputGroup} style={{display: 'grid', gridTemplateColumns: '2fr 2fr 1fr'}}>
                <p className={styles.inputTitle} style={{gridColumn: '1/-1'}}>{title} {resetButton}</p>
                <div className={styles.inputElement}>
                    <p>Color: {transformColor.color}</p>
                    <input type={'range'} min={0} max={1} step={.001} value={transformColor.color}
                           onInput={e => setTransformColor({...transformColor, color: Number(e.currentTarget.value)})}/>
                </div>
                <div className={styles.inputElement}>
                    <p>Color speed: {transformColor.colorSpeed}</p>
                    <input type={'range'} min={0} max={1} step={.001} value={transformColor.colorSpeed}
                           onInput={e => setTransformColor({...transformColor, colorSpeed: Number(e.currentTarget.value)})}/>
                </div>
                <div className={styles.inputElement}>
                    <AutoSizingCanvas painter={painter}/>
                </div>
            </div>
        </>
    )
}

type Props = {
    quality?: number;
    children?: React.ReactElement;
}
export default function FlameColor({quality, children}: Props) {
    const {width, height, setPainter} = useContext(PainterContext);

    const xform1ColorDefault: TransformColor = {color: params.xform1Color, colorSpeed: 0.5};
    const [xform1Color, setXform1Color] = useState(xform1ColorDefault);
    const resetXform1Color = () => setXform1Color(xform1ColorDefault);

    const xform2ColorDefault: TransformColor = {color: params.xform2Color, colorSpeed: 0.5};
    const [xform2Color, setXform2Color] = useState(xform2ColorDefault);
    const resetXform2Color = () => setXform2Color(xform2ColorDefault);

    const xform3ColorDefault: TransformColor = {color: params.xform3Color, colorSpeed: 0.5};
    const [xform3Color, setXform3Color] = useState(xform3ColorDefault);
    const resetXform3Color = () => setXform3Color(xform3ColorDefault);

    const xformFinalColorDefault: TransformColor = {color: params.xformFinalColor, colorSpeed: 0};
    const [xformFinalColor, setXformFinalColor] = useState(xformFinalColorDefault);
    const resetXformFinalColor = () => setXformFinalColor(xformFinalColorDefault);

    useEffect(() => {
        const gameParams: ChaosGameColorProps = {
            width,
            height,
            transforms: params.xforms,
            final: params.xformFinal,
            quality,
            palette: params.palette,
            colors: [xform1Color, xform2Color, xform3Color],
            finalColor: xformFinalColor
        }
        setPainter(chaosGameColor(gameParams));
    }, [xform1Color, xform2Color, xform3Color, xformFinalColor]);

    return (
        <>
            <PaletteBar height={40} palette={params.palette}/>
            <ColorEditor
                title={"Transform 1"}
                palette={params.palette}
                transformColor={xform1Color}
                setTransformColor={setXform1Color}
                resetTransformColor={resetXform1Color}/>
            <ColorEditor
                title={"Transform 2"}
                palette={params.palette}
                transformColor={xform2Color}
                setTransformColor={setXform2Color}
                resetTransformColor={resetXform2Color}/>
            <ColorEditor
                title={"Transform 3"}
                palette={params.palette}
                transformColor={xform3Color}
                setTransformColor={setXform3Color}
                resetTransformColor={resetXform3Color}/>
            <ColorEditor
                title={"Transform Final"}
                palette={params.palette}
                transformColor={xformFinalColor}
                setTransformColor={setXformFinalColor}
                resetTransformColor={resetXformFinalColor}/>
            {children}
        </>
    );
}