import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { authClient } from '../lib/supabase/authClient';
import {
  studioIsAdmin,
  getStudioPosts,
  getStudioPost,
  savePost,
  deleteStudioPost,
  getStudioSubmissions,
  setSubmissionStatus,
  deleteSubmission,
  getSubscriberCount,
  type StudioListItem,
  type StudioInput,
  type Submission,
} from '../lib/blog';
import { Markdown } from '../components/Markdown';

/**
 * CBL Studio — the admin authoring editor at /studio. Keith, Brian, and Justin
 * sign in with their CBL admin account and write/publish posts without touching
 * code or the database. It talks to `authClient` DIRECTLY (its own real session),
 * so it is independent of the site-wide preview "demo member" mode — Studio only
 * ever trusts a real signed-in admin, and every write is authorized by the
 * `blog_admin_all` RLS policy server-side. Scoped under `.cbl-studio`.
 */

const DISPLAY = "'myriad-pro','Source Sans 3',sans-serif";
const MONO = "'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,monospace";
const APP_URL = 'https://app.citybucketlist.com';

// Post `vertical` → shown grouped by the brand category it maps to (see
// VERTICAL_CAT in Blog.tsx). Keeps categories consistent with the site/app.
const VERTICALS: { v: string; label: string }[] = [
  { v: 'transpo', label: 'Transportation' },
  { v: 'drivers', label: 'Transportation · Drivers' },
  { v: 'riders', label: 'Transportation · Riders' },
  { v: 'travels', label: 'Travels' },
  { v: 'flights', label: 'Travels · Flight Deals' },
  { v: 'stays', label: 'Travels · Places to Stay' },
  { v: 'eats', label: 'Eats & Drinks' },
  { v: 'attractions', label: 'Attractions' },
  { v: 'entertainment', label: 'Attractions · Entertainment' },
  { v: 'events', label: 'Attractions · Events' },
  { v: 'itinerary', label: 'Attractions · Itinerary (Perfect Saturday)' },
];

const EMPTY: StudioInput = {
  slug: '',
  title: '',
  subtitle: '',
  kicker: '',
  vertical: 'transpo',
  city: '',
  excerpt: '',
  body_md: '',
  hero_image: '',
  author_name: '',
  drivers_take: '',
  drivers_take_name: '',
  riders_take: '',
  riders_take_name: '',
  tags: [],
  featured: false,
  show_trip_planner: false,
  seo_title: '',
  seo_description: '',
  status: 'draft',
};

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function fmt(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '—';
  }
}

