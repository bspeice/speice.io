import React, { useContext, useEffect } from "react";
import * as params from "../src/params";
import { PainterContext } from "../src/Canvas";
import {chaosGameCamera, Props as ChaosGameColorProps} from "./chaosGameCamera";
import styles from "../src/css/styles.module.css";

type Props = {
  children?: React.ReactElement;
}
export default function FlameCamera({ children }: Props) {
  const { width, height, setPainter } = useContext(PainterContext);

  // Scale chosen so the largest axis is `[-2, 2]` in IFS coordinates,
  // the smaller axis will be a shorter range to maintain the aspect ratio.
  const scale = Math.max(width, height) / 4;

  const [zoom, setZoom] = React.useState(0);
  const [rotate, setRotate] = React.useState(0);
  const [offsetX, setOffsetX] = React.useState(0);
  const [offsetY, setOffsetY] = React.useState(0);

  const resetCamera = () => {
    setZoom(0);
    setRotate(0);
    setOffsetX(0);
    setOffsetY(0);
  }
  const resetButton = <button className={styles.inputReset} onClick={resetCamera}>Reset</button>;

  useEffect(() => {
    const gameParams: ChaosGameColorProps = {
      width,
      height,
      transforms: params.xforms,
      final: params.xformFinal,
      palette: params.palette,
      colors: [
        {color: params.xform1Color, colorSpeed: 0.5},
        {color: params.xform2Color, colorSpeed: 0.5},
        {color: params.xform3Color, colorSpeed: 0.5}
      ],
      finalColor: { color: params.xformFinalColor, colorSpeed: 0.5 },
      scale,
      zoom,
      rotate: rotate / 180 * Math.PI,
      offsetX,
      offsetY
    };
    setPainter(chaosGameCamera(gameParams));
  }, [scale, zoom, rotate, offsetX, offsetY]);

  return (
      <>
        <div className={styles.inputGroup} style={{display: "grid", gridTemplateColumns: "1fr 1fr"}}>
          <p className={styles.inputTitle} style={{gridColumn: "1/-1"}}>Camera {resetButton}</p>
          <div className={styles.inputElement}>
            <p>Zoom: {zoom}</p>
            <input type={"range"} min={-0.5} max={2} step={0.01} value={zoom}
                   onInput={e => setZoom(Number(e.currentTarget.value))}/>
          </div>
          <div className={styles.inputElement}>
            <p>Rotate (deg): {rotate}</p>
            <input type={"range"} min={0} max={360} step={1} value={rotate}
                   onInput={e => setRotate(Number(e.currentTarget.value))}/>
          </div>
          <div className={styles.inputElement}>
            <p>Offset X: {offsetX}</p>
            <input type={"range"} min={-2} max={2} step={0.01} value={offsetX}
                   onInput={e => setOffsetX(Number(e.currentTarget.value))}/>
          </div>
          <div className={styles.inputElement}>
            <p>Offset Y: {offsetY}</p>
            <input type={"range"} min={-2} max={2} step={0.01} value={offsetY}
                   onInput={e => setOffsetY(Number(e.currentTarget.value))}/>
          </div>
        </div>
        {children}
      </>
  );
}