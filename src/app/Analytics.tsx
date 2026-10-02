'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

declare global {
    interface Window {
        goatcounter?: { count?: (vars?: { path?: string }) => void }
    }
}

/* GoatCounter page views. The script counts the first page load itself; moving
   between pages inside the site does not reload it, so those are counted here. */
export default function Analytics() {
    const pathname = usePathname()
    const first = useRef(true)

    useEffect(() => {
        if (first.current) {
            first.current = false
            return
        }
        window.goatcounter?.count?.({ path: pathname })
    }, [pathname])

    return (
        <Script
            data-goatcounter="https://michiosun.goatcounter.com/count"
            src="https://gc.zgo.at/count.js"
            strategy="afterInteractive"
        />
    )
}
