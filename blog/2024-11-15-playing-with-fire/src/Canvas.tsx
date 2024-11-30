import React, {useCallback, useEffect, useState, createContext} from "react";
import {useColorMode} from "@docusaurus/theme-common";

export interface PainterProps {
    readonly width: number;
    readonly height: number;
    readonly setPainter: (painter: Iterator<ImageData>) => void;
}

/**
 * Context provider for child elements to submit image iterator functions
 * (painters) for rendering
 */
export const PainterContext = createContext<PainterProps>(null);

interface CanvasProps {
    width?: number;
    height?: number;
    children?: React.ReactNode;
}

/**
 * Draw fractal flames to a canvas.
 *
 * This component is a bit involved because it attempts to solve
 * a couple problems at the same time:
 *  - Incrementally drawing an image to the canvas
 *  - Interrupting drawing with new parameters on demand
 *  - Dark mode
 *
 * Image iterators provide a means to draw incremental images;
 * iterators can easily checkpoint state, and this component will
 * request the next image on the next animation frame. As a result,
 * the browser should be responsive even though we run CPU-heavy
 * code on the main thread.
 *
 * Swapping a new iterator allows interrupting a render in progress,
 * as the canvas completely repaints on each provided image.
 *
 * Finally, check whether dark mode is active, and invert the most
 * recent image prior to painting if so.
 *
 * PainterContext is used to allow child elements to swap in
 * new iterators.
 *
 * @param width Canvas draw width
 * @param height Canvas draw height
 * @param children Child elements
 */
export default function Canvas({width, height, children}: CanvasProps) {
    const [canvasCtx, setCanvasCtx] = useState<CanvasRenderingContext2D>(null);
    const canvasRef = useCallback(node => {
        if (node !== null) {
            setCanvasCtx(node.getContext("2d"));
        }
    }, []);

    // Holder objects are used to force re-painting even if the iterator
    // returns a modified image with the same reference
    type ImageHolder = { image?: ImageData };

    const [paintImage, setPaintImage] = useState<ImageHolder>({ image: null });
    useEffect(() => {
        if (paintImage.image && canvasCtx) {
            canvasCtx.putImageData(paintImage.image, 0, 0);
        }
    }, [paintImage, canvasCtx]);

    const {colorMode} = useColorMode();
    const [renderImage, setRenderImage] = useState<ImageHolder>({ image: null });
    useEffect(() => {
        const image = renderImage.image;
        if (!image) {
            return;
        }

        // If light mode is active, paint the image as-is
        if (colorMode === 'light') {
            setPaintImage({ image });
            return;
        }

        // If dark mode is active, copy the image into a new buffer
        // and invert colors prior to painting.
        // Copy alpha values as-is.
        const paintImage = new ImageData(image.width, image.height);
        image.data.forEach((value, index) => {
            const isAlpha = index % 4 === 3;
            paintImage.data[index] = isAlpha ? value : 255 - value;
        })
        setPaintImage({ image: paintImage });
    }, [colorMode, renderImage]);

    // Image iterators (painters) are also in a holder; this allows
    // re-submitting the existing iterator to draw the next frame,
    // and also allows child components to over-write the iterator
    // if a new set of parameters becomes available
    // TODO(bspeice): Potential race condition?
    // Not sure if it's possible for painters submitted by children
    // to be over-ridden as a result re-submitting the
    // existing iterator
    type PainterHolder = { painter?: Iterator<ImageData> };
    const [animHolder, setAnimHolder] = useState<PainterHolder>({ painter: null });
    useEffect(() => {
        const painter = animHolder.painter;
        if (!painter) {
            return;
        }

        if (!canvasCtx) {
            setAnimHolder({ painter });
            return;
        }

        const image = painter.next().value;
        if (image) {
            setRenderImage({ image });
            setAnimHolder({ painter });
        } else {
            setAnimHolder({ painter: null });
        }
    }, [animHolder, canvasCtx]);

    // Finally, child elements submit painters through a context provider
    const [painter, setPainter] = useState<Iterator<ImageData>>(null);
    useEffect(() => setAnimHolder({ painter }), [painter]);

    width = width ?? 500;
    height = height ?? 500;
    return (
        <>
            <center>
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    style={{
                        aspectRatio: width / height,
                        width: '80%'
                    }}
                />
            </center>
            <PainterContext.Provider value={{width, height, setPainter}}>
                {children}
            </PainterContext.Provider>
        </>
    )
}