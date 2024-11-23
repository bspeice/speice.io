import { Coefs } from './coefs'
import { Variation } from './variations'

export interface Transform {
    coefs: Coefs,
    variations: [number, Variation][],
    enabled: boolean,
    coefsPost?: Coefs,
    color?: number
}