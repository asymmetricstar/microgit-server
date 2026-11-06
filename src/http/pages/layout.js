import { getSettings } from '../../config/settings.js';
import { SERVER_VERSION } from '../../config/version.js';
import { escapeHtml } from './html.js';
export const LAYOUT_CSS = `
  :root {
    --bg: #FFFFFF;
    --bg-subtle: #F6F8FA;
    --border: #D0D7DE;
    --text: #24292F;
    --text-secondary: #656D76;
    --text-black: #1F2328;
    --blue: #0969DA;
    --blue-light: #EBF2FF;
    --green: #1F883D;
    --red: #CF222E;
  }
  *, ::before, ::after { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    background: var(--bg);
    color: var(--text);
  }
  a { color: inherit; text-decoration: none; }
  a:hover { text-decoration: none; }
  .mono { font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace; }
  .wrap { max-width: 960px; margin: 0 auto; padding: 0 20px; }
  .page-wide, .lite-container { width: 100%; max-width: 1400px; margin: 0 auto; padding: 0 28px; }
  .site-header { position: sticky; top: 0; z-index: 20; border-bottom: 1px solid var(--border); background: rgba(255,255,255,.8); backdrop-filter: blur(8px); }
  .header-inner { display: flex; align-items: center; justify-content: space-between; height: 52px; }
  .brand { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .brand-logo { width: 40px; height: auto; cursor: pointer; }
  .brand-name { font-size: 15px; font-weight: 600; color: var(--text-black); white-space: nowrap; }
  .brand-tag { font-size: 13px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .divider { width: 1px; height: 16px; background: var(--border); }
  .brand-version { font-size: 12px; color: var(--text-secondary); white-space: nowrap; }
  .header-link { font-size: 13px; color: var(--text-secondary); white-space: nowrap; }
  .header-link:hover { color: var(--blue); text-decoration: none; }
  .header-right { display: flex; align-items: center; gap: 16px; }
  .site-footer { margin-top: 72px; border-top: 1px solid var(--border); position: fixed; bottom: 0; width: 100%; background: white; }
  .footer-inner { display: flex; flex-wrap: wrap; gap: 8px 24px; align-items: center; justify-content: space-between; padding-top: 24px; padding-bottom: 32px; font-size: 12px; color: var(--text-secondary); }
  .footer-side { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  .footer-side a { color: inherit; }
  .footer-side a:hover { color: var(--blue); text-decoration: none; }
  .footer-sep { color: var(--border); }
  @media (max-width: 640px) { .brand-tag, .divider, .header-link { display: none; } }
`;
export function siteHeader(container, right) {
    const { brand, tagline } = getSettings();
    return `<header class="site-header">
  <div class="${container} header-inner">
    <div class="brand">
      <img class="brand-logo" src="/logo.png" alt="" style="cursor:pointer" onclick="location.href='/'">
      <a href="/" class="brand-name" style="text-decoration:none">${escapeHtml(brand)}</a>
      ${tagline === '' ? '' : `<span class="brand-tag">— ${escapeHtml(tagline)}</span>`}
      <span class="divider"></span>
      <span class="brand-version mono">v${escapeHtml(SERVER_VERSION)}</span>
    </div>
    <div class="header-right">${right}</div>
  </div>
</header>`;
}
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
export function pageShell(title, body, options = {}) {
    const container = options.container ?? 'page-wide';
    const right = options.headerRight ?? '';
    const css = options.pageCss ? `${LAYOUT_CSS}\n${options.pageCss}` : LAYOUT_CSS;
    const { brand } = getSettings();
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="/favicon.ico">
<title>${escapeHtml(title)} · ${escapeHtml(brand)}</title>
<style>${css}</style>
</head>
<body>
${siteHeader(container, right)}
<div class="${container === 'wrap' ? 'wrap' : 'lite-container'}">
${body}
</div>
${siteFooter(container)}
</body>
</html>`;
}
//# sourceMappingURL=layout.js.map