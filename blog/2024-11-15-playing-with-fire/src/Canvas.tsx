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
    hidden?: boolean;
    children?: React.ReactNode;
}

/**
 * Draw fractal flames to a canvas.
 *
 * This component is a bit involved because it attempts to solve
 * a couple problems at once:
 *  - Incrementally drawing an image to the canvas
 *  - Interrupting drawing with new parameters
 *  - Dark mode
 *
 * Running a full render is labor-intensive, so we model it
 * as an iterator that yields an image of the current system.
 * Internally, that iterator is re-queued on each new image;
 * so long as that image is returned quickly, we keep
 * the main loop running even with CPU-heavy code.
 *
 * To interrupt drawing, children set the active iterator
 * through the context provider. This component doesn't care
 * about which iterator is in progress, it exists only
 * to fetch the next image and paint it to our canvas.
 *
 * Finally, we make a distinction between "render" and "paint" buffers.
 * The render image is provided by the iterator, and then:
 *  - If light mode is active, draw it to the canvas as-is
 *  - If dark mode is active, copy the "render" buffer to the "paint" buffer,
 *    invert colors, and then draw the image
 *
 * TODO(bspeice): Can we make this "re-queueing iterator" pattern generic?
 * It would be nice to have iterators returning arbitrary objects,
 * but we rely on contexts to manage the iterator, and there's
 * no good way to make those generic.
 *
 * @param width Canvas draw width
 * @param height Canvas draw height
 * @param hidden Hide the canvas
 * @param children Child elements
 */
export default function Canvas({width, height, hidden, children}: CanvasProps) {
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
                    hidden={hidden ?? false}
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