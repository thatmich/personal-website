'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { createArmAnimation } from './armAnimation'
import styles from './droid.module.css'

export default function ArmStackClient({ svg, meta }: { svg: string; meta: object }) {
    const ref = useRef<HTMLElement>(null)

    useEffect(() => {
        const el = ref.current?.querySelector('svg')
        if (!el) return
        const anim = createArmAnimation(gsap, el, meta, {
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        })
        return () => anim.destroy()
    }, [meta])

    return (
        <figure
            ref={ref}
            className={styles.armFig}
            role="img"
            aria-label="Animation: a Franka robot arm with a Robotiq gripper lifts a small PC, stacks it on a tower PC, and the two merge into a single tower."
            dangerouslySetInnerHTML={{ __html: svg }}
        />
    )
}
