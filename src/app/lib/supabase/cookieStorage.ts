const COOKIE_DOMAIN = '.citybucketlist.com';
const MAX_CHUNK = 3200;
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

const isSecure = (): boolean =>
  typeof location !== 'undefined' && location.protocol === 'https:';

const writeCookie = (name: string, value: string, maxAge = MAX_AGE): void => {
  const secure = isSecure() ? '; Secure' : '';
  document.cookie =
    `${name}=${value}; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
};

const clearCookie = (name: string): void => {
  const secure = isSecure() ? '; Secure' : '';
  document.cookie = `${name}=; Domain=${COOKIE_DOMAIN}; Path=/; Max-Age=0; SameSite=Lax${secure}`;
};

const readAll = (): Record<string, string> => {
  if (typeof document === 'undefined' || !document.cookie) return {};
  return document.cookie.split('; ').reduce((acc, pair) => {
    const eq = pair.indexOf('=');
    if (eq > -1) acc[pair.slice(0, eq)] = pair.slice(eq + 1);
    return acc;
  }, {} as Record<string, string>);
};

const removeItem = (key: string): void => {
  const all = readAll();
  const meta = all[key];
  if (meta && meta.startsWith('chunks:')) {
    const n = parseInt(meta.slice(7), 10) || 0;
    for (let i = 0; i < n; i++) clearCookie(`${key}.${i}`);
  }
  Object.keys(all).forEach((k) => {
    if (k === key || k.startsWith(`${key}.`)) clearCookie(k);
  });
};

export const cookieStorage = {
  getItem(key: string): string | null {
    const all = readAll();
    const meta = all[key];
    if (meta === undefined) return null;
    if (meta.startsWith('chunks:')) {
      const n = parseInt(meta.slice(7), 10) || 0;
      let joined = '';
      for (let i = 0; i < n; i++) {
        const part = all[`${key}.${i}`];
        if (part === undefined) return null;
        joined += part;
      }
      try { return decodeURIComponent(joined); } catch { return null; }
    }
    try { return decodeURIComponent(meta); } catch { return meta; }
  },
  setItem(key: string, value: string): void {
    removeItem(key);
    const encoded = encodeURIComponent(value);
    if (encoded.length <= MAX_CHUNK) { writeCookie(key, encoded); return; }
    const n = Math.ceil(encoded.length / MAX_CHUNK);
    writeCookie(key, `chunks:${n}`);
    for (let i = 0; i < n; i++) {
      writeCookie(`${key}.${i}`, encoded.slice(i * MAX_CHUNK, (i + 1) * MAX_CHUNK));
    }
  },
  removeItem,
};
