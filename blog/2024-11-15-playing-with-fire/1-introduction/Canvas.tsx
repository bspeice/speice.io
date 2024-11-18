import {useEffect, useRef} from "react";

interface Props {
    renderFn: (ImageData) => void
}

export const Canvas: React.FC<Props> = ({renderFn}: Props) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const ctx = canvasRef.current?.getContext("2d");
        if (!ctx) {
            console.log("Canvas not ready");
        }

        const image = ctx.createImageData(canvasRef.current.width, canvasRef.current.height);
        renderFn(image);
        ctx.putImageData(image, 0, 0);
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={600}
            height={600}
            style={{
                aspectRatio: '1 / 1',
                width: '100%',
            }}
        />
    );
};

export default Canvas;