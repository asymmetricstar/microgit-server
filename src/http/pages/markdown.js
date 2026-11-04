import { escapeHtml } from './html.js';
/**
 * A small, dependency free markdown renderer for README files.
 *
 * Everything is escaped first and only then turned into markup, so a repository
 * cannot inject HTML into the page: unsupported syntax stays visible as text
 * instead of being passed through. Supported: headings, paragraphs, fenced and
 * indented code blocks, bullet and ordered lists (with task list items), block
 * quotes (with GitHub-style callouts), horizontal rules, tables, inline code,
 * bold, italics, strikethrough, links and images.
 */
/** Links that may be emitted as clickable; anything else is shown as text. */
const SAFE_LINK = /^(https?:\/\/|mailto:|#|\/)/i;
/** Placeholder wrapper for inline code, replaced at the end of the line. */
const CODE_TOKEN = '\u0000';
function link(href, label) {
    if (!SAFE_LINK.test(href))
        return label;
    const external = /^https?:\/\//i.test(href);
    const rel = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${escapeHtml(href)}"${rel}>${label}</a>`;
}
/** Resolve a (possibly relative) image source against the repository context. */
function resolveImageSrc(src, ctx) {
    if (/^(https?:|data:|\/|#)/i.test(src))
        return src;
    const dir = ctx?.dir ?? '';
    const parts = [...(dir ? dir.split('/') : []), ...src.split('/')];
    const resolved = [];
    for (const part of parts) {
        if (part === '' || part === '.')
            continue;
        if (part === '..') {
            resolved.pop();
            continue;
        }
        resolved.push(part);
    }
    if (resolved.length === 0)
        return src;
    if (ctx?.owner && ctx?.name) {
        return `/${encodeURIComponent(ctx.owner)}/${encodeURIComponent(ctx.name)}/blob/${resolved.map(encodeURIComponent).join('/')}?raw=1`;
    }
    return resolved.join('/');
}
/** Inline syntax: code spans, images, links, bold, italics and strikethrough. */
function inline(text, ctx) {
    const codes = [];
    let out = escapeHtml(text).replace(/`([^`]+)`/g, (_match, code) => {
        codes.push(`<code class="inline">${code}</code>`);
        return `${CODE_TOKEN}${codes.length - 1}${CODE_TOKEN}`;
    });
    // Images: ![alt](src "title") — must run before the link rule.
    out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;([^&]*)&quot;)?\)/g, (_match, alt, src, title) => {
        const resolved = resolveImageSrc(src, ctx);
        const safeAlt = alt;
        const safeTitle = title ? ` title="${escapeHtml(title)}"` : '';
        return `<img class="readme-img" src="${escapeHtml(resolved)}" alt="${safeAlt}"${safeTitle} loading="lazy">`;
    });
    out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_match, label, href) => link(href, label));
    out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    out = out.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    out = out.replace(/(^|[\s(])_([^_\n]+)_/g, '$1<em>$2</em>');
    return out.replace(new RegExp(`${CODE_TOKEN}(\\d+)${CODE_TOKEN}`, 'g'), (_match, index) => codes[Number.parseInt(index, 10)] ?? '');
}
function isRule(line) {
    return /^ {0,3}([-*_])( *\1){2,} *$/.test(line);
}
function splitCells(row) {
    let value = row.trim();
    if (value.startsWith('|'))
        value = value.slice(1);
    if (value.endsWith('|'))
        value = value.slice(0, -1);
    return value.split('|').map((cell) => cell.trim());
}
function isTableSeparator(line) {
    const trimmed = line.trim();
    if (!trimmed.includes('-'))
        return false;
    return /^\|?[\s:|-]+$/.test(trimmed);
}
function tableAlign(separator) {
    const trimmed = separator.trim().replace(/^\|/, '').replace(/\|$/, '');
    const cells = trimmed.split('|').map((cell) => cell.trim());
    return cells
        .map((cell) => {
        const left = cell.startsWith(':');
        const right = cell.endsWith(':');
        if (left && right)
            return 'center';
        if (right)
            return 'right';
        if (left)
            return 'left';
        return '';
    })
        .join(',');
}
export function renderMarkdown(source, ctx) {
    const lines = source.replace(/\r\n?/g, '\n').split('\n');
    const html = [];
    let index = 0;
    const flushParagraph = (buffer) => {
        if (buffer.length === 0)
            return;
        html.push(`<p>${buffer.map((line) => inline(line, ctx)).join('\n')}</p>`);
        buffer.length = 0;
    };
    const paragraph = [];
    while (index < lines.length) {
        const line = lines[index];
        // Fenced code block.
        const fence = /^ {0,3}(```|~~~)\s*([\w+-]*)\s*$/.exec(line);
        if (fence) {
            flushParagraph(paragraph);
            const close = fence[1];
            const body = [];
            index += 1;
            while (index < lines.length && !lines[index].trimStart().startsWith(close)) {
                body.push(lines[index]);
                index += 1;
            }
            index += 1; // the closing fence
            const language = fence[2] ? ` class="language-${escapeHtml(fence[2])}"` : '';
            html.push(`<pre><code${language}>${escapeHtml(body.join('\n'))}</code></pre>`);
            continue;
        }
        if (line.trim() === '') {
            flushParagraph(paragraph);
            index += 1;
            continue;
        }
        const heading = /^ {0,3}(#{1,6})\s+(.*?)\s*#*$/.exec(line);
        if (heading) {
            flushParagraph(paragraph);
            const level = heading[1].length;
            html.push(`<h${level}>${inline(heading[2], ctx)}</h${level}>`);
            index += 1;
            continue;
        }
        if (isRule(line)) {
            flushParagraph(paragraph);
            html.push('<hr>');
            index += 1;
            continue;
        }
        // Table (GitHub-flavored).
        if (index + 1 < lines.length &&
            line.trim().includes('|') &&
            isTableSeparator(lines[index + 1])) {
            flushParagraph(paragraph);
            const headerCells = splitCells(line);
            const aligns = tableAlign(lines[index + 1]).split(',');
            index += 2;
            const rows = [];
            while (index < lines.length && lines[index].trim() !== '' && lines[index].trim().includes('|')) {
                rows.push(lines[index]);
                index += 1;
            }
            const head = headerCells
                .map((cell, i) => {
                const align = aligns[i] ? ` style="text-align:${aligns[i]}"` : '';
                return `<th${align}>${inline(cell, ctx)}</th>`;
            })
                .join('');
            const body = rows
                .map((row) => {
                const cells = splitCells(row);
                return `<tr>${cells
                    .map((cell, i) => {
                    const align = aligns[i] ? ` style="text-align:${aligns[i]}"` : '';
                    return `<td${align}>${inline(cell, ctx)}</td>`;
                })
                    .join('')}</tr>`;
            })
                .join('');
            html.push(`<table class="readme-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`);
            continue;
        }
        if (/^ {0,3}>/.test(line)) {
            flushParagraph(paragraph);
            const quoted = [];
            while (index < lines.length && /^ {0,3}>/.test(lines[index])) {
                quoted.push(lines[index].replace(/^ {0,3}> ?/, ''));
                index += 1;
            }
            const callout = /^ {0,3}\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i.exec(quoted[0] ?? '');
            if (callout) {
                const kind = callout[1].toLowerCase();
                quoted[0] = quoted[0].replace(/^ {0,3}\[![A-Z]+\]\s*/i, '');
                html.push(`<blockquote class="callout callout-${kind}"><div class="callout-title">${callout[1]}</div>${renderMarkdown(quoted.join('\n'), ctx)}</blockquote>`);
            }
            else {
                html.push(`<blockquote>${renderMarkdown(quoted.join('\n'), ctx)}</blockquote>`);
            }
            continue;
        }
        // Lists: consecutive items of the same kind become one list.
        const bullet = /^ {0,3}[-*+]\s+(.*)$/.exec(line);
        const ordered = /^ {0,3}\d+[.)]\s+(.*)$/.exec(line);
        if (bullet || ordered) {
            flushParagraph(paragraph);
            const tag = bullet ? 'ul' : 'ol';
            const items = [];
            while (index < lines.length) {
                const nextBullet = /^ {0,3}[-*+]\s+(.*)$/.exec(lines[index]);
                const nextOrdered = /^ {0,3}\d+[.)]\s+(.*)$/.exec(lines[index]);
                const match = bullet ? nextBullet : nextOrdered;
                if (!match)
                    break;
                const task = /^\[([ xX])\]\s+(.*)$/.exec(match[1]);
                if (task) {
                    const checked = task[1].toLowerCase() === 'x';
                    items.push(`<li class="task-list-item"><input type="checkbox" disabled${checked ? ' checked' : ''}> ${inline(task[2], ctx)}</li>`);
                }
                else {
                    items.push(`<li>${inline(match[1], ctx)}</li>`);
                }
                index += 1;
            }
            html.push(`<${tag} class="readme-list">${items.join('')}</${tag}>`);
            continue;
        }
        // Four-space indented code block.
        if (/^ {4}/.test(line)) {
            flushParagraph(paragraph);
            const body = [];
            while (index < lines.length && (/^ {4}/.test(lines[index]) || lines[index].trim() === '')) {
                body.push(lines[index].replace(/^ {4}/, ''));
                index += 1;
            }
            html.push(`<pre><code>${escapeHtml(body.join('\n').replace(/\n+$/, ''))}</code></pre>`);
            continue;
        }
        paragraph.push(line);
        index += 1;
    }
    flushParagraph(paragraph);
    return html.join('\n');
}
//# sourceMappingURL=markdown.js.map