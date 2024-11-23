import {createContext, useEffect, useRef, useState} from "react";
import {Transform} from "./transform";
import {randomBiUnit} from "./randomBiunit";
import {useColorMode} from "@docusaurus/theme-common";
import {randomChoice} from "./randomChoice";

export interface Flame {
    transforms: [number, Transform][];
    final: Transform;
    palette: Uint8Array;
}

interface IFlameContext {
    setQuality?: (quality: number) => void;
    setFlame?: (flame: Flame) => void;
}

export const FlameContext = createContext<IFlameContext>({});

abstract class Renderer {
    protected readonly _size: number;
    protected _x: number = randomBiUnit();
    protected _y: number = randomBiUnit();
    protected _iterations: number = 0;

    protected _flame?: Flame;

    protected constructor(size: number) {
        this._size = size;
    }

    abstract plot(x: number, y: number, c: number): void;
    abstract run(iterations: number): void;
    abstract paint(image: ImageData): void;

    public get size(): number {
        return this._size;
    }

    public get iterations(): number {
        return this._iterations;
    }

    public set flame(value: Flame) {
        [this._x, this._y] = [randomBiUnit(), randomBiUnit()];
        this._iterations = 0;
    }
}

export interface Props {
    renderer: Renderer;
    children?: React.ReactNode;
}

export const FlameCanvas: React.FC<Props> = ({renderer, children}) => {
    const ITER_STEP = 10000;
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const colorMode = useColorMode();
    const [quality, setQuality] = useState<number>();
    const [flame, setFlame] = useState<Flame>(null);

    var image: ImageData = null;

    function animate() {
        renderer.run(ITER_STEP);
        paint();

        if (renderer.iterations < quality * renderer.size * renderer.size) {
            requestAnimationFrame(this);
        }
    }

    function paint() {

    }

    useEffect(() => {
        renderer.flame = flame;
        requestAnimationFrame(animate);
    }, [quality, flame]);

    useEffect(() => { paint(); }, [colorMode]);

    return (
        <FlameContext.Provider value={{setFlame, setQuality}}>
            <canvas
                ref={canvasRef}
                width={renderer.size}
                height={renderer.size}
                style={{
                    aspectRatio: '1 / 1',
                    width: '100%',
                }}
            />
            {children}
        </FlameContext.Provider>
    )
}