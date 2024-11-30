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
    width: number;
    height: number;
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

    const {colorMode} = useColorMode();

    // Holder objects are used to force re-painting even if the iterator
    // returns a modified image with the same reference
    type ImageHolder = { image?: ImageData };
    const [imageHolder, setImageHolder] = useState<ImageHolder>({ image: null });
    useEffect(() => {
        const image = imageHolder.image;
        if (!image) {
            // No image is available, leave the canvas as-is
            return;
        }

        if (!canvasCtx) {
            // Canvas is not ready for the image we have,
            // re-submit the image and wait for the ref to populate
            setImageHolder({ image });
            return;
        }

        // If light mode is active, paint the image as-is
        if (colorMode === 'light') {
            canvasCtx.putImageData(image, 0, 0);
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
        canvasCtx.putImageData(paintImage, 0, 0);
    }, [colorMode, imageHolder]);

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
            setImageHolder({ image });
            setAnimHolder({ painter });
        } else {
            setAnimHolder({ painter: null });
        }
    }, [animHolder, canvasCtx]);

    // Finally, child elements submit painters through a context provider
    const [painter, setPainter] = useState<Iterator<ImageData>>(null);
    useEffect(() => setAnimHolder({ painter }), [painter]);

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