const CSS = `
.cbl-studio { background:#0A0A0A; min-height:100vh; color:#EDEDED; font-family:${DISPLAY}; -webkit-font-smoothing:antialiased; }
.cbl-studio *,.cbl-studio *::before,.cbl-studio *::after { box-sizing:border-box; }
.cbl-studio .wrap { max-width:980px; margin:0 auto; padding:30px 22px 90px; }
.cbl-studio a { color:#DDB15F; text-decoration:none; }
.cbl-studio a:hover { text-decoration:underline; }

.cbl-studio .top { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:26px; flex-wrap:wrap; }
.cbl-studio .brandmark { font-family:${MONO}; font-size:11px; letter-spacing:.22em; text-transform:uppercase; color:#C99742; margin-bottom:6px; }
.cbl-studio h1.st-title { font-family:${DISPLAY}; font-weight:900; font-size:30px; letter-spacing:-.01em; color:#fff; line-height:1; }
.cbl-studio .whoami { font-family:${MONO}; font-size:11px; color:#8a8a8a; letter-spacing:.03em; display:flex; align-items:center; gap:12px; }
.cbl-studio .whoami b { color:#C99742; }

.cbl-studio .btn { font-family:${DISPLAY}; font-weight:800; font-size:12.5px; letter-spacing:.08em; text-transform:uppercase; border-radius:999px; padding:11px 20px; border:1px solid transparent; cursor:pointer; transition:.15s; white-space:nowrap; }
.cbl-studio .btn-gold { background:#C99742; color:#000; }
.cbl-studio .btn-gold:hover { background:#DDB15F; }
.cbl-studio .btn-ghost { background:transparent; border-color:rgba(255,255,255,.18); color:#EDEDED; }
.cbl-studio .btn-ghost:hover { border-color:#C99742; color:#fff; }
.cbl-studio .btn-danger { background:transparent; border-color:rgba(255,90,90,.35); color:#ff8a8a; }
.cbl-studio .btn-danger:hover { background:rgba(255,90,90,.12); }
.cbl-studio .btn:disabled { opacity:.5; cursor:not-allowed; }
.cbl-studio .mini { font-size:11px; padding:7px 13px; letter-spacing:.06em; }

.cbl-studio .gate { max-width:430px; margin:7vh auto 0; background:#121212; border:1px solid rgba(255,255,255,.08); border-radius:20px 0 20px 0; padding:34px 30px; }
.cbl-studio .gate h2 { font-family:${DISPLAY}; font-weight:900; font-size:24px; color:#fff; margin:0 0 8px; }
.cbl-studio .gate p { color:#A8A8A8; font-size:14px; line-height:1.55; margin:0 0 20px; }
.cbl-studio .gate .note { font-size:12px; color:#777; margin:16px 0 0; line-height:1.5; }
.cbl-studio .alert { background:rgba(255,90,90,.1); border:1px solid rgba(255,90,90,.35); color:#ffb3b3; font-size:13px; padding:10px 14px; border-radius:8px; margin-bottom:14px; }

.cbl-studio .fldset { background:#111; border:1px solid rgba(255,255,255,.07); border-radius:14px; padding:20px 22px; margin-bottom:16px; }
.cbl-studio .legend { font-family:${MONO}; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:#C99742; margin-bottom:16px; }
.cbl-studio .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
@media (max-width:680px){ .cbl-studio .grid2 { grid-template-columns:1fr; } }
.cbl-studio .fld { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
.cbl-studio .fld:last-child { margin-bottom:0; }
.cbl-studio .fld label { font-family:${MONO}; font-size:11px; letter-spacing:.05em; text-transform:uppercase; color:#9a9a9a; }
.cbl-studio .fld .hint { font-size:11px; color:#6f6f6f; }
.cbl-studio .req-star { color:#C99742; }
.cbl-studio input[type=text],.cbl-studio input[type=email],.cbl-studio input[type=password],.cbl-studio select,.cbl-studio textarea {
  width:100%; background:#0c0c0c; border:1px solid rgba(255,255,255,.12); border-radius:9px; padding:11px 13px;
  color:#fff; font-family:${DISPLAY}; font-size:15px; outline:0; transition:border-color .15s;
}
.cbl-studio textarea { resize:vertical; line-height:1.6; font-size:14.5px; }
.cbl-studio input:focus,.cbl-studio select:focus,.cbl-studio textarea:focus { border-color:#C99742; }
.cbl-studio select option { background:#111; }
.cbl-studio .slugrow { display:flex; align-items:stretch; }
.cbl-studio .slugrow .pfx { font-family:${MONO}; font-size:12.5px; color:#777; background:#0c0c0c; border:1px solid rgba(255,255,255,.12); border-right:0; border-radius:9px 0 0 9px; padding:11px 4px 11px 13px; white-space:nowrap; display:flex; align-items:center; }
.cbl-studio .slugrow input { border-radius:0 9px 9px 0; }
.cbl-studio .check { display:flex; align-items:center; gap:10px; font-size:14px; color:#ddd; cursor:pointer; user-select:none; }
.cbl-studio .check input { width:18px; height:18px; accent-color:#C99742; }
.cbl-studio details.seo { border-top:1px solid rgba(255,255,255,.07); padding-top:14px; }
.cbl-studio details.seo summary { font-family:${MONO}; font-size:11px; letter-spacing:.12em; text-transform:uppercase; color:#9a9a9a; cursor:pointer; }
.cbl-studio details.seo[open] summary { margin-bottom:14px; color:#C99742; }

.cbl-studio .actions { position:sticky; bottom:0; background:linear-gradient(180deg,rgba(10,10,10,0),#0A0A0A 34%); padding:18px 0 8px; display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-top:6px; z-index:5; }
.cbl-studio .badge { font-family:${MONO}; font-size:10px; letter-spacing:.1em; text-transform:uppercase; padding:5px 11px; border-radius:999px; border:1px solid; }
.cbl-studio .badge.draft { color:#c9c9c9; border-color:rgba(255,255,255,.25); }
.cbl-studio .badge.published { color:#4DBF66; border-color:rgba(77,191,102,.5); background:rgba(77,191,102,.1); }
.cbl-studio .msg { font-size:13px; font-family:${MONO}; }
.cbl-studio .msg.ok { color:#4DBF66; } .cbl-studio .msg.err { color:#ff8a8a; }
.cbl-studio .spacer { flex:1; }

.cbl-studio .preview { background:#0c0c0c; border:1px dashed rgba(201,151,66,.4); border-radius:12px; padding:18px 20px; margin-bottom:16px; }
.cbl-studio .preview .pv-h { font-family:${MONO}; font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:#C99742; margin-bottom:12px; }
.cbl-studio .preview img.hero { width:100%; border-radius:10px; margin-bottom:14px; display:block; }
.cbl-studio .preview h3.pv-t { font-family:${DISPLAY}; font-weight:900; font-size:26px; color:#fff; margin:0 0 8px; }
.cbl-studio .preview .pv-dek { color:#C7C7C7; font-style:italic; margin-bottom:14px; }
.cbl-studio .preview .md { color:#dcdcdc; font-size:15px; line-height:1.7; }
.cbl-studio .preview .md h2 { color:#fff; font-size:20px; margin:18px 0 8px; }
.cbl-studio .preview .md h3 { color:#fff; font-size:16px; margin:14px 0 6px; }
.cbl-studio .preview .md p { margin:0 0 12px; }
.cbl-studio .preview .md ul { margin:0 0 12px; padding-left:20px; }
.cbl-studio .preview .md blockquote { border-left:3px solid #C99742; padding-left:14px; color:#f0e6d2; font-style:italic; margin:12px 0; }

.cbl-studio .sectnav { display:flex; align-items:center; gap:6px; margin-bottom:20px; border-bottom:1px solid rgba(255,255,255,.08); }
.cbl-studio .sectbtn { background:transparent; border:0; color:#8a8a8a; font-family:${MONO}; font-size:12px; letter-spacing:.1em; text-transform:uppercase; padding:8px 2px 12px; margin-right:20px; border-bottom:2px solid transparent; margin-bottom:-1px; cursor:pointer; display:inline-flex; align-items:center; gap:8px; }
.cbl-studio .sectbtn:hover { color:#c9c9c9; }
.cbl-studio .sectbtn.on { color:#fff; border-bottom-color:#C99742; }
.cbl-studio .pill-n { background:#C99742; color:#000; border-radius:999px; font-size:10px; font-weight:800; padding:1px 7px; letter-spacing:0; }
.cbl-studio .subcount { font-family:${MONO}; font-size:11px; color:#C99742; letter-spacing:.04em; }
.cbl-studio table { width:100%; border-collapse:collapse; }
.cbl-studio th { text-align:left; font-family:${MONO}; font-size:10px; letter-spacing:.1em; text-transform:uppercase; color:#777; padding:0 12px 10px; border-bottom:1px solid rgba(255,255,255,.08); }
.cbl-studio td { padding:14px 12px; border-bottom:1px solid rgba(255,255,255,.05); font-size:14px; vertical-align:middle; }
.cbl-studio td .pt { font-weight:800; color:#fff; display:block; }
.cbl-studio td .ps { font-family:${MONO}; font-size:11px; color:#888; }
.cbl-studio .rowbtns { display:flex; gap:8px; justify-content:flex-end; }
.cbl-studio .empty { text-align:center; color:#888; padding:56px 20px; font-family:${MONO}; letter-spacing:.04em; }
`;

