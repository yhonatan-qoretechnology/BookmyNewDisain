"use client";
/* ============================================================
   Pie de la web pública.
   Igual que el de la web estática, con el acceso al panel
   añadido en la columna de producto.
============================================================ */
import Link from "next/link";
import { ROUTES } from "@/constants";
import { useWebT } from "./useWebT";
import { useCookieBanner } from "./CookieBanner";

export default function WebFooter() {
  const { w } = useWebT();
  const { abrir: abrirCookies } = useCookieBanner();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link href="/" className="logo" aria-label="Bookmy">
            <img src="/web/img/logo.png" alt="Bookmy" className="logo-img logo-img-dark" />
            <img src="/web/img/logo-bookmy2.png" alt="Bookmy" className="logo-img logo-img-light" />
          </Link>
          <p>{w("footer.tagline")}</p>
          <div className="social-row">
            <a href="https://www.facebook.com/appbookmy" target="_blank" rel="noopener" aria-label="Facebook"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden><path d="M14 9h2.5V6H14c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.2l.8-3H14V9.4c0-.2.2-.4.4-.4Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg></a>
            <a href="https://www.instagram.com/appbookmy/" target="_blank" rel="noopener" aria-label="Instagram"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden><rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="1.3" /><circle cx="12" cy="12" r="3.6" stroke="currentColor" strokeWidth="1.3" /><circle cx="17" cy="7" r="0.9" fill="currentColor" /></svg></a>
            <a href="https://wa.me/34651026700" target="_blank" rel="noopener" aria-label="WhatsApp"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden><path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.6-1.2A9 9 0 1 0 12 3Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M8.5 9.7c.4 2.6 2.2 4.4 4.8 4.8.9.1 1.1-.6 1.4-1.1.1-.3 0-.5-.2-.6l-1.5-.7c-.2-.1-.4 0-.5.1l-.4.5c-.8-.4-1.5-1.1-1.9-1.9l.5-.4c.1-.1.2-.3.1-.5l-.7-1.5c-.1-.2-.3-.3-.6-.2-.5.3-1.2.5-1 1.4Z" fill="currentColor" /></svg></a>
          </div>
        </div>

        <div className="footer-col">
          <h4>{w("footer.colProduct")}</h4>
          <Link href="/#app">{w("footer.p1")}</Link>
          <Link href="/#funciona">{w("footer.p2")}</Link>
          <Link href="/bookmy-free">{w("footer.p3")}</Link>
          <Link href="/bookmy-crm-pro">{w("footer.p4")}</Link>
          <Link href={ROUTES.login}>{w("nav.panel")}</Link>
        </div>

        <div className="footer-col">
          <h4>{w("footer.colInfo")}</h4>
          <Link href="/#faq">{w("footer.i1")}</Link>
          <Link href="/#confianza">{w("footer.i2")}</Link>
          <Link href="/privacidad">{w("footer.i3")}</Link>
          <Link href="/cookies">{w("footer.i5")}</Link>
          <button type="button" className="footer-linklike" onClick={abrirCookies}>{w("cookies.s4Btn")}</button>
        </div>

        <div className="footer-col footer-newsletter">
          <h4>{w("footer.colNews")}</h4>
          <p>{w("footer.newsText")}</p>
          <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
            <label className="sr-only" htmlFor="news-email">{w("footer.newsPlaceholder")}</label>
            <input id="news-email" type="email" placeholder={w("footer.newsPlaceholder")} required />
            <button type="submit" className="btn btn-primary btn-small">{w("footer.newsBtn")}</button>
          </form>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>{w("footer.copy")}</span>
      </div>
    </footer>
  );
}
