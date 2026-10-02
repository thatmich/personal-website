import type { CSSProperties, ReactNode } from 'react'
import styles from './droid.module.css'

/* ---------- shared pieces ---------- */

type Bar = {
    value: number
    display?: string // shown instead of the formatted value
    strong?: boolean // the step where this metric gets fixed
    note?: string // muted line under the bar
}

type Panel = {
    title: string
    bars: Bar[] // one per row label, same order
    log?: boolean // values span orders of magnitude: plot positions on a log axis
}

const fmt = (v: number) => v.toLocaleString('en-US')

const fmtDecade = (v: number) => (v >= 1000 ? `${v / 1000}k` : String(v))

/* Log axis for a panel: whole decades that enclose the values. */
function logAxis(values: number[]) {
    const lo = Math.floor(Math.log10(Math.min(...values)))
    const hi = Math.ceil(Math.log10(Math.max(...values)))
    const pos = (v: number) => ((Math.log10(v) - lo) / (hi - lo)) * 100
    const decades = Array.from({ length: hi - lo + 1 }, (_, i) => +(10 ** (lo + i)).toPrecision(1))
    return { pos, decades }
}

/* Small multiples: one panel per metric, one mark per configuration. Linear
   panels are bars from zero. Log panels are dots, since a bar's length means
   nothing without a zero baseline. */