export function Studio() {
  const [phase, setPhase] = useState<'loading' | 'anon' | 'notadmin' | 'admin'>('loading');
  const [userEmail, setUserEmail] = useState('');

  const check = useCallback(async () => {
    const { data } = await authClient.auth.getSession();
    const s = data.session;
    if (!s) {
      setPhase('anon');
      return;
    }
    setUserEmail(s.user.email ?? '');
    const ok = await studioIsAdmin();
    setPhase(ok ? 'admin' : 'notadmin');
  }, []);

  useEffect(() => {
    check();
    const { data: sub } = authClient.auth.onAuthStateChange(() => check());
    return () => sub.subscription.unsubscribe();
  }, [check]);

  return (
    <main className="cbl-studio">
      <style>{CSS}</style>
      <div className="wrap">
        {phase === 'loading' && <div className="empty">Checking your access…</div>}
        {phase === 'anon' && <SignIn />}
        {phase === 'notadmin' && <NotAdmin email={userEmail} onSignOut={() => authClient.auth.signOut()} />}
        {phase === 'admin' && <Admin email={userEmail} />}
      </div>
    </main>
  );
}

function SignIn() {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { error } = await authClient.auth.signInWithPassword({ email: email.trim(), password: pw });
    setBusy(false);
    if (error) setErr(error.message);
    // On success, onAuthStateChange re-runs the access check automatically.
  }

  return (
    <div className="gate">
      <div className="brandmark">CBL Studio</div>
      <h2>Sign in to write</h2>
      <p>Use your CityBucketList admin account — the same email and password as the app.</p>
      {err && <div className="alert">{err}</div>}
      <form onSubmit={submit}>
        <div className="fld">
          <label htmlFor="st-email">Email</label>
          <input id="st-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="fld">
          <label htmlFor="st-pw">Password</label>
          <input id="st-pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        </div>
        <button className="btn btn-gold" type="submit" disabled={busy} style={{ width: '100%', marginTop: 6 }}>
          {busy ? 'Signing in…' : 'Sign in →'}
        </button>
      </form>
      <p className="note">
        This is separate from the preview “demo member” — Studio always needs a real admin login. Forgot your password?
        Reset it in the <a href={APP_URL}>app</a>.
      </p>
    </div>
  );
}

