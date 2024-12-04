import React, {useContext, useEffect, useMemo, useRef, useState} from "react";
import * as params from "../src/params";
import {PainterContext} from "../src/Canvas";
import {chaosGameColor} from "./chaosGameColor";

import styles from "../src/css/styles.module.css";
import {palette} from "../src/params";

const colorSwatch = (width: number, height: number, palette: number[], color: number): ImageData => {
    return new ImageData(width, height);
}

type ColorSliderProps = {
    title: string;
    palette: number[];
    color: number;
    setColor: (color: number) => void;
    children?: React.ReactNode;
}
const ColorSlider: React.FC<ColorSliderProps> = ({title, palette, color, setColor, children}) => {
    const swatch = useMemo(() => colorSwatch(50, 20, palette, color), [palette, color]);

    return (
        <>
            <div className={styles.inputElement}>
                <p>{title}: {color}</p>
                <input type={'range'} min={0} max={1} step={.01} style={{width: '100%'}} value={color}
                       onInput={e => setColor(Number(e.currentTarget.value))}/>
            </div>
            {children}
        </>
    )
}

type PaletteBarProps = {
    height: number;
    palette: number[];
    sizingStyle: any;
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

type Props = {
    quality?: number;
    children?: React.ReactElement;
}
export default function FlameColor({quality, children}: Props) {
    const {width, height, setPainter} = useContext(PainterContext);

    const [xform1Color, setXform1Color] = useState(params.xform1Color);
    const [xform2Color, setXform2Color] = useState(params.xform2Color);
    const [xform3Color, setXform3Color] = useState(params.xform3Color);
    const resetColor = () => {
        setXform1Color(params.xform1Color);
        setXform2Color(params.xform2Color);
        setXform3Color(params.xform3Color);
    }

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
    }, [xform1Color, xform2Color, xform3Color]);

    const resetButton = <button className={styles.inputReset} onClick={resetColor}>Reset</button>
    return (
        <div className={styles.inputGroup} style={{display: 'grid', gridTemplateColumns: 'auto auto auto'}}>
            <p className={styles.inputTitle} style={{gridColumn: '1/-1'}}>Transform Colors {resetButton}</p>
            <PaletteBar height={40} palette={palette} sizingStyle={{gridColumn: '1/-1'}}/>
            <ColorSlider title={"Transform 1"} palette={palette} color={xform1Color} setColor={setXform1Color}/>
            <ColorSlider title={"Transform 2"} palette={palette} color={xform2Color} setColor={setXform2Color}/>
            <ColorSlider title={"Transform 3"} palette={palette} color={xform3Color} setColor={setXform3Color}/>
        </div>
    );
}