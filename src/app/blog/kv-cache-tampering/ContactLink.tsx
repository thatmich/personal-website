'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './kvcache.module.css'

const EMAIL = 'thatmichio@gmail.com'

/** Inline mailto link with a hover-revealed copy button; shows "Copied" for 5s. */
export default function ContactLink() {
    const [copied, setCopied] = useState(false)
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    useEffect(() => () => clearTimeout(timer.current), [])

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(EMAIL)
        } catch {
            // Clipboard API needs a secure context; fall back for plain HTTP.
            const el = document.createElement('textarea')
            el.value = EMAIL
            el.style.position = 'fixed'
            el.style.opacity = '0'
            document.body.appendChild(el)
            el.select()
            document.execCommand('copy')
            document.body.removeChild(el)
        }
        setCopied(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), 5000)
    }

    return (
        <span className={styles.contact}>
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <button
                className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
                onClick={copy}
            >
                {copied ? 'Copied' : 'Copy'}
            </button>
        </span>
    )
}
