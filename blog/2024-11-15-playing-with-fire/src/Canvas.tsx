import React, {useEffect, useState, createContext, useRef, MouseEvent} from "react";
import {useColorMode} from "@docusaurus/theme-common";

type PainterProps = {
    width: number;
    height: number;
    setPainter: (painter: Iterator<ImageData>) => void;
}
export const PainterContext = createContext<PainterProps>(null)

const downloadImage = (name: string) =>
    (e: MouseEvent) => {
        const link = document.createElement("a");
        link.download = `${name}.png`;
        link.href = (e.target as HTMLCanvasElement).toDataURL("image/png");
        link.click();
    }

type CanvasProps = {
    name: string;
    width?: string;
    aspectRatio?: string;
    style?: any;
    children?: React.ReactElement
}
export const Canvas: React.FC<CanvasProps> = ({name, style, children}) => {
    const sizingRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const [height, setHeight] = useState(0);
    useEffect(() => {
        if (sizingRef.current) {
            setWidth(sizingRef.current.offsetWidth);
            setHeight(sizingRef.current.offsetHeight);
        }
    }, [sizingRef]);

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
    }, [canvasRef.current]);

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

    const canvasProps = {
        ref: canvasRef,
        width,
        height,
        style: {filter: useColorMode().colorMode === 'dark' ? 'invert(1)' : ''}
    }

    return (
        <>
            <center>
                <div ref={sizingRef} style={style}>
                    {width > 0 ? <canvas {...canvasProps} onDoubleClick={downloadImage(name)}/> : null}
                </div>
            </center>
            <PainterContext.Provider value={{width, height, setPainter}}>
                {width > 0 ? children : null}
            </PainterContext.Provider>
        </>
    )
}

export const SquareCanvas: React.FC<CanvasProps> = ({name, width, aspectRatio, style, children}) => {
    return <center><Canvas name={name} style={{width: width ?? '75%', aspectRatio: aspectRatio ?? '1/1', ...style}} children={children}/></center>
}