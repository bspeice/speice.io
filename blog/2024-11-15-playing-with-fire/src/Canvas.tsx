import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from "react";
import {useColorMode} from "@docusaurus/theme-common";

interface IImageContext {
    width: number;
    height: number;
    setImage: (image: ImageData) => void;
}
export const ImageContext = createContext<IImageContext>(null);

interface Props {
    width: number;
    height: number;
    children?: React.ReactNode;
}
export default function Canvas({width, height, children}) {
    const [canvasCtx, setCanvasCtx] = useState<CanvasRenderingContext2D | null>(null);
    const canvasRef = useCallback(node => {
        if (node !== null) {
            setCanvasCtx(node.getContext("2d"));
        }
    }, []);

    const {colorMode} = useColorMode();
    const [image, setImage] = useState<ImageData>(new ImageData(width, height));
    const paintImage = new ImageData(width, height);

    useEffect(() => {
        if (!canvasCtx) {
            return;
        }

        for (const [index, value] of image.data.entries()) {
            // If dark mode is active, invert the color scheme
            const adjustValue = colorMode === 'light' ? value : 255 - value;

            // Alpha values never change
            paintImage.data[index] = index % 4 === 3 ? value : adjustValue;
        }

        console.log("Painting image");
        canvasCtx.putImageData(paintImage, 0, 0);
    }, [canvasCtx, colorMode, image]);

    return (
        <ImageContext.Provider value={{width, height, setImage}}>
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
        </ImageContext.Provider>
    )
}