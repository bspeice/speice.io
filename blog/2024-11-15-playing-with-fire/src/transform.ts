import { Coefs } from './coefs'
import { Variation } from './variation'

export interface Transform {
    coefs: Coefs,
    variations: [number, Variation][],
    coefsPost: Coefs,
    color: number
}