'use client'

import { useEffect, useRef, useState, type ReactElement, type RefObject } from 'react'
import styles from './droid.module.css'

/* ---------- the contract being drawn ---------- */

const STATE_BYTES = 2373 // control box -> NUC, robot state
const CMD_BYTES = 371 // NUC -> control box, desired motion

/* Wall-clock milliseconds per simulated millisecond in slow motion. */
const SLOWDOWN = 2000

/* ---------- geometry, in SVG user units ---------- */

const BOX_W = 150
const BOX_H = 112
const BOX_D = 28 // cabinet-projection depth

/* The lanes are drawn in their own frame: x runs along the lane from the
   control box (0) to the NUC (laneLen), with the up lane on y = 0 and the
   down lane LANE_GAP below it. Each layout places that frame with a
   transform, so the packets move the same way in both. */
const LANE_GAP = 46

type Layout = {
    id: string
    vertical: boolean
    vbW: number
    vbH: number
    box: { x: number; y: number } // control box, front-face top left
    nuc: { x: number; y: number }
    lane: { x: number; y: number } // where the lane frame's origin lands
    laneLen: number
}

/* Side by side: the lanes leave the control box silhouette and meet the NUC
   front face. */
const WIDE: Layout = {
    id: 'wide',
    vertical: false,
    vbW: 730,
    vbH: 250,
    box: { x: 34, y: 84 },
    nuc: { x: 540, y: 84 },
    lane: { x: 34 + BOX_W + BOX_D, y: 118 },
    laneLen: 540 - (34 + BOX_W + BOX_D),
}

/* Stacked, for phones: the side-by-side drawing scaled to a phone's width
   leaves its labels a few pixels tall. The lane frame is flipped onto the
   vertical, so the lanes run down from the control box to the top of the NUC. */
const NARROW: Layout = {
    id: 'narrow',
    vertical: true,
    vbW: 320,
    vbH: 500,
    box: { x: 71, y: 60 },
    nuc: { x: 71, y: 350 },
    lane: { x: 137, y: 60 + BOX_H },
    laneLen: 350 - BOX_D - (60 + BOX_H),
}

const PKT_H = 13
const PKT_UP_W = 48
const PKT_DN_W = (PKT_UP_W * CMD_BYTES) / STATE_BYTES // drawn to scale
const TAIL = 30

/* Phase boundaries inside one 1.000 ms cycle. */
const P_UP_END = 0.42
const P_COMPUTE_END = 0.56
const P_DN_END = 0.96

/* ---------- helpers ---------- */

function faceTop(x: number, y: number, w: number, d: number) {
    return `M${x},${y} L${x + d},${y - d} L${x + w + d},${y - d} L${x + w},${y} Z`
}

function faceSide(x: number, y: number, w: number, h: number, d: number) {
    return `M${x + w},${y} L${x + w + d},${y - d} L${x + w + d},${y + h - d} L${x + w},${y + h} Z`
}

type ChassisProps = {
    x: number
    y: number
    line1: string
    line2: string
    sub: string
    caption: string
    captionAbove?: boolean
    accent: string
    glowRef: RefObject<SVGRectElement | null>
}

