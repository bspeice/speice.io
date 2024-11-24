import React, {useContext, useEffect} from "react";
import randomBiUnit from './biunit';
import plot from './plot';
import randomInteger from './randint';
import Canvas, {ImageContext} from "../src/Canvas";

interface Props {
    renderFn: (image: ImageData) => void;
}
function Render({renderFn}: Props) {
    const {width, height, setImage} = useContext(ImageContext);
    const image = new ImageData(width, height);

    useEffect(() => {
        renderFn(image);
        setImage(image);
    }, []);

    return <></>;
}

const Scope = {
    plot,
    randomBiUnit,
    randomInteger,
    Canvas,
    Gasket: ({renderFn}: Props) =>
        <Canvas width={600} height={600}><Render renderFn={renderFn}/></Canvas>
}
export default Scope;