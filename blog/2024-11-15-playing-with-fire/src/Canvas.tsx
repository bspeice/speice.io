import React, {useCallback, useEffect, useState, createContext} from "react";
import {useColorMode} from "@docusaurus/theme-common";
import BrowserOnly from "@docusaurus/BrowserOnly";

function invertImage(sourceImage: ImageData): ImageData {
    const image = new ImageData(sourceImage.width, sourceImage.height);
    sourceImage.data.forEach((value, index) =>
        image.data[index] = index % 4 === 3 ? value : 0xff - value)

    return image;
}

type InvertibleCanvasProps = {
    width: number,
    height: number,
    // NOTE: Images are provided as a single-element array
    //so we can allow re-painting with the same (modified) ImageData reference.
    image?: [ImageData],
}

/**
 * Draw images to a canvas, automatically inverting colors as needed.
 *
 * @param width Canvas width
 * @param height Canvas height
 * @param hidden Hide the canvas element
 * @param image Image data to draw on the canvas
 */
const InvertibleCanvas: React.FC<InvertibleCanvasProps> = ({width, height, image}) => {
    const [canvasCtx, setCanvasCtx] = useState<CanvasRenderingContext2D>(null);
    const canvasRef = useCallback(node => {
        if (node !== null) {
            setCanvasCtx(node.getContext("2d"));
        }
    }, []);

    const [paintImage, setPaintImage] = useState<[ImageData]>(null);
    useEffect(() => {
        if (canvasCtx && paintImage) {
            canvasCtx.putImageData(paintImage[0], 0, 0);
        }
    }, [canvasCtx, paintImage]);

    const {colorMode} = useColorMode();
    useEffect(() => {
        if (image) {
            setPaintImage(colorMode === 'light' ? image : [invertImage(image[0])]);
        }
    }, [image, colorMode]);

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            style={{
                aspectRatio: width / height,
                width: '75%'
            }}
        />
    )
}

type PainterProps = {
    width: number;
    height: number;
    setPainter: (painter: Iterator<ImageData>) => void;
}
export const PainterContext = createContext<PainterProps>(null);

interface CanvasProps {
    width?: number;
    height?: number;
    children?: React.ReactElement;
}

/**
 * Draw fractal flames to a canvas.
 *
 * This component is a bit involved because it attempts to solve
 * a couple problems at once:
 *  - Incrementally drawing an image to the canvas
 *  - Interrupting drawing with new parameters
 *
 * Running a full render is labor-intensive, so we model it
 * as an iterator that yields an image of the current system.
 * Internally, that iterator is re-queued on each new image;
 * so long as retrieving each image happens quickly,
 * we keep the main loop running even with CPU-heavy code.
 * As a side benefit, this also animates the chaos game nicely.
 * TODO(bspeice): This also causes React to complain about maximum update depth
 * Would this be better off spawning a `useEffect` animator
 * that has access to a `setState` queue?
 *
 * To interrupt drawing, children set the active iterator
 * through the context provider. This component doesn't care
 * about which iterator is in progress, it exists only
 * to fetch the next image and paint it to our canvas.
 *
 * TODO(bspeice): Can we make this "re-queueing iterator" pattern generic?
 * It would be nice to have iterators returning arbitrary objects,
 * but we rely on contexts to manage the iterator, and I can't find
 * a good way to make those generic.
 */
export default function Canvas({width, height, children}: CanvasProps) {
    const [image, setImage] = useState<[ImageData]>(null);
    const [painterHolder, setPainterHolder] = useState<[Iterator<ImageData>]>(null);
    useEffect(() => {
        if (!painterHolder) {
            return;
        }

        const painter = painterHolder[0];
        const nextImage = painter.next().value;
        if (nextImage) {
            setImage([nextImage]);
            setPainterHolder([painter]);
        } else {
            setPainterHolder(null);
        }
    }, [painterHolder]);

    const [painter, setPainter] = useState<Iterator<ImageData>>(null);
    useEffect(() => {
        if (painter) {
            setPainterHolder([painter]);
        }
    }, [painter]);

    width = width ?? 500;
    height = height ?? 500;
    return (
        <>
            <center>
                <InvertibleCanvas width={width} height={height} image={image}/>
            </center>
            <PainterContext.Provider value={{width, height, setPainter}}>
                <BrowserOnly>{() => children}</BrowserOnly>
            </PainterContext.Provider>
        </>
    )
}