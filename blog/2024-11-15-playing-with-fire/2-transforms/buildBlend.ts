import { Coefs } from "../src/transform";
import { VariationProps } from "./VariationEditor";
import { linear } from "../src/linear";
import { julia } from "../src/julia";
import { popcorn } from "../src/popcorn";
import { pdj } from "../src/pdj";
import { pdjParams } from "../src/params";
import { Blend } from "../src/blend";

export function buildBlend(coefs: Coefs, variations: VariationProps): Blend {
  return [
    [variations.linear, linear],
    [variations.julia, julia],
    [variations.popcorn, popcorn(coefs)],
    [variations.pdj, pdj(pdjParams)]
  ];
}