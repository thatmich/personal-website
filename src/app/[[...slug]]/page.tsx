import { ClientOnly } from './client'

export function generateStaticParams() {
    return [{ slug: [''] }, { slug: ['blog'] }]
  }
   
  export default function Page() {
    return <ClientOnly />
  }