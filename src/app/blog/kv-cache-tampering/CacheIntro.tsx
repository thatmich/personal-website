'use client'

import { useState, type ReactElement } from 'react'
import styles from './kvcache.module.css'

const MAX = 7
const CELL = 40
const PAD = 22 // room for row/col labels

export default function CacheIntro() {
    const [t, setT] = useState(4)

    const gridW = PAD + MAX * CELL
    const gridH = PAD + MAX * CELL

    const cells: ReactElement[] = []
    for (let row = 0; row < MAX; row++) {
        for (let col = 0; col < MAX; col++) {
            const visible = row < t // token has arrived
            const causal = col <= row // lower-triangular mask
            const newest = row === t - 1
            let fill = 'transparent'
            let opacity = 1
            if (visible && causal) {
                fill = newest ? 'var(--kv-accent)' : 'var(--kv-accent-soft)'
            } else if (visible && !causal) {
                fill = 'hsla(0,0%,100%,0.03)' // masked-out future token
            } else {
                opacity = 0.12
            }
            cells.push(
                <rect
                    key={`${row}-${col}`}
                    x={PAD + col * CELL + 3}
                    y={PAD + row * CELL + 3}
                    width={CELL - 6}
                    height={CELL - 6}
                    rx={6}
                    fill={fill}
                    stroke="var(--kv-line)"
                    strokeWidth={1}
                    opacity={opacity}
                    style={{ transition: 'fill 0.25s ease, opacity 0.25s ease' }}
                />,
            )
        }
    }

    const colLabels: ReactElement[] = []
    for (let c = 0; c < MAX; c++) {
        colLabels.push(
            <text
                key={`c${c}`}
                x={PAD + c * CELL + CELL / 2}
                y={14}
                textAnchor="middle"
                fontSize={11}
                fill="var(--text-color)"
                opacity={c < t ? 0.75 : 0.25}
            >
                {`t${c + 1}`}
            </text>,
        )
    }

    return (
        <div className={styles.fig}>
            <div className={styles.controls}>
                <button
                    className={styles.btn}
                    onClick={() => setT((v) => Math.min(MAX, v + 1))}
                    disabled={t >= MAX}
                >
                    + Add token
                </button>
                <button
                    className={styles.btn}
                    onClick={() => setT(1)}
                    disabled={t <= 1}
                >
                    Reset
                </button>
                <span className={styles.hint}>
                    {t} token{t === 1 ? '' : 's'} generated
                </span>
            </div>

            <div className={styles.introGrid}>
                <div className={styles.introCol}>
                    <div className={styles.introColTitle}>
                        Causal attention · row = query, column = key
                    </div>
                    <svg
                        className={styles.matrix}
                        viewBox={`0 0 ${gridW} ${gridH}`}
                        role="img"
                        aria-label="Lower-triangular causal attention matrix"
                    >
                        {colLabels}
                        {cells}
                    </svg>
                </div>

                <div className={styles.introCol}>
                    <div className={styles.introColTitle}>
                        The KV cache · one block per token
                    </div>
                    <div className={styles.strip}>
                        {Array.from({ length: t }, (_, i) => (
                            <div
                                key={i}
                                className={`${styles.block} ${styles.cacheBlock} ${i === t - 1 ? styles.blockAccent : ''}`}
                            >
                                <div className={styles.blockLabel}>
                                    KV<sub>{i + 1}</sub>
                                </div>
                                <div className={styles.blockSub}>token {i + 1}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <p className={styles.caption}>
                Left: what each token attends to. Right: what gets stored, one block per token.
            </p>
        </div>
    )
}