function Chassis({ x, y, line1, line2, sub, caption, captionAbove, accent, glowRef }: ChassisProps) {
    const vents: ReactElement[] = []
    for (let i = 0; i < 6; i++) {
        const vx = x + BOX_D * 0.45 + 16 + i * 14
        const vy = y - BOX_D * 0.45
        vents.push(
            <line
                key={i}
                x1={vx}
                y1={vy}
                x2={vx + BOX_D * 0.3}
                y2={vy - BOX_D * 0.3}
                stroke="hsla(0,0%,100%,0.18)"
                strokeWidth={1.5}
                strokeLinecap="round"
            />,
        )
    }

    const ports: ReactElement[] = []
    for (let i = 0; i < 3; i++) {
        ports.push(
            <rect
                key={i}
                x={x + 16 + i * 13}
                y={y + BOX_H - 20}
                width={9}
                height={7}
                rx={1.5}
                fill="hsla(0,0%,0%,0.45)"
                stroke="var(--dl-line)"
                strokeWidth={0.8}
            />,
        )
    }

    return (
        <g>
            {/* activity halo, opacity driven by the animation loop */}
            <rect
                ref={glowRef}
                x={x - 5}
                y={y - BOX_D - 5}
                width={BOX_W + BOX_D + 10}
                height={BOX_H + BOX_D + 10}
                rx={10}
                fill="none"
                stroke={accent}
                strokeWidth={1.5}
                opacity={0}
            />

            <path d={faceTop(x, y, BOX_W, BOX_D)} fill="var(--dl-face-top)" stroke="var(--dl-line)" strokeWidth={1} />
            <path
                d={faceSide(x, y, BOX_W, BOX_H, BOX_D)}
                fill="var(--dl-face-side)"
                stroke="var(--dl-line)"
                strokeWidth={1}
            />
            <rect
                x={x}
                y={y}
                width={BOX_W}
                height={BOX_H}
                rx={3}
                fill="var(--dl-face)"
                stroke="var(--dl-line)"
                strokeWidth={1}
            />
            {vents}

            <circle cx={x + 21} cy={y + 23} r={4} fill={accent} opacity={0.9} />
            <circle cx={x + 21} cy={y + 23} r={7.5} fill={accent} opacity={0.18} />

            <text className={styles.chassisLabel} x={x + 34} y={y + 28}>
                {line1}
            </text>
            <text className={styles.chassisLabel} x={x + 16} y={y + 52}>
                {line2}
            </text>
            <text className={styles.chassisSub} x={x + 16} y={y + 70}>
                {sub}
            </text>
            {ports}
            <text
                className={styles.caption2}
                x={x + BOX_D / 2 + BOX_W / 2}
                y={captionAbove ? y - BOX_D - 12 : y + BOX_H + 26}
                textAnchor="middle"
            >
                {caption}
            </text>
        </g>
    )
}

/* ---------- one drawing of the exchange ---------- */

type StageRefs = {
    pktUp: RefObject<SVGGElement | null>
    pktDn: RefObject<SVGGElement | null>
    streamUp: RefObject<SVGGElement | null>
    streamDn: RefObject<SVGGElement | null>
    glowL: RefObject<SVGRectElement | null>
    glowR: RefObject<SVGRectElement | null>
}

function useStageRefs(): StageRefs {
    return {
        pktUp: useRef<SVGGElement>(null),
        pktDn: useRef<SVGGElement>(null),
        streamUp: useRef<SVGGElement>(null),
        streamDn: useRef<SVGGElement>(null),
        glowL: useRef<SVGRectElement>(null),
        glowR: useRef<SVGRectElement>(null),
    }
}

