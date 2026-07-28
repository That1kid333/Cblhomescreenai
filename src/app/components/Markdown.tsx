import type { ReactNode } from 'react';

/**
 * Minimal, dependency-free markdown → React for the blog body. Handles the
 * subset the posts use: ## / ### headings, paragraphs, - lists, > blockquotes,
 * **bold**, *italic*, and [text](url) links. Text is rendered as React nodes
 * (auto-escaped), so no dangerouslySetInnerHTML and no sanitizer needed.
 */

// Affiliate hosts get rel="sponsored nofollow" (FTC + SEO compliance); everyone
// else keeps the safe default. Matches the exact host or a subdomain of it.
const AFFILIATE_HOST = /(^|\.)(tp\.media|awin1\.com)$/i;
function relFor(href: string): string {
  try {
    return AFFILIATE_HOST.test(new URL(href).hostname)
      ? 'sponsored nofollow noopener noreferrer'
      : 'noopener noreferrer';
  } catch {
    return 'noopener noreferrer';
  }
}

function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\[([^\]]+)\]\(([^)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)/;
  let rest = text;
  let i = 0;
  while (rest.length) {
    const m = re.exec(rest);
    if (!m) {
      out.push(rest);
      break;
    }
    if (m.index > 0) out.push(rest.slice(0, m.index));
    if (m[1]) {
      out.push(
        <a key={`${key}-${i}`} href={m[3]} target="_blank" rel={relFor(m[3])}>
          {m[2]}
        </a>,
      );
    } else if (m[4]) {
      out.push(<strong key={`${key}-${i}`}>{m[5]}</strong>);
    } else if (m[6]) {
      out.push(<em key={`${key}-${i}`}>{m[7]}</em>);
    }
    rest = rest.slice(m.index + m[0].length);
    i++;
  }
  return out;
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push(<h2 key={k}>{inline(line.slice(3), `h${k}`)}</h2>);
      i++;
      k++;
      continue;
    }
    if (line.startsWith('### ')) {
      blocks.push(<h3 key={k}>{inline(line.slice(4), `h${k}`)}</h3>);
      i++;
      k++;
      continue;
    }
    if (line.startsWith('> ')) {
      const q: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        q.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        <blockquote key={k}>
          {q.map((qq, qi) => (
            <p key={qi}>{inline(qq, `q${k}-${qi}`)}</p>
          ))}
        </blockquote>,
      );
      k++;
      continue;
    }
    // Standalone image on its own line: ![caption](url) or ![caption](url "class")
    const img = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/.exec(line);
    if (img) {
      const [, alt, url, cls] = img;
      blocks.push(
        <figure key={k} className={`mdfig${cls ? ` ${cls}` : ''}`}>
          <img src={url} alt={alt.replace(/[*_]/g, '')} loading="lazy" />
          {alt.trim() && <figcaption>{inline(alt, `f${k}`)}</figcaption>}
        </figure>,
      );
      i++;
      k++;
      continue;
    }
    if (line.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length && lines[i].startsWith('- ')) {
        items.push(lines[i].slice(2));
        i++;
      }
      blocks.push(
        <ul key={k}>
          {items.map((it, ii) => (
            <li key={ii}>{inline(it, `l${k}-${ii}`)}</li>
          ))}
        </ul>,
      );
      k++;
      continue;
    }
    // Ordered list: consecutive lines beginning "1. ", "2. ", …
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      blocks.push(
        <ol key={k}>
          {items.map((it, ii) => (
            <li key={ii}>{inline(it, `o${k}-${ii}`)}</li>
          ))}
        </ol>,
      );
      k++;
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(## |### |> |- |\d+\.\s)/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(<p key={k}>{inline(para.join(' '), `p${k}`)}</p>);
    k++;
  }
  return <>{blocks}</>;
}