function BarPanels({ labels, panels, caption }: { labels: ReactNode[]; panels: Panel[]; caption: string }) {
    return (
        <figure className={`${styles.fig} ${styles.figWide}`}>
            <figcaption className={styles.srOnly}>{caption}</figcaption>
            <div className={styles.panels}>
                {panels.map((panel) => {
                    const max = Math.max(...panel.bars.map((b) => b.value))
                    const axis = panel.log ? logAxis(panel.bars.map((b) => b.value)) : null
                    return (
                        <div className={styles.panel} key={panel.title}>
                            <div className={styles.panelTitle}>
                                {panel.title}
                                {axis && <span className={styles.scaleTag}>log scale</span>}
                            </div>
                            {panel.bars.map((bar, i) => (
                                <div className={styles.row} key={i}>
                                    <div className={styles.rowHead}>
                                        <span className={styles.rowLabel}>{labels[i]}</span>
                                        <span className={bar.strong ? styles.rowValueStrong : styles.rowValue}>
                                            {bar.display ?? fmt(bar.value)}
                                        </span>
                                    </div>
                                    {axis ? (
                                        <div className={styles.logTrack}>
                                            {axis.decades.map((d) => (
                                                <div className={styles.decade} style={{ left: `${axis.pos(d)}%` }} key={d} />
                                            ))}
                                            <div className={styles.stem} style={{ width: `${axis.pos(bar.value)}%` }} />
                                            <div className={styles.logDot} style={{ left: `${axis.pos(bar.value)}%` }} />
                                        </div>
                                    ) : (
                                        <div className={styles.track}>
                                            {bar.value > 0 && (
                                                <div
                                                    className={styles.bar}
                                                    style={{ width: `${(bar.value / max) * 100}%` }}
                                                />
                                            )}
                                        </div>
                                    )}
                                    {bar.note && <div className={styles.rowNote}>{bar.note}</div>}
                                </div>
                            ))}
                            {axis && (
                                <div className={styles.axis}>
                                    {axis.decades.map((d) => (
                                        <span className={styles.tick} style={{ left: `${axis.pos(d)}%` }} key={d}>
                                            {fmtDecade(d)}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </figure>
    )
}

/* Read by screen readers in place of the picture; each states what its chart shows. */
const CAPTIONS = {
    robot:
        'Timeline on a log time axis of how long the real robot ran before a controller dropout. On stock Ubuntu it dropped out 8 times in about 40 seconds: first after 12.2 seconds, then every 1.2 seconds at the median. With the full setup it ran about 6 minutes with no dropouts.',
    buildUp:
        'Wake-up latency and noise on CPU 12 as each kernel setting is added, on log scales. isolcpus cuts the worst-case wake-up from 771 to 7 microseconds. nohz_full cuts total noise from about 10,000 to 130 microseconds per 26 seconds, and irqaffinity brings it to 6.',
    interrupts:
        'Interrupts landing on CPU 12 per second as each kernel setting is added, on log scales. Hardware interrupts fall from 2,371 on stock Ubuntu to about 1,000 with isolcpus, 12 with nohz_full and 1.1 with the full setup. RCU softirqs fall from 564 to 0.05, and timer softirqs from 40 to 0.07.',
    skipIsolcpus:
        'Skipping isolcpus, on log scales. With rcu_nocbs and irqaffinity but no isolation, the worst-case wake-up is 1,285 microseconds, noise is 19,163 microseconds and there are 2,702 hardware interrupts per second: no better than stock Ubuntu. The full setup gives 8 microseconds, 6 microseconds and 1.1 interrupts per second.',
    skipNohz:
        'Predicted against measured for the full setup without nohz_full. Worst-case wake-up: predicted about 7 microseconds, measured 7. Timer tick interrupts per second: predicted about 1,000, measured 1,024. RCU softirqs per second: predicted about 470, measured 469. Total noise: predicted thousands of microseconds, measured 7,867.',
    preemption:
        'Voluntary against full preemption, with and without isolcpus. The worst-case wake-up on CPU 12 is 771 and 1,653 microseconds on stock Ubuntu, and 7 microseconds with isolcpus in both modes. Missed replies are 3, 4, 9 and 0. Late packets from the fake control box fall from about 3,000 under voluntary preemption to 2 under full preemption.',
}

const STOCK = 'Stock Ubuntu'
const FULL = 'Full setup'

const BUILD_UP_LABELS = [
    STOCK,
    <>+ <code>isolcpus</code></>,
    <>+ <code>rcu_nocbs</code></>,
    <>+ <code>nohz_full</code></>,
    <>+ <code>irqaffinity</code> (full setup)</>,
]

/* ---------- real robot: time until a controller dropout ---------- */

/* Stock Ubuntu trials, seconds until the dropout. Trial 1 is from a clean start. */
const DROPOUTS_S = [12.2, 1.9, 1.2, 0.4, 1.1, 1.2, 2.0, 1.2]
const FULL_RUN_S = 360

const T_MIN = 0.25
const T_MAX = 500
const T_TICKS: Array<[number, string]> = [[1, '1 s'], [10, '10 s'], [60, '1 min'], [360, '6 min']]

const tPos = (s: number) => (Math.log(s / T_MIN) / Math.log(T_MAX / T_MIN)) * 100

/* Stack dots that would overlap into lanes, like a dot histogram. */
function lanes(values: number[]) {
    const placed: Array<{ v: number; lane: number }> = []
    for (const v of [...values].sort((a, b) => a - b)) {
        const taken = placed.filter((p) => v / p.v < 1.3).map((p) => p.lane)
        let lane = 0
        while (taken.includes(lane)) lane++
        placed.push({ v, lane })
    }
    return placed
}

export function RobotDropouts() {
    return (
        <figure className={styles.fig}>
            <figcaption className={styles.srOnly}>{CAPTIONS.robot}</figcaption>
            <div className={styles.panelTitle}>Time until a controller dropout (log scale)</div>

            <div className={styles.row}>
                <div className={styles.rowHead}>
                    <span className={styles.rowLabel}>{STOCK}</span>
                    <span className={styles.rowValue}>8 dropouts in ~40 s</span>
                </div>
                <div className={styles.timeline}>
                    {T_TICKS.map(([s]) => (
                        <div className={styles.gridline} style={{ left: `${tPos(s)}%` }} key={s} />
                    ))}
                    {lanes(DROPOUTS_S).map((d, i) => (
                        <div
                            className={styles.dot}
                            style={{ left: `${tPos(d.v)}%`, '--lane': d.lane } as CSSProperties}
                            title={`Dropout after ${d.v} s`}
                            key={i}
                        />
                    ))}
                </div>
                <div className={styles.rowNote}>
                    first after 12.2 s from a clean start, then every 1.2 s (median, range 0.4–2.0 s)
                </div>
            </div>

            <div className={styles.row}>
                <div className={styles.rowHead}>
                    <span className={styles.rowLabel}>{FULL}</span>
                    <span className={styles.rowValueStrong}>0 dropouts in ~6 min</span>
                </div>
                <div className={`${styles.timeline} ${styles.timelineShort}`}>
                    {T_TICKS.map(([s]) => (
                        <div className={styles.gridline} style={{ left: `${tPos(s)}%` }} key={s} />
                    ))}
                    <div
                        className={styles.runLine}
                        style={{ width: `${tPos(FULL_RUN_S)}%` }}
                        title="Ran ~6 min with no dropout"
                    />
                    <div className={styles.runEnd} style={{ left: `${tPos(FULL_RUN_S)}%` }} />
                </div>
            </div>

            <div className={styles.axis}>
                {T_TICKS.map(([s, label]) => (
                    <span className={styles.tick} style={{ left: `${tPos(s)}%` }} key={s}>
                        {label}
                    </span>
                ))}
            </div>
        </figure>
    )
}

/* ---------- fake control box: adding one setting at a time ---------- */

export function BuildUp() {
    return (
        <BarPanels
            caption={CAPTIONS.buildUp}
            labels={BUILD_UP_LABELS}
            panels={[
                {
                    title: 'Wake-up p99.9 (µs)', log: true,
                    bars: [{ value: 184 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 3 }],
                },
                {
                    title: 'Wake-up max (µs)', log: true,
                    bars: [{ value: 771 }, { value: 7, strong: true }, { value: 8 }, { value: 14 }, { value: 8 }],
                },
                {
                    title: 'Total noise (µs per 26 s)', log: true,
                    bars: [
                        { value: 16626 },
                        { value: 6765 },
                        { value: 10137 },
                        { value: 130, strong: true },
                        { value: 6, strong: true },
                    ],
                },
            ]}
        />
    )
}

export function InterruptSources() {
    return (
        <BarPanels
            caption={CAPTIONS.interrupts}
            labels={BUILD_UP_LABELS}
            panels={[
                {
                    title: 'Hardware interrupts / s', log: true,
                    bars: [
                        {
                            value: 2371,
                            note: 'rescheduling IPIs (1,090 / s), timer tick (1,016 / s), NVMe SSD (233 / s)',
                        },
                        { value: 997, note: 'timer tick (995 / s)' },
                        { value: 999, note: 'timer tick (996 / s)' },
                        { value: 12, note: 'LAN network card (7.3 / s)' },
                        { value: 1.1, note: 'function-call IPIs (0.9 / s)' },
                    ],
                },
                {
                    title: 'RCU softirqs / s', log: true,
                    bars: [{ value: 564 }, { value: 458 }, { value: 469 }, { value: 1.1 }, { value: 0.05 }],
                },
                {
                    title: 'Timer softirqs / s', log: true,
                    bars: [{ value: 40 }, { value: 0.5 }, { value: 0.8 }, { value: 1.1 }, { value: 0.07 }],
                },
            ]}
        />
    )
}

/* ---------- the two "can I skip it?" checks ---------- */

export function SkipIsolcpus() {
    return (
        <BarPanels
            caption={CAPTIONS.skipIsolcpus}
            labels={[
                STOCK,
                <><code>rcu_nocbs</code> + <code>irqaffinity</code>, no isolation</>,
                FULL,
            ]}
            panels={[
                { title: 'Wake-up max (µs)', log: true, bars: [{ value: 771 }, { value: 1285 }, { value: 8 }] },
                { title: 'Total noise (µs per 26 s)', log: true, bars: [{ value: 16626 }, { value: 19163 }, { value: 6 }] },
                { title: 'Hardware interrupts / s', log: true, bars: [{ value: 2371 }, { value: 2702 }, { value: 1.1 }] },
            ]}
        />
    )
}

type Prediction = {
    label: string
    measured: number
    predicted: [number, number] // a point when both ends are equal, otherwise a range
    predictedText: string
    scaleMax: number
}

const PREDICTIONS: Prediction[] = [
    { label: 'Wake-up max (µs)', measured: 7, predicted: [7, 7], predictedText: '~7', scaleMax: 10 },
    { label: 'Timer tick interrupts / s', measured: 1024, predicted: [1000, 1000], predictedText: '~1,000', scaleMax: 1250 },
    { label: 'RCU softirqs / s', measured: 469, predicted: [470, 470], predictedText: '~470', scaleMax: 600 },
    { label: 'Total noise (µs per 26 s)', measured: 7867, predicted: [1000, 9999], predictedText: 'thousands', scaleMax: 10000 },
]

/* Bullet chart: the bar is what was measured, the marker is what was predicted. */
export function SkipNohz() {
    return (
        <figure className={styles.fig}>
            <figcaption className={styles.srOnly}>{CAPTIONS.skipNohz}</figcaption>
            <div className={styles.legend}>
                <span className={styles.legendItem}>
                    <span className={styles.legendBar} />
                    Measured
                </span>
                <span className={styles.legendItem}>
                    <span className={styles.legendMark} />
                    Predicted
                </span>
            </div>
            {PREDICTIONS.map((p) => {
                const [lo, hi] = p.predicted
                const pct = (v: number) => `${(v / p.scaleMax) * 100}%`
                return (
                    <div className={styles.row} key={p.label}>
                        <div className={styles.rowHead}>
                            <span className={styles.rowLabel}>{p.label}</span>
                            <span className={styles.rowValue}>
                                predicted {p.predictedText} · measured <strong>{fmt(p.measured)}</strong>
                            </span>
                        </div>
                        <div className={styles.bulletTrack}>
                            {lo !== hi && (
                                <div
                                    className={styles.predictedBand}
                                    style={{ left: pct(lo), width: pct(hi - lo) }}
                                />
                            )}
                            <div className={styles.bar} style={{ width: pct(p.measured) }} />
                            {lo === hi && <div className={styles.predictedMark} style={{ left: pct(lo) }} />}
                        </div>
                    </div>
                )
            })}
        </figure>
    )
}

/* ---------- preemption model ---------- */

export function PreemptionModel() {
    return (
        <BarPanels
            caption={CAPTIONS.preemption}
            labels={[
                `${STOCK}, voluntary`,
                `${STOCK}, full`,
                <><code>isolcpus</code>, voluntary</>,
                <><code>isolcpus</code>, full</>,
            ]}
            panels={[
                {
                    title: 'Wake-up max on CPU 12 (µs)', log: true,
                    bars: [{ value: 771 }, { value: 1653 }, { value: 7 }, { value: 7 }],
                },
                {
                    title: 'Missed replies',
                    bars: [{ value: 3 }, { value: 4 }, { value: 9 }, { value: 0 }],
                },
                {
                    title: 'Late packets from the fake control box', log: true,
                    bars: [{ value: 2807 }, { value: 2 }, { value: 3032 }, { value: 2 }],
                },
            ]}
        />
    )
}

/* ---------- appendix, collapsed until clicked ---------- */

export function Appendix({ children }: { children: ReactNode }) {
    return (
        <details className={styles.appendix}>
            <summary className={styles.appendixSummary}>
                <h2>Appendix</h2>
            </summary>
            {children}
        </details>
    )
}