function Stage({ layout, refs }: { layout: Layout; refs: StageRefs }) {
    const { id, vertical, lane, laneLen } = layout
    const laneFrame = vertical ? `matrix(0 1 1 0 ${lane.x} ${lane.y})` : `translate(${lane.x},${lane.y})`
    const laneMid = lane.y + laneLen / 2

    return (
        <svg
            className={`${styles.stage} ${vertical ? styles.stageNarrow : styles.stageWide}`}
            viewBox={`0 0 ${layout.vbW} ${layout.vbH}`}
            role="img"
            aria-label="The Franka control box and the NUC exchanging one 2373-byte state packet and one 371-byte command packet every millisecond"
        >
            <defs>
                <linearGradient id={`dlTailUp-${id}`} x1="0" x2="1">
                    <stop offset="0" stopColor="var(--dl-up)" stopOpacity="0" />
                    <stop offset="1" stopColor="var(--dl-up)" stopOpacity="0.45" />
                </linearGradient>
                <linearGradient id={`dlTailDn-${id}`} x1="0" x2="1">
                    <stop offset="0" stopColor="var(--dl-dn)" stopOpacity="0.45" />
                    <stop offset="1" stopColor="var(--dl-dn)" stopOpacity="0" />
                </linearGradient>
                <linearGradient id={`dlBandUp-${id}`} x1="0" x2="1">
                    <stop offset="0" stopColor="var(--dl-up)" stopOpacity="0.25" />
                    <stop offset="1" stopColor="var(--dl-up)" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id={`dlBandDn-${id}`} x1="0" x2="1">
                    <stop offset="0" stopColor="var(--dl-dn)" stopOpacity="0.8" />
                    <stop offset="1" stopColor="var(--dl-dn)" stopOpacity="0.25" />
                </linearGradient>
            </defs>

            {/* ---- lanes ---- */}
            <g transform={laneFrame}>
                {/* up: control box -> NUC */}
                <rect
                    x={0}
                    y={-1}
                    width={laneLen}
                    height={2}
                    fill="var(--dl-up)"
                    opacity={0.2}
                />
                <path
                    d={`M${laneLen - 9},-5.5 L${laneLen},0 L${laneLen - 9},5.5 Z`}
                    fill="var(--dl-up)"
                    opacity={0.8}
                />

                <g ref={refs.streamUp} opacity={0}>
                    <rect
                        x={0}
                        y={-6}
                        width={laneLen - 6}
                        height={12}
                        rx={6}
                        fill={`url(#dlBandUp-${id})`}
                    />
                    <line
                        className={styles.streamDashUp}
                        x1={0}
                        y1={0}
                        x2={laneLen - 6}
                        y2={0}
                        stroke="hsla(0,0%,100%,0.35)"
                        strokeWidth={12}
                    />
                </g>

                <g ref={refs.pktUp} opacity={0}>
                    <rect x={-TAIL} y={-PKT_H / 2 + 2.5} width={TAIL} height={PKT_H - 5} fill={`url(#dlTailUp-${id})`} />
                    <rect
                        x={0}
                        y={-PKT_H / 2}
                        width={PKT_UP_W}
                        height={PKT_H}
                        rx={3}
                        fill="var(--dl-up)"
                        stroke="hsla(0,0%,100%,0.45)"
                        strokeWidth={0.8}
                    />
                </g>

                {/* down: NUC -> control box */}
                <g ref={refs.streamDn} opacity={0}>
                    <rect
                        x={6}
                        y={LANE_GAP - 6}
                        width={laneLen - 6}
                        height={12}
                        rx={6}
                        fill={`url(#dlBandDn-${id})`}
                    />
                    <line
                        className={styles.streamDashDn}
                        x1={6}
                        y1={LANE_GAP}
                        x2={laneLen}
                        y2={LANE_GAP}
                        stroke="hsla(0,0%,100%,0.35)"
                        strokeWidth={12}
                    />
                </g>

                <rect
                    x={0}
                    y={LANE_GAP - 1}
                    width={laneLen}
                    height={2}
                    fill="var(--dl-dn)"
                    opacity={0.2}
                />
                <path
                    d={`M9,${LANE_GAP - 5.5} L0,${LANE_GAP} L9,${LANE_GAP + 5.5} Z`}
                    fill="var(--dl-dn)"
                    opacity={0.8}
                />

                <g ref={refs.pktDn} opacity={0}>
                    <rect
                        x={PKT_DN_W}
                        y={-PKT_H / 2 + 2.5}
                        width={TAIL}
                        height={PKT_H - 5}
                        fill={`url(#dlTailDn-${id})`}
                    />
                    <rect
                        x={0}
                        y={-PKT_H / 2}
                        width={PKT_DN_W}
                        height={PKT_H}
                        rx={2.5}
                        fill="var(--dl-dn)"
                        stroke="hsla(0,0%,100%,0.45)"
                        strokeWidth={0.8}
                    />
                </g>
            </g>

            {vertical ? (
                <>
                    <text className={styles.laneLabel} x={lane.x - 12} y={laneMid - 3} textAnchor="end" fill="var(--dl-up)">
                        Robot state
                    </text>
                    <text className={styles.laneBytes} x={lane.x - 12} y={laneMid + 13} textAnchor="end">
                        2373 B · UDP
                    </text>
                    <text className={styles.laneLabel} x={lane.x + LANE_GAP + 12} y={laneMid - 3} fill="var(--dl-dn)">
                        Desired motion
                    </text>
                    <text className={styles.laneBytes} x={lane.x + LANE_GAP + 12} y={laneMid + 13}>
                        371 B · UDP
                    </text>
                </>
            ) : (
                <>
                    <text className={styles.laneLabel} x={lane.x} y={lane.y - 16} fill="var(--dl-up)">
                        Robot state
                    </text>
                    <text className={styles.laneBytes} x={lane.x + laneLen} y={lane.y - 16} textAnchor="end">
                        2373 B · UDP
                    </text>
                    <text className={styles.laneLabel} x={lane.x} y={lane.y + LANE_GAP + 24} fill="var(--dl-dn)">
                        Desired motion
                    </text>
                    <text className={styles.laneBytes} x={lane.x + laneLen} y={lane.y + LANE_GAP + 24} textAnchor="end">
                        371 B · UDP
                    </text>
                </>
            )}

            {/* ---- machines, drawn last so the halos sit on top of the lanes ---- */}
            <Chassis
                x={layout.box.x}
                y={layout.box.y}
                line1="FRANKA"
                line2="CONTROL BOX"
                sub="FCI · UDP · 1 kHz"
                caption="Franka Research 3"
                captionAbove={vertical}
                accent="var(--dl-up)"
                glowRef={refs.glowL}
            />
            <Chassis
                x={layout.nuc.x}
                y={layout.nuc.y}
                line1="INTEL"
                line2="NUC"
                sub="libfranka client"
                caption="Polymetis · PREEMPT_RT kernel"
                accent="var(--dl-dn)"
                glowRef={refs.glowR}
            />
        </svg>
    )
}

