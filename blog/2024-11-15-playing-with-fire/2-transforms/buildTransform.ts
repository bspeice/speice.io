import {applyCoefs, Coefs} from "../src/coefs";
import {VariationProps} from "./VariationEditor";
import {Transform} from "../src/transform";
import {linear} from "../src/linear";
import {julia} from "../src/julia";
import {popcorn} from "../src/popcorn";
import {pdj} from "../src/pdj";
import {pdjParams} from "../src/params";
import {blend} from "./blend";
import {VariationBlend} from "../src/variationBlend";

export function buildBlend(coefs: Coefs, variations: VariationProps): VariationBlend {
    return [
        [variations.linear, linear],
        [variations.julia, julia],
        [variations.popcorn, popcorn(coefs)],
        [variations.pdj, pdj(pdjParams)]
    ]
}

export function buildTransform(coefs: Coefs, variations: VariationBlend): Transform {
    return (x: number, y: number) => {
        [x, y] = applyCoefs(x, y, coefs);
        return blend(x, y, variations);
    }
}