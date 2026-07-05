import { ArrowLeft, Instagram } from "lucide-react";
import Link from "next/link";

const INSTAGRAM_HANDLE = "lustlashestimisoara";
const INSTAGRAM_URL = `https://instagram.com/${INSTAGRAM_HANDLE}`;

export function LegalLayout({
  children,
  title
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" href="/">
          <img
            alt="LustLashes logo"
            className="brand-logo-small"
            src="/brand-logo.png"
          />
          <span className="brand-name brand-name-text">LustLashes</span>
        </Link>
        <nav className="nav" aria-label="Navigatie principala">
          <Link className="ghost-button" href="/">
            <ArrowLeft size={18} /> Inapoi
          </Link>
        </nav>
      </header>

      <section className="section legal-section">
        <div className="legal-header">
          <h1>{title}</h1>
        </div>
        <article className="legal-content">{children}</article>
      </section>

      <footer className="site-footer">
        <div>
          <strong>LustLashes</strong>
          <span>programari flexibile pentru gene 1D-6D+, intretinere si demontare</span>
          <nav className="footer-legal" aria-label="Informatii legale">
            <Link className="footer-link" href="/politica-cookies">
              Politica cookies
            </Link>
            <Link className="footer-link" href="/termeni-si-conditii">
              Termeni si conditii
            </Link>
          </nav>
        </div>
        <a className="clickable" href={INSTAGRAM_URL}>
          <Instagram size={18} /> @{INSTAGRAM_HANDLE}
        </a>
      </footer>
    </main>
  );
}
