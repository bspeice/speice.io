import React, {useEffect, useState, createContext, useRef} from "react";
import {useColorMode} from "@docusaurus/theme-common";
import BrowserOnly from "@docusaurus/BrowserOnly";

type PainterProps = {
    width: number;
    height: number;
    setPainter: (painter: Iterator<ImageData>) => void;
}
export const PainterContext = createContext<PainterProps>(null)

type CanvasProps = {
    style?: any;
    children?: React.ReactElement
}
export const Canvas: React.FC<CanvasProps> = ({style, children}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [isVisible, setIsVisible] = useState(false);
    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            const [entry] = entries;
            if (entry.isIntersecting) {
                setIsVisible(true);
            }
        });
        observer.observe(canvasRef.current);

        return () => {
            if (canvasRef.current) {
                observer.unobserve(canvasRef.current);
            }
        }
    }, [canvasRef]);

    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    useEffect(() => {
        if (canvasRef.current) {
            setWidth(canvasRef.current.offsetWidth);
            setHeight(canvasRef.current.offsetHeight);
        }
    }, [canvasRef]);

    const [imageHolder, setImageHolder] = useState<[ImageData]>(null);
    useEffect(() => {
        if (canvasRef.current && imageHolder) {
            canvasRef.current.getContext("2d").putImageData(imageHolder[0], 0, 0);
        }
    }, [canvasRef, imageHolder]);

    const [painterHolder, setPainterHolder] = useState<[Iterator<ImageData>]>(null);
    useEffect(() => {
        if (!isVisible || !painterHolder) {
            return;
        }

        const painter = painterHolder[0];
        const nextImage = painter.next().value;
        if (nextImage) {
            setImageHolder([nextImage]);
            setPainterHolder([painter]);
        } else {
            setPainterHolder(null);
        }
    }, [isVisible, painterHolder]);

    const [painter, setPainter] = useState<Iterator<ImageData>>(null);
    useEffect(() => {
        if (painter) {
            setPainterHolder([painter]);
        }
    }, [painter]);

    const {colorMode} = useColorMode();
    return (
        <>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                style={{
                    filter: colorMode === 'dark' ? 'invert(1)' : '',
                    ...style
                }}
            />
            <PainterContext.Provider value={{width, height, setPainter}}>
                <BrowserOnly>{() => children}</BrowserOnly>
            </PainterContext.Provider>
        </>
    )
}

export const SquareCanvas: React.FC<CanvasProps> = ({style, children}) => {
    return <Canvas style={{width: '100%', aspectRatio: '1/1', ...style}} children={children}/>
}