function NotAdmin({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  return (
    <div className="gate">
      <div className="brandmark">CBL Studio</div>
      <h2>You're signed in — but not as an admin</h2>
      <p>
        <b style={{ color: '#fff' }}>{email}</b> doesn't have blog-author access yet. Ask Justin to grant your account
        the admin role, then reload this page.
      </p>
      <button className="btn btn-ghost" onClick={onSignOut}>
        Sign out
      </button>
    </div>
  );
}

function Admin({ email }: { email: string }) {
  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [list, setList] = useState<StudioListItem[] | null>(null);

  // editor state
  const [form, setForm] = useState<StudioInput>(EMPTY);
  const [tagsText, setTagsText] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [existingPub, setExistingPub] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string; slug?: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [section, setSection] = useState<'stories' | 'submissions'>('stories');
  const [subs, setSubs] = useState<Submission[] | null>(null);
  const [subCount, setSubCount] = useState<number | null>(null);

  const loadList = useCallback(async () => {
    setList(null);
    setList(await getStudioPosts());
  }, []);
  const loadSubs = useCallback(async () => {
    setSubs(null);
    setSubs(await getStudioSubmissions());
  }, []);

  useEffect(() => {
    if (mode !== 'list') return;
    loadList();
    loadSubs();
    getSubscriberCount().then(setSubCount);
  }, [mode, loadList, loadSubs]);

  function openNew() {
    setForm(EMPTY);
    setTagsText('');
    setEditId(null);
    setExistingPub(null);
    setSlugTouched(false);
    setMsg(null);
    setShowPreview(false);
    setMode('edit');
  }

  async function openEdit(id: string) {
    setMode('edit');
    setMsg(null);
    setShowPreview(false);
    const p = await getStudioPost(id);
    if (!p) {
      setMsg({ type: 'err', text: 'Could not load that post.' });
      return;
    }
    const { id: pid, published_at, ...rest } = p;
    setForm(rest);
    setTagsText(rest.tags.join(', '));
    setEditId(pid);
    setExistingPub(published_at);
    setSlugTouched(true);
  }

  const set = <K extends keyof StudioInput>(k: K, v: StudioInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  function onTitle(v: string) {
    setForm((f) => ({ ...f, title: v, slug: !slugTouched && !editId ? slugify(v) : f.slug }));
  }
  function onSlug(v: string) {
    setSlugTouched(true);
    set('slug', slugify(v));
  }

  async function doSave(status: 'draft' | 'published') {
    if (!form.title.trim() || !form.slug.trim()) {
      setMsg({ type: 'err', text: 'Title and slug are both required.' });
      return;
    }
    setSaving(true);
    setMsg(null);
    const input: StudioInput = {
      ...form,
      status,
      tags: tagsText.split(',').map((t) => t.trim()).filter(Boolean),
    };
    const { id, slug, error } = await savePost(input, { id: editId ?? undefined, existingPublishedAt: existingPub });
    setSaving(false);
    if (error) {
      setMsg({ type: 'err', text: error });
      return;
    }
    if (!editId && id) setEditId(id);
    if (status === 'published' && !existingPub) setExistingPub(new Date().toISOString());
    setForm((f) => ({ ...f, status }));
    setMsg({ type: 'ok', text: status === 'published' ? 'Published — live now.' : 'Draft saved.', slug });
  }

  async function doDelete(id: string, title: string) {
    if (!window.confirm(`Delete “${title}”? This can't be undone.`)) return;
    const { error } = await deleteStudioPost(id);
    if (error) window.alert(error);
    else loadList();
  }

  // Community submissions → prefill the editor from a reader's pitch.
  const CAT_TO_VERTICAL: Record<string, string> = { eats: 'eats', transportation: 'transpo', attractions: 'attractions', travels: 'travels' };
  async function openFromSubmission(s: Submission) {
    setForm({
      ...EMPTY,
      title: s.title || '',
      body_md: s.body || '',
      city: s.city || '',
      vertical: CAT_TO_VERTICAL[s.category || ''] || 'transpo',
      author_name: s.name || '',
      slug: slugify(s.title || ''),
    });
    setTagsText('');
    setEditId(null);
    setExistingPub(null);
    setSlugTouched(true);
    setMsg(null);
    setShowPreview(false);
    if (s.status === 'new') setSubmissionStatus(s.id, 'reviewing');
    setMode('edit');
  }
  async function subAction(id: string, status: string) {
    await setSubmissionStatus(id, status);
    loadSubs();
  }
  async function subDelete(id: string) {
    if (!window.confirm('Delete this submission? This can’t be undone.')) return;
    await deleteSubmission(id);
    loadSubs();
  }

  // ── Dashboard ──
  if (mode === 'list') {
    const pendingSubs = subs?.filter((s) => s.status === 'new').length ?? 0;
    return (
      <>
        <div className="top">
          <div>
            <div className="brandmark">CBL Studio</div>
            <h1 className="st-title">{section === 'stories' ? 'Your stories' : 'Reader submissions'}</h1>
          </div>
          <div className="whoami">
            {subCount !== null && (
              <span className="subcount">
                {subCount} subscriber{subCount === 1 ? '' : 's'}
              </span>
            )}
            <span>
              <b>{email}</b>
            </span>
            <button className="btn btn-ghost mini" onClick={() => authClient.auth.signOut()}>
              Sign out
            </button>
            <button className="btn btn-gold mini" onClick={openNew}>
              + New story
            </button>
          </div>
        </div>

        <div className="sectnav">
          <button className={'sectbtn' + (section === 'stories' ? ' on' : '')} onClick={() => setSection('stories')}>
            Stories
          </button>
          <button className={'sectbtn' + (section === 'submissions' ? ' on' : '')} onClick={() => setSection('submissions')}>
            Submissions{pendingSubs > 0 && <span className="pill-n">{pendingSubs}</span>}
          </button>
        </div>

        {section === 'stories' ? (
          list === null ? (
            <div className="empty">Loading…</div>
          ) : list.length === 0 ? (
            <div className="empty">No stories yet. Hit “+ New story” to write the first one.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="pt">
                        {p.title}
                        {p.featured ? ' ★' : ''}
                      </span>
                      <span className="ps">/blog/{p.slug}</span>
                    </td>
                    <td>{VERTICALS.find((v) => v.v === p.vertical)?.label ?? p.vertical ?? '—'}</td>
                    <td>
                      <span className={`badge ${p.status === 'published' ? 'published' : 'draft'}`}>{p.status}</span>
                    </td>
                    <td className="ps">{fmt(p.updated_at)}</td>
                    <td>
                      <div className="rowbtns">
                        {p.status === 'published' && (
                          <Link className="btn btn-ghost mini" to={`/blog/${p.slug}`} target="_blank" rel="noreferrer">
                            View
                          </Link>
                        )}
                        <button className="btn btn-ghost mini" onClick={() => openEdit(p.id)}>
                          Edit
                        </button>
                        <button className="btn btn-danger mini" onClick={() => doDelete(p.id, p.title)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : subs === null ? (
          <div className="empty">Loading…</div>
        ) : subs.length === 0 ? (
          <div className="empty">No submissions yet. They show up here when readers use “Share your story” on the blog.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Story</th>
                <th>From</th>
                <th>Category</th>
                <th>Status</th>
                <th>Received</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span className="pt">{s.title || '(no headline)'}</span>
                    <span className="ps">
                      {(s.body || '').slice(0, 90)}
                      {(s.body || '').length > 90 ? '…' : ''}
                    </span>
                  </td>
                  <td>
                    <span className="pt" style={{ fontWeight: 700 }}>
                      {s.name || '—'}
                      {s.city ? ` · ${s.city}` : ''}
                    </span>
                    {s.email && <span className="ps">{s.email}</span>}
                  </td>
                  <td>{s.category || '—'}</td>
                  <td>
                    <span className={`badge ${s.status === 'new' ? 'published' : 'draft'}`}>{s.status}</span>
                  </td>
                  <td className="ps">{fmt(s.created_at)}</td>
                  <td>
                    <div className="rowbtns">
                      <button className="btn btn-gold mini" onClick={() => openFromSubmission(s)}>
                        Use as story →
                      </button>
                      {s.status !== 'archived' && (
                        <button className="btn btn-ghost mini" onClick={() => subAction(s.id, 'archived')}>
                          Archive
                        </button>
                      )}
                      <button className="btn btn-danger mini" onClick={() => subDelete(s.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </>
    );
  }

  // ── Editor ──
  return (
    <>
      <div className="top">
        <div>
          <div className="brandmark">CBL Studio</div>
          <h1 className="st-title">{editId ? 'Edit story' : 'New story'}</h1>
        </div>
        <div className="whoami">
          <button className="btn btn-ghost mini" onClick={() => setMode('list')}>
            ← All stories
          </button>
          <button className="btn btn-ghost mini" onClick={() => setShowPreview((s) => !s)}>
            {showPreview ? 'Hide preview' : 'Preview'}
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="preview">
          <div className="pv-h">Live preview</div>
          {form.hero_image && <img className="hero" src={form.hero_image} alt="" />}
          <h3 className="pv-t">{form.title || 'Untitled story'}</h3>
          {form.subtitle && <div className="pv-dek">{form.subtitle}</div>}
          <div className="md">{form.body_md ? <Markdown source={form.body_md} /> : <p style={{ color: '#666' }}>Start writing the body to see it here…</p>}</div>
        </div>
      )}

      <div className="fldset">
        <div className="legend">The basics</div>
        <div className="fld">
          <label htmlFor="f-title">
            Title <span className="req-star">*</span>
          </label>
          <input id="f-title" type="text" value={form.title} onChange={(e) => onTitle(e.target.value)} placeholder="Rideshare vs. Cabs in 2026…" />
        </div>
        <div className="fld">
          <label htmlFor="f-slug">
            URL slug <span className="req-star">*</span>
          </label>
          <div className="slugrow">
            <span className="pfx">/blog/</span>
            <input id="f-slug" type="text" value={form.slug} onChange={(e) => onSlug(e.target.value)} placeholder="rideshare-vs-cabs-2026" />
          </div>
          <span className="hint">Auto-filled from the title. Lowercase letters, numbers and hyphens only.</span>
        </div>
        <div className="grid2">
          <div className="fld">
            <label htmlFor="f-vertical">Category</label>
            <select id="f-vertical" value={form.vertical} onChange={(e) => set('vertical', e.target.value)}>
              {VERTICALS.map((v) => (
                <option key={v.v} value={v.v}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div className="fld">
            <label htmlFor="f-city">City</label>
            <input id="f-city" type="text" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="Pittsburgh" />
          </div>
        </div>
      </div>

      <div className="fldset">
        <div className="legend">Above the fold</div>
        <div className="fld">
          <label htmlFor="f-kicker">Kicker (small eyebrow line)</label>
          <input id="f-kicker" type="text" value={form.kicker} onChange={(e) => set('kicker', e.target.value)} placeholder="Where the Locals Go · Pittsburgh · Transportation" />
        </div>
        <div className="fld">
          <label htmlFor="f-subtitle">Subtitle / dek (italic line under the title)</label>
          <textarea id="f-subtitle" rows={2} value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
        </div>
        <div className="fld">
          <label htmlFor="f-excerpt">Excerpt (card summary on the index)</label>
          <textarea id="f-excerpt" rows={2} value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} />
        </div>
        <div className="grid2">
          <div className="fld">
            <label htmlFor="f-hero">Hero image URL</label>
            <input id="f-hero" type="text" value={form.hero_image} onChange={(e) => set('hero_image', e.target.value)} placeholder="/blog/your-photo.jpg" />
            <span className="hint">A path under /public (e.g. /blog/…) or a full https URL. No photo → clean single-column header.</span>
          </div>
          <div className="fld">
            <label htmlFor="f-author">Author byline</label>
            <input id="f-author" type="text" value={form.author_name} onChange={(e) => set('author_name', e.target.value)} placeholder="Brian Uhler" />
          </div>
        </div>
      </div>

      <div className="fldset">
        <div className="legend">The story</div>
        <div className="fld">
          <label htmlFor="f-body">Body (Markdown)</label>
          <textarea
            id="f-body"
            rows={16}
            value={form.body_md}
            onChange={(e) => set('body_md', e.target.value)}
            placeholder={'Write in Markdown.\n\n## A section heading\n\nA paragraph. **Bold**, *italic*, [links](https://…).\n\n- bullet\n- bullet\n\n> A pull quote.'}
          />
          <span className="hint">## heading · **bold** · *italic* · [link](url) · - bullets · &gt; quote</span>
        </div>
      </div>

      <div className="fldset">
        <div className="legend">Optional callouts (hidden when empty)</div>
        <div className="grid2">
          <div className="fld">
            <label htmlFor="f-dt">Driver's Take</label>
            <textarea id="f-dt" rows={3} value={form.drivers_take} onChange={(e) => set('drivers_take', e.target.value)} />
          </div>
          <div className="fld">
            <label htmlFor="f-dtn">— attributed to</label>
            <input id="f-dtn" type="text" value={form.drivers_take_name} onChange={(e) => set('drivers_take_name', e.target.value)} placeholder="Brian U., Pittsburgh driver" />
          </div>
        </div>
        <div className="grid2">
          <div className="fld">
            <label htmlFor="f-rt">Rider's Take</label>
            <textarea id="f-rt" rows={3} value={form.riders_take} onChange={(e) => set('riders_take', e.target.value)} />
          </div>
          <div className="fld">
            <label htmlFor="f-rtn">— attributed to</label>
            <input id="f-rtn" type="text" value={form.riders_take_name} onChange={(e) => set('riders_take_name', e.target.value)} placeholder="A CBL member" />
          </div>
        </div>
      </div>

      <div className="fldset">
        <div className="legend">Options</div>
        <div className="fld">
          <label htmlFor="f-tags">Tags (comma-separated)</label>
          <input id="f-tags" type="text" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="rideshare, cabs, pittsburgh" />
        </div>
        <div className="grid2">
          <label className="check">
            <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
            Feature this in the spotlight
          </label>
          <label className="check">
            <input type="checkbox" checked={form.show_trip_planner} onChange={(e) => set('show_trip_planner', e.target.checked)} />
            Show the “Plan your trip” module
          </label>
        </div>
        <details className="seo" style={{ marginTop: 16 }}>
          <summary>SEO (optional — how Google shows the post)</summary>
          <div className="fld">
            <label htmlFor="f-seot">SEO title</label>
            <input id="f-seot" type="text" value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} placeholder="Defaults to the title" />
          </div>
          <div className="fld">
            <label htmlFor="f-seod">SEO description</label>
            <textarea id="f-seod" rows={2} value={form.seo_description} onChange={(e) => set('seo_description', e.target.value)} />
          </div>
        </details>
      </div>

      <div className="actions">
        <span className={`badge ${form.status === 'published' ? 'published' : 'draft'}`}>{form.status}</span>
        {msg && (
          <span className={`msg ${msg.type}`}>
            {msg.text}
            {msg.type === 'ok' && form.status === 'published' && msg.slug ? (
              <>
                {' '}
                <Link to={`/blog/${msg.slug}`} target="_blank" rel="noreferrer">
                  View post →
                </Link>
              </>
            ) : null}
          </span>
        )}
        <span className="spacer" />
        <button className="btn btn-ghost" onClick={() => doSave('draft')} disabled={saving}>
          {saving ? 'Saving…' : 'Save draft'}
        </button>
        <button className="btn btn-gold" onClick={() => doSave('published')} disabled={saving}>
          {form.status === 'published' ? 'Update (live)' : 'Publish'}
        </button>
      </div>
    </>
  );
}