/* ---------- the figure ---------- */

export default function ControlLoop() {
    const [realtime, setRealtime] = useState(false)
    const realtimeRef = useRef(realtime)
    realtimeRef.current = realtime

    /* Both layouts are in the page and CSS shows one of them, so the phone
       layout is right from the first paint. The loop below drives both. */
    const wide = useStageRefs()
    const narrow = useStageRefs()
    const cyclesOut = useRef<HTMLDivElement>(null)

    const hostRef = useRef<HTMLDivElement>(null)
    const resetRef = useRef(false)

    useEffect(() => {
        const reduce =
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches

        /* One clock for both modes: simMs counts simulated milliseconds, and
           one cycle is exactly 1.000 ms. Realtime advances it at wall speed,
           slow motion at 1/SLOWDOWN of it. */
        let simMs = reduce ? 0.21 : 0
        let last = 0
        let raf = 0
        let visible = true
        const stages = [
            { refs: wide, laneLen: WIDE.laneLen },
            { refs: narrow, laneLen: NARROW.laneLen },
        ]

        const place = (
            g: SVGGElement | null,
            xLeft: number,
            laneY: number,
            show: boolean,
        ) => {
            if (!g) return
            g.setAttribute('transform', `translate(${xLeft.toFixed(2)},${laneY})`)
            g.setAttribute('opacity', show ? '1' : '0')
        }

        const frame = (now: number) => {
            raf = requestAnimationFrame(frame)
            if (!last) last = now
            let dt = now - last
            last = now
            if (!visible) return
            if (dt > 100) dt = 100 // swallow tab-switch jumps
            if (reduce) dt = 0

            const rt = realtimeRef.current
            if (resetRef.current) {
                resetRef.current = false
                simMs = reduce ? 0.21 : 0
            }
            simMs += rt ? dt : dt / SLOWDOWN

            const cycles = Math.floor(simMs)
            const phase = simMs - cycles

            for (const { refs, laneLen } of stages) {
                const { pktUp, pktDn, streamUp, streamDn, glowL, glowR } = refs
                if (rt) {
                    place(pktUp.current, 0, 0, false)
                    place(pktDn.current, 0, LANE_GAP, false)
                    if (streamUp.current) streamUp.current.setAttribute('opacity', '1')
                    if (streamDn.current) streamDn.current.setAttribute('opacity', '1')
                    if (glowL.current) glowL.current.setAttribute('opacity', '0.5')
                    if (glowR.current) glowR.current.setAttribute('opacity', '0.5')
                } else {
                    if (streamUp.current) streamUp.current.setAttribute('opacity', '0')
                    if (streamDn.current) streamDn.current.setAttribute('opacity', '0')

                    if (phase < P_UP_END) {
                        const p = phase / P_UP_END
                        place(pktUp.current, p * (laneLen - PKT_UP_W), 0, true)
                        place(pktDn.current, 0, LANE_GAP, false)
                    } else if (phase < P_COMPUTE_END) {
                        place(pktUp.current, 0, 0, false)
                        place(pktDn.current, 0, LANE_GAP, false)
                    } else if (phase < P_DN_END) {
                        const p = (phase - P_COMPUTE_END) / (P_DN_END - P_COMPUTE_END)
                        place(pktUp.current, 0, 0, false)
                        place(pktDn.current, laneLen - PKT_DN_W - p * (laneLen - PKT_DN_W), LANE_GAP, true)
                    } else {
                        place(pktUp.current, 0, 0, false)
                        place(pktDn.current, 0, LANE_GAP, false)
                    }

                    const computing = phase >= P_UP_END && phase < P_COMPUTE_END
                    const applying = phase >= P_DN_END
                    if (glowR.current) glowR.current.setAttribute('opacity', computing ? '0.85' : '0.18')
                    if (glowL.current) glowL.current.setAttribute('opacity', applying ? '0.85' : '0.18')
                }
            }

            if (cyclesOut.current) {
                cyclesOut.current.textContent = cycles.toLocaleString()
            }
        }

        raf = requestAnimationFrame(frame)

        let io: IntersectionObserver | null = null
        if (hostRef.current && typeof IntersectionObserver !== 'undefined') {
            io = new IntersectionObserver(
                (entries) => {
                    visible = entries[0].isIntersecting
                    last = 0
                },
                { threshold: 0.05 },
            )
            io.observe(hostRef.current)
        }

        return () => {
            cancelAnimationFrame(raf)
            if (io) io.disconnect()
        }
    }, [])

    return (
        <div className={`${styles.fig} ${styles.figDiagram}`} ref={hostRef}>
            <div className={styles.controls}>
                <div className={styles.switch} role="group" aria-label="Playback speed">
                    <button
                        className={`${styles.switchOpt} ${!realtime ? styles.active : ''}`}
                        onClick={() => {
                            resetRef.current = true
                            setRealtime(false)
                        }}
                        aria-pressed={!realtime}
                    >
                        Slow motion
                    </button>
                    <button
                        className={`${styles.switchOpt} ${realtime ? styles.active : ''}`}
                        onClick={() => {
                            resetRef.current = true
                            setRealtime(true)
                        }}
                        aria-pressed={realtime}
                    >
                        Realtime
                    </button>
                </div>

                <div className={styles.cycles}>
                    <div className={styles.cyclesLabel}>Cycles elapsed</div>
                    <div className={styles.cyclesValue} ref={cyclesOut}>
                        0
                    </div>
                </div>
            </div>

            <Stage layout={WIDE} refs={wide} />
            <Stage layout={NARROW} refs={narrow} />
        </div>
    )
}
