import type { ReactNode } from 'react';

/**
 * Minimal, dependency-free markdown → React for the blog body. Handles the
 * subset the posts use: ## / ### headings, paragraphs, - lists, > blockquotes,
 * **bold**, *italic*, and [text](url) links. Text is rendered as React nodes
 * (auto-escaped), so no dangerouslySetInnerHTML and no sanitizer needed.
 */

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
        <a key={`${key}-${i}`} href={m[3]} target="_blank" rel="noopener noreferrer">
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
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(## |### |> |- )/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(<p key={k}>{inline(para.join(' '), `p${k}`)}</p>);
    k++;
  }
  return <>{blocks}</>;
}
