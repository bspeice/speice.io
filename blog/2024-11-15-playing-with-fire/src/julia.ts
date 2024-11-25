// hidden-start
import { Variation } from './variation'
// hidden-end
export const julia: Variation = (x, y) => {
    const r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
    const theta = Math.atan2(x, y);
    const omega = Math.random() > 0.5 ? 0 : Math.PI;

    return [
        r * Math.cos(theta / 2 + omega),
        r * Math.sin(theta / 2 + omega)
    ]
}