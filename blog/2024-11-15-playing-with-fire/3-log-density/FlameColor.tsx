import React, {useContext, useEffect, useMemo, useRef, useState} from "react";
import * as params from "../src/params";
import {PainterContext} from "../src/Canvas";
import {colorFromPalette} from "./colorFromPalette";
import {chaosGameColor, Props as ChaosGameColorProps, TransformColor} from "./chaosGameColor";

import styles from "../src/css/styles.module.css";
import {histIndex} from "../src/camera";
import {useColorMode} from "@docusaurus/theme-common";

type PaletteBarProps = {
    height: number;
    palette: number[];
    children?: React.ReactNode;
}
export const PaletteBar: React.FC<PaletteBarProps> = ({height, palette, children}) => {
    const sizingRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    useEffect(() => {
        if (sizingRef) {
            setWidth(sizingRef.current.offsetWidth);
        }
    }, [sizingRef]);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const paletteImage = useMemo(() => {
        if (width === 0) {
            return;
        }

        const image = new ImageData(width, height);
        for (let x = 0; x < width; x++) {
            const colorIndex = x / width;
            const [r, g, b] = colorFromPalette(palette, colorIndex);

            for (let y = 0; y < height; y++) {
                const pixelIndex = histIndex(x, y, width, 4);
                image.data[pixelIndex] = r * 0xff;
                image.data[pixelIndex + 1] = g * 0xff;
                image.data[pixelIndex + 2] = b * 0xff;
                image.data[pixelIndex + 3] = 0xff;
            }
        }

        return image;
    }, [width, height, palette]);

    useEffect(() => {
        if (canvasRef && paletteImage) {
            canvasRef.current.getContext("2d").putImageData(paletteImage, 0, 0);
        }
    }, [canvasRef, paletteImage]);

    const canvasStyle = {filter: useColorMode().colorMode === 'dark' ? 'invert(1)' : ''};

    return (
        <>
            <div ref={sizingRef} style={{width: '100%', height}}>
                {width > 0 ? <canvas ref={canvasRef} width={width} height={height} style={canvasStyle}/> : null}
            </div>
            {children}
        </>
    )
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
    const resetButton = <button className={styles.inputReset} onClick={resetTransformColor}>Reset</button>

    const [r, g, b] = colorFromPalette(palette, transformColor.color);
    const colorCss = `rgb(${Math.floor(r * 0xff)},${Math.floor(g * 0xff)},${Math.floor(b * 0xff)})`;

    const {colorMode} = useColorMode();

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
                    <p>Speed: {transformColor.colorSpeed}</p>
                    <input type={'range'} min={0} max={1} step={.001} value={transformColor.colorSpeed}
                           onInput={e => setTransformColor({...transformColor, colorSpeed: Number(e.currentTarget.value)})}/>
                </div>
                <div className={styles.inputElement} style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: colorCss,
                    filter: colorMode === 'dark' ? 'invert(1)' : ''
                }}/>
            </div>
            {children}
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