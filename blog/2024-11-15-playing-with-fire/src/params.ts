/**
 * Parameters taken from the reference .flame file,
 * translated into something that's easier to work with.
 */

import { Blend } from "./blend";
import { linear } from "./linear";
import { julia } from "./julia";
import { popcorn } from "./popcorn";
import { pdj, PdjParams } from "./pdj";
import { Coefs, Transform } from "./transform";
import { applyPost, applyTransform } from "./applyTransform";

export const identityCoefs: Coefs = {
  a: 1, b: 0, c: 0,
  d: 0, e: 1, f: 0
};

export const pdjParams: PdjParams = {
  a: 1.09358, b: 2.13048, c: 2.54127, d: 2.37267
};

export const xform1Weight = 0.56453495;
export const xform1Coefs = {
  a: -1.381068, b: -1.381068, c: 0,
  d: 1.381068, e: -1.381068, f: 0
};
export const xform1CoefsPost = identityCoefs;
export const xform1Variations: Blend = [
  [1, julia]
];
export const xform1Color = 0;

export const xform2Weight = 0.013135;
export const xform2Coefs = {
  a: 0.031393, b: 0.031367, c: 0,
  d: -0.031367, e: 0.031393, f: 0
};
export const xform2CoefsPost = {
  a: 1, b: 0, c: 0.24,
  d: 0, e: 1, f: 0.27
};
export const xform2Variations: Blend = [
  [1, linear],
  [1, popcorn(xform2Coefs)]
];
export const xform2Color = 0.844;

export const xform3Weight = 0.42233;
export const xform3Coefs = {
  a: 1.51523, b: -3.048677, c: 0.724135,
  d: 0.740356, e: -1.455964, f: -0.362059
};
export const xform3CoefsPost = identityCoefs;
export const xform3Variations: Blend = [
  [1, pdj(pdjParams)]
];
export const xform3Color = 0.349;

export const xformFinalCoefs = {
  a: 2, b: 0, c: 0,
  d: 0, e: 2, f: 0
};
export const xformFinalCoefsPost = identityCoefs;
export const xformFinalVariations: Blend = [
  [1, julia]
];
export const xformFinalColor = 0;

export const xforms: [number, Transform][] = [
  [xform1Weight, applyPost(xform1CoefsPost, applyTransform(xform1Coefs, xform1Variations))],
  [xform2Weight, applyPost(xform2CoefsPost, applyTransform(xform2Coefs, xform2Variations))],
  [xform3Weight, applyPost(xform3CoefsPost, applyTransform(xform3Coefs, xform3Variations))]
];

export const xformFinal: Transform = applyPost(xformFinalCoefsPost, applyTransform(xformFinalCoefs, xformFinalVariations));

export const paletteString =
  "3130323635383B3A3D403F424644484B494D504E52565358" +
  "5B585D605D626562686B676D706C737571787B767D807B83" +
  "8580888A858D908A93958F989A949DA099A3A59EA8AAA3AD" +
  "AFA8B3B5ADB8BAB2BEBFB7C3C5BCC8CAC1CECFC6D3D4CBD8" +
  "DAD0DEDFD5E3DFD2E0DFCEDDE0CBDAE0C8D7E0C4D3E0C1D0" +
  "E1BECDE1BBCAE1B7C7E1B4C4E1B1C1E2ADBEE2AABAE2A7B7" +
  "E2A3B4E2A0B1E39DAEE399ABE396A8E393A5E490A1E48C9E" +
  "E4899BE48698E48295E57F92E57C8FE5788CE57589E57285" +
  "E66E82E66B7FE6687CE66479E76176E75E73E75B70E7576C" +
  "E75469E85166E84D63E84A60E4495EE0485CDC475BD84659" +
  "D44557D04455CB4353C74252C34150BF404EBB3F4CB73E4B" +
  "B33D49AF3C47AB3B45A73A43A339429F38409B373E97363C" +
  "92353A8E34398A33378632358231337E30327A2F30762E2E" +
  "722D2C6E2C2A6A2B29662A276229255E2823592721552620" +
  "51251E4D241C49231A4522194121173D20153C1F153A1F14" +
  "391E14381E14361D14351C13341C13321B13311B132F1A12" +
  "2E19122D19122B18122A1811291711271611261611251510" +
  "23151022141021140F1F130F1E120F1C120F1B110E1A110E" +
  "18100E170F0E160F0D140E0D130E0D120D0D100C0C0F0C0C" +
  "0E0B0C0C0B0C0B0A0B09090B08090B07080B05080A04070A" +
  "0606090804090A03088C46728A457087446D85436B824369" +
  "8042667D41647B4061793F5F763E5D743D5A713D586F3C56" +
  "6C3B536A3A5168394F65384C63374A6037485E36455B3543" +
  "59344057333E54323C5231394F31374D30354A2F32482E30" +
  "462D2E432C2B412B293E2B273C2A2439292237281F35271D" +
  "32261B3025182D25162B241428231126220F25210F24210E" +
  "23200E221F0E221E0D211E0D201D0D1F1C0D1E1B0C1D1B0C" +
  "1C1A0C1B190B1B180B1A180B19170A18160A17150A161509" +
  "1514091413091413081312081211081110081010070F0F07" +
  "0E0E070D0D060C0D060C0C060B0B050A0A05090A05080904" +
  "070804060704050704050603040503030403020402010302" +
  "0608070C0D0D1112121617171B1C1D2121222626272B2B2D";

function hexToBytes(hex: string) {
  let bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.substring(i, i + 2), 16));
  }
  return bytes;
}

export const palette = hexToBytes(paletteString).map(value => value / 0xff);