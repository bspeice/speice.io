// hidden-start
import { Variation } from './variations'
//hidden-end
export function pdj(a: number, b: number, c: number, d: number): Variation {
    return (x, y) => [
        Math.sin(a * y) - Math.cos(b * x),
        Math.sin(c * x) - Math.cos(d * y)
    ]
}