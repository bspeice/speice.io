import React, {useCallback, useEffect, useState} from "react";
import {useColorMode} from "@docusaurus/theme-common";

interface Props {
    width: number;
    height: number;
    painter: Iterator<ImageData>;
    children?: React.ReactNode;
}
export default function Canvas({width, height, painter, children}: Props) {
    const {colorMode} = useColorMode();
    const [image, setImage] = useState<[ImageData]>(null);

    const [canvasCtx, setCanvasCtx] = useState<CanvasRenderingContext2D>(null);
    const canvasRef = useCallback(node => {
        if (node !== null) {
            setCanvasCtx(node.getContext("2d"));
        }
    }, []);

    const paintImage = new ImageData(width, height);
    const paint = () => {
        if (!canvasCtx || !image) {
            return;
        }

        for (const [index, value] of image[0].data.entries()) {
            if (index % 4 === 3) {
                // Alpha values are copied as-is
                paintImage.data[index] = value;
            } else {
                // If dark mode is active, invert the color
                paintImage.data[index] = colorMode === 'light' ? value : 255 - value;
            }
        }

        canvasCtx.putImageData(paintImage, 0, 0);
    }
    useEffect(paint, [colorMode, image]);

    const animate = () => {
        const nextImage = painter.next().value;
        if (nextImage) {
            setImage([nextImage])
            requestAnimationFrame(animate);
        }
    }
    useEffect(animate, [canvasCtx]);

    return (
        <>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                    aspectRatio: width / height,
                    width: '100%'
                }}
            />
            {children}
        </>
    )
}