import {useContext} from "react";
import { plot } from './plot';
import { randomBiUnit } from '../src/randomBiUnit';
import { randomInteger } from '../src/randomInteger';
import Canvas, {PainterContext} from "../src/Canvas";

const Scope = {
    Canvas,
    PainterContext,
    plot,
    randomBiUnit,
    randomInteger,
    useContext,
}
export default Scope;