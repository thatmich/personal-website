import Link from 'next/link'
import '../../Navbar/Navbar.css'
import './blog.css'

export default function BlogLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
        <div>
            <header className="header">
                <div className="container">
                    <nav className="nav__container">
                        <Link href="/" className="nav__logo">
                            Michio Sun
                        </Link>
                    </nav>
                </div>
            </header>
            <div className="Blog container">
                {children}
            </div>
        </div>
    )
}
