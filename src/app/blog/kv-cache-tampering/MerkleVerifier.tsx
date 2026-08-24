'use client'

import { useState } from 'react'
import styles from './kvcache.module.css'

const LEAF_X = [40, 120, 200, 280, 360, 440, 520, 600]
const L1_X = [80, 240, 400, 560]
const L2_X = [160, 480]
const ROOT_X = 320

const Y_LEAF = 312
const Y_L1 = 224
const Y_L2 = 136
const Y_ROOT = 48

function hash(s: string): string {
    let h = 0x811c9dc5
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i)
        h = Math.imul(h, 0x01000193)
    }
    return (h >>> 0).toString(16).padStart(8, '0').slice(0, 4)
}

function buildTree(tampered: boolean[]) {
    const leaf = tampered.map((bad, i) => ({
        h: hash(`L${i}#${bad ? 'x' : 'ok'}`),
        dirty: bad,
    }))
    const l1 = L1_X.map((_, j) => ({
        h: hash(leaf[2 * j].h + leaf[2 * j + 1].h),
        dirty: leaf[2 * j].dirty || leaf[2 * j + 1].dirty,
    }))
    const l2 = L2_X.map((_, k) => ({
        h: hash(l1[2 * k].h + l1[2 * k + 1].h),
        dirty: l1[2 * k].dirty || l1[2 * k + 1].dirty,
    }))
    const root = {
        h: hash(l2[0].h + l2[1].h),
        dirty: l2[0].dirty || l2[1].dirty,
    }
    return { leaf, l1, l2, root }
}

const SEALED = buildTree(new Array(8).fill(false)).root.h

const DANGER = 'var(--kv-danger)'
const DANGER_SOFT = 'var(--kv-danger-soft)'
const LINE = 'var(--kv-line)'

function Edge({ x1, y1, x2, y2, dirty }: { x1: number; y1: number; x2: number; y2: number; dirty: boolean }) {
    return (
        <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={dirty ? DANGER : LINE}
            strokeWidth={dirty ? 2 : 1}
            style={{ transition: 'stroke 0.25s ease' }}
        />
    )
}

function InternalNode({ x, y, h, dirty }: { x: number; y: number; h: string; dirty: boolean }) {
    return (
        <g style={{ transition: 'all 0.25s ease' }}>
            <rect
                x={x - 27}
                y={y - 13}
                width={54}
                height={26}
                rx={7}
                fill={dirty ? DANGER_SOFT : 'hsla(0,0%,100%,0.04)'}
                stroke={dirty ? DANGER : LINE}
                strokeWidth={1}
            />
            <text x={x} y={y + 3.5} textAnchor="middle" className={styles.nodeHash}>
                {h}
            </text>
        </g>
    )
}

