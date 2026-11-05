import { getSettings } from '../../config/settings.js';
import { SERVER_VERSION } from '../../config/version.js';
import { escapeHtml } from './html.js';
/**
 * The chrome shared by every HTML page: the sticky header with the logo from
 * `assets/logo.png` and the footer strip. Both pages append `LAYOUT_CSS`
 * directly after their own styles, so these rules win on equal specificity.
 */
export const LAYOUT_CSS = `
.mono{font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace}
.page-wide{width:100%;max-width:1400px;margin:0 auto;padding:0 28px}
.site-header{position:sticky;top:0;z-index:20;border-bottom:1px solid var(--border);background:rgba(255,255,255,.8);backdrop-filter:blur(8px)}
.header-inner{display:flex;align-items:center;justify-content:space-between;height:52px}
.brand{display:flex;align-items:center;gap:12px;min-width:0}
.brand-logo{width:40px;height:auto}
.brand-name{font-size:15px;font-weight:600;color:var(--text-black);white-space:nowrap}
.brand-tag{font-size:13px;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.divider{width:1px;height:16px;background:var(--border)}
.brand-version{font-size:12px;color:var(--text-secondary);white-space:nowrap}
.header-link{font-size:13px;color:var(--text-secondary);white-space:nowrap}
.header-link:hover{color:var(--blue);text-decoration:none}
.site-footer{margin-top:72px;border-top:1px solid var(--border);position:fixed;bottom:0;width:100%;background:white}
.footer-inner{display:flex;flex-wrap:wrap;gap:8px 24px;align-items:center;justify-content:space-between;padding-top:24px;padding-bottom:32px;font-size:12px;color:var(--text-secondary)}
.footer-side{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.footer-side a{color:inherit}
.footer-side a:hover{color:var(--blue);text-decoration:none}
.footer-sep{color:var(--border)}
@media (max-width:640px){.brand-tag,.divider,.header-link{display:none}}`;
/** The standard header: brand block on the left, page-specific slot on the right. */
export function siteHeader(container, right) {
    const { brand, tagline } = getSettings();
    return `<header class="site-header">
  <div class="${container} header-inner">
    <div class="brand">
      <img class="brand-logo" src="/logo.png" alt="">
      <span class="brand-name">${escapeHtml(brand)}</span>
      ${tagline === '' ? '' : `<span class="brand-tag">— ${escapeHtml(tagline)}</span>`}
      <span class="divider"></span>
      <span class="brand-version mono">v${escapeHtml(SERVER_VERSION)}</span>
    </div>
    ${right}
  </div>
</header>`;
}
/** The standard footer: brand, tagline, year, version and the metrics link. */
export function siteFooter(container) {
    const { brand, tagline } = getSettings();
    const year = new Date().getFullYear();
    return `<footer class="site-footer">
  <div class="${container} footer-inner">
    <div class="footer-side">${escapeHtml(brand)}${tagline === '' ? '' : ` · ${escapeHtml(tagline)}`} · ${year}</div>
    <div class="footer-side mono">
      <span>v${escapeHtml(SERVER_VERSION)}</span>
      <span class="footer-sep">·</span>
      <a href="/metrics">/metrics</a>
    </div>
  </div>
</footer>`;
}
//# sourceMappingURL=layout.js.map