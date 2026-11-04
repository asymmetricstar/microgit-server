import { getSettings } from '../../config/settings.js';
import { SERVER_VERSION } from '../../config/version.js';
import { escapeHtml } from './html.js';
import { LAYOUT_CSS, siteFooter, siteHeader } from './layout.js';
const STYLE = `:root{color-scheme:light;--bg:#ffffff;--bg-subtle:#f6f8fa;--border:#d0d7de;--text:#24292f;--text-secondary:#656d76;--text-black:#1f2328;--blue:#0969da;--blue-light:#ebf2ff}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:15px;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
a:hover{color:var(--blue)}
.wrap{width:100%;max-width:900px;margin:0 auto;padding:0 24px}
.hero{display:flex;flex-direction:column;align-items:center;padding-top:80px;padding-bottom:16px;text-align:center}
.hero-mark{position:relative;display:flex;align-items:center;justify-content:center;width:88px;height:88px;color:var(--blue)}
.hero-mark::before{content:"";position:absolute;inset:-24px;border-radius:50%;background:radial-gradient(circle,var(--blue-light) 0%,rgba(235,242,255,0) 70%)}
.hero-mark img{position:relative;width:62px;height:auto}
.hero h1{margin:16px 0 0;font-size:clamp(28px,5vw,40px);line-height:1.15;letter-spacing:-.04em;font-weight:600;color:var(--text-black)}
.hero h1 span{font-weight:400;color:var(--text-secondary)}
.card-section{margin-top:32px}
.card{border:1px solid var(--border);border-radius:10px;background:#fff;overflow:hidden}
.card-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:9px 16px;background:var(--bg-subtle);border-bottom:1px solid var(--border);font-size:14px}
.crumbs{display:flex;align-items:center;gap:6px;min-width:0;overflow:hidden;white-space:nowrap;color:var(--text-secondary)}
.crumbs .crumb-strong{font-weight:500;color:var(--text-black)}
.crumb-sep{color:var(--border)}
.pill{flex:none;padding:1px 8px;border:1px solid var(--border);border-radius:999px;background:#fff;font-size:11px;color:var(--text-secondary)}
.card-branch{display:flex;align-items:center;gap:8px;padding:8px 16px;border-bottom:1px solid var(--border);font-size:12px;color:var(--text-secondary)}
.branch{color:var(--text-black)}
.branch-dot{color:var(--border)}
.card-body{padding:24px}
.readme{font-size:13px;line-height:1.75;color:var(--text)}
.readme p{margin:0 0 10px}
.readme .readme-h1{margin:0 0 10px;font-weight:600;color:var(--text-black)}
.readme .readme-h2{margin:22px 0 8px;font-weight:600;color:var(--text-black)}
.readme code.inline{padding:1px 5px;border:1px solid var(--border);border-radius:5px;background:var(--bg-subtle);font-family:"JetBrains Mono",ui-monospace,monospace;font-size:12px;color:var(--text-black)}
.cmd{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid var(--border);border-left:3px solid var(--blue);border-radius:8px;background:var(--bg-subtle);box-shadow:0 1px 2px rgba(31,35,40,.04);transition:border-color .15s ease,box-shadow .15s ease}
.cmd:hover{border-color:var(--blue);box-shadow:0 2px 8px rgba(9,105,218,.10)}
.cmd code{flex:1;min-width:0;font-family:"JetBrains Mono",ui-monospace,monospace;font-size:12.5px;line-height:1.7;color:var(--text-black);white-space:pre-wrap;word-break:break-word}
.copy{flex:none;padding:4px 10px;border:1px solid var(--border);border-radius:6px;background:#fff;color:var(--text-secondary);font-family:Inter,sans-serif;font-size:11px;line-height:1.6;cursor:pointer;transition:border-color .15s ease,color .15s ease,background .15s ease}
.copy:hover{border-color:var(--blue);color:#fff;background:var(--blue)}
.cmd + .cmd{margin-top:10px}
.strip{display:flex;flex-wrap:wrap;gap:16px 32px;align-items:center;justify-content:space-between;margin-top:32px;padding:14px 18px;border:1px solid var(--border);border-radius:10px;background:var(--bg-subtle)}
.kv{display:flex;flex-wrap:wrap;gap:14px 28px;margin:0}
.kv-item{display:flex;flex-direction:column;gap:2px}
.kv-label{font-size:10px;letter-spacing:.09em;text-transform:uppercase;color:var(--text-secondary)}
.kv-value{font-size:12px;color:var(--text-black)}
.strip-link{font-size:12px;color:var(--text-secondary)}
@media (max-width:640px){.hero{padding-top:56px}.card-body{padding:18px}}`;
const COPY_SCRIPT = `document.querySelectorAll('.copy').forEach(function (button) {
  button.addEventListener('click', function () {
    var text = button.getAttribute('data-copy') || '';
    var reset = function () {
      button.textContent = 'Copied';
      setTimeout(function () { button.textContent = 'Copy'; }, 1400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(reset, reset);
      return;
    }
    var area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); } catch (error) {}
    document.body.removeChild(area);
    reset();
  });
});`;
/** The landing page for `/`: what the server is, how to clone, how to sign in. */
export function landingPage(base, stats) {
    const { brand, tagline, sessionDays } = getSettings();
    const cloneCommand = `git clone ${base}/<user>/<repo>.git`;
    const cliInstallCommand = `npm i microgit-cli`;
    const cliLoginCommand = `microgit login --url ${base}`;
    const cliNewCommand = `microgit new app --init`;
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="icon" href="/favicon.ico">
<title>${escapeHtml(brand)} — Git Server</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<style>${STYLE}${LAYOUT_CSS}</style>
</head>
<body>
${siteHeader('wrap', '<a class="header-link" href="#quickstart">Quick start</a>')}
<main class="wrap">
  <section class="hero">
    <div class="hero-mark"><img src="/logo.png" alt=""></div>
    <h1>${escapeHtml(brand)}${tagline === '' ? '' : `<span> — ${escapeHtml(tagline)}</span>`}</h1>
  </section>

  <section class="card-section" id="quickstart">
    <div class="card">
      <div class="card-head">
        <div class="crumbs">
          <span class="crumb-sep">/</span>
          <span class="crumb-strong">${escapeHtml(brand)}</span>
          <span class="crumb-sep">/</span>
          <span>README.md</span>
        </div>
        <span class="pill mono">v${escapeHtml(SERVER_VERSION)}</span>
      </div>
      <div class="card-branch mono">
        <span class="branch">main</span>
        <span class="branch-dot">·</span>
        <span>${stats.repositories} ${stats.repositories === 1 ? 'repository' : 'repositories'}</span>
      </div>
      <div class="card-body">
        <div class="readme">
          <p class="readme-h1"># ${escapeHtml(brand)}</p>
          <p>A small Git smart-HTTP server. Every repository belongs to an account, is addressed as
<code class="inline">owner/name.git</code> and is pushed with the account credentials. Sessions are
kept server side and expire after ${sessionDays} ${sessionDays === 1 ? 'day' : 'days'}.</p>
          <p class="readme-h2">## Clone a repository</p>
          <div class="cmd">
            <code>${escapeHtml(cloneCommand)}</code>
            <button class="copy" type="button" data-copy="${escapeHtml(cloneCommand)}">Copy</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="card-section">
    <div class="card">
      <div class="card-head">
        <div class="crumbs">
          <span class="crumb-sep">/</span>
          <span class="crumb-strong">microgit-cli</span>
          <span class="crumb-sep">/</span>
          <span>install</span>
        </div>
        <span class="pill mono">npm</span>
      </div>
      <div class="card-body">
        <div class="readme">
          <p class="readme-h1"># Manage the server with microgit-cli</p>
          <p>The <code class="inline">microgit</code> command is the companion CLI
          for this server: it signs in, creates and deletes repositories, and wraps
          the usual git commands so push and pull work with your account
          credentials. Install it from npm, then sign in and create your first
          repository:</p>
          <div class="cmd">
            <code>${escapeHtml(cliInstallCommand)}</code>
            <button class="copy" type="button" data-copy="${escapeHtml(cliInstallCommand)}">Copy</button>
          </div>
          <div class="cmd">
            <code>${escapeHtml(cliLoginCommand)}</code>
            <button class="copy" type="button" data-copy="${escapeHtml(cliLoginCommand)}">Copy</button>
          </div>
          <div class="cmd">
            <code>${escapeHtml(cliNewCommand)}</code>
            <button class="copy" type="button" data-copy="${escapeHtml(cliNewCommand)}">Copy</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="strip">
    <div class="kv">
      <div class="kv-item"><span class="kv-label">Version</span><span class="kv-value mono">v${escapeHtml(SERVER_VERSION)}</span></div>
      <div class="kv-item"><span class="kv-label">Repositories</span><span class="kv-value mono">${stats.repositories}</span></div>
      <div class="kv-item"><span class="kv-label">Accounts</span><span class="kv-value mono">${stats.users}</span></div>
      <div class="kv-item"><span class="kv-label">Sessions</span><span class="kv-value mono">${stats.sessions}</span></div>
    </div>
    <a class="strip-link mono" href="${escapeHtml(`${base}/health`)}">/health →</a>
  </section>
</main>
${siteFooter('wrap')}
<script>
${COPY_SCRIPT}
</script>
</body>
</html>`;
}
//# sourceMappingURL=landing.js.map