import styles from './kvcache.module.css'

export interface Reference {
    authors: string
    title: string
    venue?: string
    url?: string
}

/** Inline citation marker, e.g. <Cite n={1} /> → a superscript [1] that jumps
    to the matching entry in the References list. */
export function Cite({ n }: { n: number }) {
    return (
        <sup className={styles.cite}>
            <a href={`#ref-${n}`} style={{ textDecoration: 'none' }}>
                [{n}]
            </a>
        </sup>
    )
}

export default function References({ items }: { items: Reference[] }) {
    return (
        <section className={styles.refs}>
            <h2 id="references">References</h2>
            <ol className={styles.refList}>
                {items.map((r, i) => (
                    <li key={i} id={`ref-${i + 1}`} className={styles.refItem}>
                        {r.authors}. <span className={styles.refTitle}>{r.title}.</span>
                        {r.venue ? ` ${r.venue}.` : ''}
                        {r.url && (
                            <>
                                {' '}
                                <a href={r.url} target="_blank" rel="noopener noreferrer">
                                    {r.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                </a>
                            </>
                        )}
                    </li>
                ))}
            </ol>
        </section>
    )
}
