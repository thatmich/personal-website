/* Animation for the SVG written by scripts/franka_to_svg.py.
   Plain JS on purpose: the blog component imports it, and the script inlines it
   into the standalone franka-arm.html. */

/* Seconds per move, in order. Joint angles live in franka-arm.json ("keyframes"), in degrees. */
const MOVES = [
    { to: 'reach', duration: 0.8 },
    { to: 'grip', duration: 0.45, ease: 'power1.inOut' },
    { to: 'gripClosed', duration: 0.25, ease: 'power1.out' }, // gripper closes
    { to: 'raise', duration: 0.4, ease: 'power1.in' },
    { to: 'lift', duration: 0.4, ease: 'none' },
    { to: 'aboveA', duration: 0.8, ease: 'power1.out' },
    { to: 'stack', duration: 0.6, ease: 'bounce.out' }, // set down with a small settle bounce
    { to: 'release', duration: 0.25, ease: 'power1.out' }, // gripper opens
    { to: 'retreat', duration: 0.4 },
    { to: 'neutral', duration: 0.7 },
]
const LEAD_IN = 0.2
const HOLD = 0.7 // pause at each end of the loop

const ARM = ['joint2', 'joint4', 'joint6'] // the joints between the base and the hand
const DRIVES = [...ARM, 'gripper'] // the values a keyframe sets

export function createArmAnimation(gsap, svg, meta, { reducedMotion = false } = {}) {
    const $ = (sel) => svg.querySelector(sel)
    const frames = Object.fromEntries(meta.keyframes.map((k) => [k.name, k]))
    const pick = (pose) => Object.fromEntries(DRIVES.map((d) => [d, pose[d]]))

    /* Every moving link: the arm joints, and the gripper linkage that follows 'gripper'. */
    const rig = Object.values(meta.joints)
        .filter((j) => j.drive)
        .map((j) => ({ ...j, el: $('#' + j.link) }))

    /* Screen rotation of one joint, relative to the neutral pose the SVG was drawn in. */
    const turn = (j, pose) => j.sign * j.multiplier * (pose[j.drive] - frames.neutral[j.drive])

    /* Where the hand group sits for a pose: the nested joint rotations, composed. */
    const handMatrix = (pose) => {
        const m = new DOMMatrix()
        for (const name of ARM) {
            const j = meta.joints[name]
            const [px, py] = j.pivot
            m.translateSelf(px, py).rotateSelf(turn(j, pose)).translateSelf(-px, -py)
        }
        return m
    }
    const css = (m) => `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`

    const scene = $('#scene')
    const hand = $('#hand')
    const pcB = $('#pcB')
    const pcMerged = $('#pcMerged')
    const [stackX, stackY] = meta.scene.stackOffset

    /* B keeps this transform inside the hand group for as long as it is carried. */
    const carried = css(handMatrix(frames.gripClosed).inverse())
    const stacked = `translate(${stackX} ${stackY})`

    const state = pick(frames.neutral)
    let tCarry = 0
    let tPlaced = 0
    let where = 'ground'

    const tl = gsap.timeline({
        paused: true,
        repeat: reducedMotion ? 0 : -1,
        yoyo: true,
        repeatDelay: HOLD,
        defaults: { ease: 'power2.inOut' },
        onUpdate: render,
    })

    function render() {
        for (const j of rig) {
            j.el.setAttribute('transform', `rotate(${turn(j, state)} ${j.pivot[0]} ${j.pivot[1]})`)
        }

        /* Reparent B: on the ground, in the hand while carried, on top of A afterwards. */
        const t = tl.time()
        const next = t < tCarry ? 'ground' : t < tPlaced ? 'hand' : 'stack'
        if (next !== where) {
            where = next
            if (next === 'hand') {
                hand.insertBefore(pcB, hand.firstChild) // under the fingers
                pcB.setAttribute('transform', carried)
            } else {
                scene.insertBefore(pcB, pcMerged)
                if (next === 'stack') pcB.setAttribute('transform', stacked)
                else pcB.removeAttribute('transform')
            }
        }
    }

    /* ---- arm ---- */

    tl.to({}, { duration: LEAD_IN })
    for (const move of MOVES) {
        tl.to(state, { ...pick(frames[move.to]), duration: move.duration, ...(move.ease && { ease: move.ease }) })
        if (move.to === 'gripClosed') tCarry = tl.duration()
        if (move.to === 'stack') tPlaced = tl.duration()
    }

    /* ---- merge: two stacked outlines become one tower ---- */

    const seam = $('#seam')
    const mergedBox = $('#pcMerged rect')
    const mergedDetail = svg.querySelectorAll('#pcMerged > :not(rect):not(.acc)')
    const mergedLed = $('#pcMerged-led')
    const parts = svg.querySelectorAll('#pcA > :not(.acc), #pcB > :not(.acc)')
    const ledA = $('#pcA-led')
    const ledB = $('#pcB-led')
    const ledTarget = { cx: +mergedLed.getAttribute('cx'), cy: +mergedLed.getAttribute('cy') }
    const seamLength = seam.getTotalLength()
    const boxLength = mergedBox.getTotalLength()

    gsap.set(pcMerged, { opacity: 1 })
    gsap.set(mergedBox, { fill: 'none', opacity: 0, strokeDasharray: boxLength, strokeDashoffset: boxLength })
    gsap.set([mergedDetail, mergedLed], { opacity: 0 })
    gsap.set(seam, { opacity: 0, strokeDasharray: seamLength, strokeDashoffset: seamLength })

    const merge = tPlaced + 0.15
    tl.set(seam, { opacity: 1 }, merge)
    tl.to(seam, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.out' }, merge) // orange sweep along the seam
    tl.set(mergedBox, { opacity: 1 }, merge + 0.3)
    tl.to(mergedBox, { strokeDashoffset: 0, duration: 0.8 }, merge + 0.3)
    tl.to(parts, { opacity: 0, duration: 0.6 }, merge + 0.4)
    tl.to(mergedDetail, { opacity: 1, duration: 0.6 }, merge + 0.6)
    tl.to(seam, { opacity: 0, duration: 0.4 }, merge + 0.6)
    tl.to(ledA, { attr: ledTarget, duration: 0.6 }, merge + 0.4)
    tl.to(ledB, { attr: { cx: ledTarget.cx - stackX, cy: ledTarget.cy - stackY }, duration: 0.6 }, merge + 0.4)
    tl.set([ledA, ledB], { opacity: 0 }, merge + 1.0) // the two LEDs are now one
    tl.set(mergedLed, { opacity: 1 }, merge + 1.0)

    render()

    /* ---- playback: autoplay, pause on hover and when off screen ---- */

    let hovered = false
    let visible = true
    const sync = () => (hovered || !visible ? tl.pause() : tl.play())
    const enter = () => { hovered = true; sync() }
    const leave = () => { hovered = false; sync() }
    let observer

    if (reducedMotion) {
        tl.progress(1) // the merged final frame, no motion
        render()
    } else {
        svg.addEventListener('pointerenter', enter)
        svg.addEventListener('pointerleave', leave)
        if ('IntersectionObserver' in window) {
            observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() })
            observer.observe(svg)
        }
        sync()
    }

    return {
        timeline: tl,
        destroy() {
            svg.removeEventListener('pointerenter', enter)
            svg.removeEventListener('pointerleave', leave)
            if (observer) observer.disconnect()
            tl.pause(0)
            render()
            tl.kill()
        },
    }
}
