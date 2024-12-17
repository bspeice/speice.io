// hidden-start
import { Variation } from "./variation";
// hidden-end
const omega =
  () => Math.random() > 0.5 ? 0 : Math.PI;

export const julia: Variation =
  (x, y) => {
    const x2 = Math.pow(x, 2);
    const y2 = Math.pow(y, 2);
    const r = Math.sqrt(x2 + y2);

    const theta = Math.atan2(x, y);

    const sqrtR = Math.sqrt(r);
    const thetaVal = theta / 2 + omega();
    return [
      sqrtR * Math.cos(thetaVal),
      sqrtR * Math.sin(thetaVal)
    ];
  };