export default function MerkleVerifier() {
    const [tampered, setTampered] = useState<boolean[]>(new Array(8).fill(false))
    const { leaf, l1, l2, root } = buildTree(tampered)
    const detected = root.h !== SEALED

    const toggle = (i: number) =>
        setTampered((prev) => prev.map((v, j) => (j === i ? !v : v)))

    return (
        <div className={styles.fig}>
            <div className={styles.controls}>
                <button
                    className={styles.btn}
                    onClick={() => setTampered(new Array(8).fill(false))}
                    disabled={!detected}
                >
                    Restore all
                </button>
                <span className={styles.hint}>click any KV block to tamper with it</span>
            </div>

            <svg
                className={styles.tree}
                viewBox="0 0 640 356"
                role="img"
                aria-label="Merkle tree over KV cache blocks, root sealed in the TEE"
            >
                {/* TEE enclosure around the root */}
                <rect
                    x={224}
                    y={12}
                    width={192}
                    height={70}
                    rx={10}
                    fill="hsla(0,0%,100%,0.02)"
                    stroke={LINE}
                    strokeDasharray="4 4"
                />
                <text x={320} y={26} textAnchor="middle" className={styles.teeLabel}>
                    {`🔒 TEE · sealed root ${SEALED}`}
                </text>

                {/* edges root -> l2 */}
                <Edge x1={ROOT_X} y1={Y_ROOT + 13} x2={L2_X[0]} y2={Y_L2 - 13} dirty={l2[0].dirty} />
                <Edge x1={ROOT_X} y1={Y_ROOT + 13} x2={L2_X[1]} y2={Y_L2 - 13} dirty={l2[1].dirty} />

                {/* edges l2 -> l1 */}
                {L2_X.map((_, k) => (
                    <g key={`e2-${k}`}>
                        <Edge x1={L2_X[k]} y1={Y_L2 + 13} x2={L1_X[2 * k]} y2={Y_L1 - 13} dirty={l1[2 * k].dirty} />
                        <Edge x1={L2_X[k]} y1={Y_L2 + 13} x2={L1_X[2 * k + 1]} y2={Y_L1 - 13} dirty={l1[2 * k + 1].dirty} />
                    </g>
                ))}

                {/* edges l1 -> leaves */}
                {L1_X.map((_, j) => (
                    <g key={`e1-${j}`}>
                        <Edge x1={L1_X[j]} y1={Y_L1 + 13} x2={LEAF_X[2 * j]} y2={Y_LEAF - 22} dirty={leaf[2 * j].dirty} />
                        <Edge x1={L1_X[j]} y1={Y_L1 + 13} x2={LEAF_X[2 * j + 1]} y2={Y_LEAF - 22} dirty={leaf[2 * j + 1].dirty} />
                    </g>
                ))}

                {/* root node */}
                <InternalNode x={ROOT_X} y={Y_ROOT} h={root.h} dirty={detected} />

                {/* level 2 + level 1 */}
                {L2_X.map((x, k) => (
                    <InternalNode key={`l2-${k}`} x={x} y={Y_L2} h={l2[k].h} dirty={l2[k].dirty} />
                ))}
                {L1_X.map((x, j) => (
                    <InternalNode key={`l1-${j}`} x={x} y={Y_L1} h={l1[j].h} dirty={l1[j].dirty} />
                ))}

                {/* leaves (clickable KV blocks) */}
                {LEAF_X.map((x, i) => (
                    <g key={`leaf-${i}`} className={styles.leafHit} onClick={() => toggle(i)}>
                        <title>{`KV block ${i + 1} (click to tamper)`}</title>
                        <rect
                            x={x - 28}
                            y={Y_LEAF - 22}
                            width={56}
                            height={44}
                            rx={7}
                            fill={leaf[i].dirty ? DANGER_SOFT : 'var(--kv-clean-soft)'}
                            stroke={leaf[i].dirty ? DANGER : LINE}
                            strokeWidth={1}
                            style={{ transition: 'all 0.2s ease' }}
                        />
                        <text
                            x={x}
                            y={Y_LEAF - 3}
                            textAnchor="middle"
                            fontSize={12}
                            fontWeight={700}
                            fill="var(--title-color)"
                        >
                            {`KV${i + 1}`}
                        </text>
                        <text x={x} y={Y_LEAF + 12} textAnchor="middle" className={styles.nodeHash}>
                            {leaf[i].h}
                        </text>
                    </g>
                ))}
            </svg>

            <div className={`${styles.banner} ${detected ? styles.bannerDanger : styles.bannerClean}`}>
                {detected ? (
                    <>⚠ Tampering detected: recomputed root {root.h} ≠ sealed root {SEALED}</>
                ) : (
                    <>✓ Verified: recomputed root matches the sealed value in the enclave</>
                )}
            </div>

            <p className={styles.caption}>
                Change a single block and its hash changes; that flips its parent, and its
                parent, all the way up. That is an <strong>O(log n)</strong> path to the root. The
                whole multi-gigabyte cache is guarded by one 32-byte number, and only that
                number lives inside the TEE. An attacker with full disk access still can&apos;t
                forge a cache that reproduces the sealed root without breaking SHA-256.
            </p>
        </div>
    )
}
