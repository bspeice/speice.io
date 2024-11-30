import styles from "../src/css/styles.module.css"

export interface VariationProps {
    linear: number;
    julia: number;
    popcorn: number;
    pdj: number;
}

export interface Props {
    title: String;
    variations: VariationProps;
    setVariations: (variations: VariationProps) => void;
    resetVariations: () => void;
}

export const VariationEditor = ({title, variations, setVariations, resetVariations}: Props) => {
    const resetButton = <button className={styles.inputReset} onClick={resetVariations}>Reset</button>

    return (
        <div className={styles.inputGroup} style={{display: 'grid', gridTemplateColumns: 'auto auto auto auto'}}>
            <p className={styles.inputTitle} style={{gridColumn: '1/-1'}}>{title} {resetButton}</p>
            <div className={styles.inputElement}>
                <span>Linear: {variations.linear}</span>
                <input type={'range'} min={0} max={1} step={0.01} style={{width: '100%'}} value={variations.linear}
                       onInput={e => setVariations({...variations, linear: Number(e.currentTarget.value)})}/>
            </div>
            <div className={styles.inputElement}>
                <span>Julia: {variations.julia}</span>
                <input type={'range'} min={0} max={1} step={0.01} style={{width: '100%'}} value={variations.julia}
                       onInput={e => setVariations({...variations, julia: Number(e.currentTarget.value)})}/>
            </div>
            <div className={styles.inputElement}>
                <span>Popcorn: {variations.popcorn}</span>
                <input type={'range'} min={0} max={1} step={0.01} style={{width: '100%'}} value={variations.popcorn}
                       onInput={e => setVariations({...variations, popcorn: Number(e.currentTarget.value)})}/>
            </div>
            <div className={styles.inputElement}>
                <span>PDJ: {variations.pdj}</span>
                <input type={'range'} min={0} max={1} step={0.01} style={{width: '100%'}} value={variations.pdj}
                       onInput={e => setVariations({...variations, pdj: Number(e.currentTarget.value)})}/>
            </div>
        </div>
    )
}