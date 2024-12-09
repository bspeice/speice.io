import TeX from "@matejmazur/react-katex";
import {Coefs} from "../src/coefs";

import styles from "../src/css/styles.module.css";

export interface Props {
    title: String;
    isPost: boolean;
    coefs: Coefs;
    setCoefs: (coefs: Coefs) => void;
    resetCoefs: () => void;
}
export const CoefEditor = ({title, isPost, coefs, setCoefs, resetCoefs}: Props) => {
    const resetButton = <button className={styles.inputReset} onClick={resetCoefs}>Reset</button>

    return (
        <div className={styles.inputGroup} style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr'}}>
            <p className={styles.inputTitle} style={{gridColumn: '1/-1'}}>{title} {resetButton}</p>
            <div className={styles.inputElement}>
                <p>{isPost ? <TeX>\alpha</TeX> : 'a'}: {coefs.a}</p>
                <input type={'range'} min={-2} max={2} step={0.01} value={coefs.a}
                       onInput={e => setCoefs({...coefs, a: Number(e.currentTarget.value)})}/>
            </div>
            <div className={styles.inputElement}>
                <p>{isPost ? <TeX>\beta</TeX> : 'b'}: {coefs.b}</p>
                <input type={'range'} min={-2} max={2} step={0.01} value={coefs.b}
                       onInput={e => setCoefs({...coefs, b: Number(e.currentTarget.value)})}/>
            </div>
            <div className={styles.inputElement}>
                <p>{isPost ? <TeX>\gamma</TeX> : 'c'}: {coefs.c}</p>
                <input type={'range'} min={-2} max={2} step={0.01} value={coefs.c}
                       onInput={e => setCoefs({...coefs, c: Number(e.currentTarget.value)})}/>
            </div>
            <div className={styles.inputElement}>
                <p>{isPost ? <TeX>\delta</TeX> : 'd'}: {coefs.d}</p>
                <input type={'range'} min={-2} max={2} step={0.01} value={coefs.d}
                       onInput={e => setCoefs({...coefs, d: Number(e.currentTarget.value)})}/>
            </div>
            <div className={styles.inputElement}>
                <p>{isPost ? <TeX>\epsilon</TeX> : 'e'}: {coefs.e}</p>
                <input type={'range'} min={-2} max={2} step={0.01} value={coefs.e}
                       onInput={e => setCoefs({...coefs, e: Number(e.currentTarget.value)})}/>
            </div>
            <div className={styles.inputElement}>
                <p>{isPost ? <TeX>\zeta</TeX> : 'f'}: {coefs.f}</p>
                <input type={'range'} min={-2} max={2} step={0.01} value={coefs.f}
                       onInput={e => setCoefs({...coefs, f: Number(e.currentTarget.value)})}/>
            </div>
        </div>
    )
}