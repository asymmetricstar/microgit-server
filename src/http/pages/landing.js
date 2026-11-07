import { getSettings } from '../../config/settings.js';
import { SERVER_VERSION } from '../../config/version.js';
import { escapeHtml } from './html.js';
import { pageShell } from './layout.js';
const STYLE = `:root{ --bg:#f6f8fa;--bg-panel:#ffffff;--border:#d0d7de;--text:#24292f;--text-secondary:#57606a;--text-muted:#8c959d;--blue:#0969da;--blue-hover:#0550ae;--blue-bg:#e7f5ff;--green:#1a7f37;--green-bg:#dafbe1;--radius:8px}
*,*::before,*::after{box-sizing:border-box}
body{ margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Inter,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:var(--blue);text-decoration:none}
a:hover{text-decoration:underline}
.wrap{max-width:960px;margin:0 auto;padding:0 20px}
.hero{padding:60px 0 40px;text-align:center}
.hero-mark{display:inline-flex;align-items:center;justify-content:center;width:72px;height:72px;border-radius:16px;color:var(--blue);margin-bottom:24px}
.hero-mark img{width:100px;height:auto;pointer-events:none}
.hero h1{font-size:clamp(28px,5vw,40px);font-weight:600;letter-spacing:-0.02em;color:var(--text-black);margin:0 0 8px}
.hero h1 span{font-weight:500;color:var(--text-secondary)}
.hero p{font-size:16px;color:var(--text-secondary);margin:0;max-width:640px;margin:0 auto}
.section{margin:48px 0}
.section + .section{border-top:1px solid var(--border);padding-top:48px}
.section-title{font-size:18px;font-weight:600;color:var(--text-black);margin:0 0 12px}
.section-desc{font-size:14px;color:var(--text-secondary);margin:0 0 20px}
.command{background:#f6f8fa;border:1px solid var(--border);border-radius:6px;padding:12px 16px;overflow:auto;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:var(--text-black);white-space:pre-wrap;word-break:break-all;line-height:1.5}
.strip{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;padding:20px;background:var(--bg-panel);border:1px solid var(--border);border-radius:var(--radius)}
.kv{display:flex;flex-wrap:wrap;gap:24px;margin:0}
.kv-item{display:flex;flex-direction:column;gap:2px}
.kv-label{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--text-muted)}
.kv-value{font-size:15px;font-weight:600;color:var(--text-black);font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.strip-link{font-size:13px;color:var(--text-secondary)}
@media (max-width:640px){.hero{padding:40px 0 32px}.strip{flex-direction:column;align-items:flex-start}}
.btn-primary{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border:1px solid transparent;border-radius:6px;background:var(--blue);color:#fff;font-size:14px;font-weight:500;cursor:pointer;text-decoration:none;transition:background .15s}
.btn-primary:hover{background:var(--blue-hover)}
.btn-outline{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border:1px solid var(--border);border-radius:6px;background:#fff;color:var(--text);font-size:14px;font-weight:500;cursor:pointer;text-decoration:none;transition:all .15s}
.btn-outline:hover{border-color:var(--blue);color:var(--blue)}
.actions{display:flex;gap:12px;justify-content:center;margin-top:20px}
.steps{margin:0;padding:0;list-style:none}
.steps li{margin-bottom:16px}
.step-title{display:block;font-size:13px;font-weight:600;color:var(--blue);margin-bottom:6px}
.step-code{background:#f6f8fa;border:1px solid var(--border);border-radius:6px;padding:10px 14px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:var(--text-black);white-space:pre-wrap;word-break:break-all;line-height:1.5}
.tok-c{color:var(--green)}
.tok-k{color:var(--blue);font-weight:600}
.tok-f{color:#6f42c1}
.tok-a{color:#d73a49}
.tok-s{color:#032f62;background:rgba(27,31,35,.05);padding:0 2px;border-radius:3px}
.tok-n{color:#005cc5}
.tok-v{color:#24292f}`;
export function landingPage(base, stats) {
    const { brand, tagline, sessionDays } = getSettings();
    const cloneCommand = `git clone ${base}/<user>/<repo>.git`;
    const body = `<main class="lite-container" style="height: calc(100% - 200px);align-content: center;">
  <section class="hero">
    <div class="hero-mark"><img src="/logo.png" alt=""></div>
    <h1>${escapeHtml(brand)}${tagline === '' ? '' : `<span> — ${escapeHtml(tagline)}</span>`}</h1>
    <p>A lightweight Git smart-HTTP server. Each repository belongs to an account, addressed as <code class="inline">owner/name.git</code>, and pushed using account credentials.</p>
  </section>

  <section class="section">
    <h2 class="section-title">Clone a repository</h2>
    <p></p>
    <div class="command">${escapeHtml(cloneCommand)}</div>
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
</main>`;
    return pageShell(`${brand} — Git Server`, body, {
        pageCss: STYLE,
        headerRight: '<a class="header-link" href="/repos">Repos</a><a class="header-link" href="https://github.com/asymmetricstar/microgit-server">Github</a>',
        container: 'page-wide',
    });
}
//# sourceMappingURL=landing.js.map