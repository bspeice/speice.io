import { Coefs } from './coefs'
import { Variation } from './variations'

export interface Transform {
    coefs: Coefs,
    variations: [number, Variation][],
    coefsPost: Coefs,
    color: number
}