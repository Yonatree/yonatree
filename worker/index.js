// Yona Tree Worker. Static pages are served straight from dist/; only /api/* reaches this code.
//
//   POST /api/contact      contact form → saved in D1, emailed to CONTACT_TO (via Resend)
//   POST /api/newsletter   newsletter sign-up → saved in D1
//   GET  /api/auth         CMS sign-in: starts GitHub OAuth for Decap CMS
//   GET  /api/callback     CMS sign-in: finishes GitHub OAuth and hands the token to /admin/

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    emailed INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS subscribers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    email TEXT NOT NULL UNIQUE,
    source TEXT,
    status TEXT NOT NULL DEFAULT 'subscribed'
  )`,
];

let schemaReady;
function ensureSchema(db) {
  schemaReady ??= db.batch(SCHEMA.map((sql) => db.prepare(sql))).catch((err) => {
    schemaReady = undefined;
    throw err;
  });
  return schemaReady;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      switch (`${request.method} ${url.pathname.replace(/\/$/, '')}`) {
        case 'POST /api/contact':
          return await contact(request, env, url);
        case 'POST /api/newsletter':
          return await newsletter(request, env, url);
        case 'GET /api/auth':
          return auth(env, url);
        case 'GET /api/callback':
          return await callback(request, env, url);
        default:
          return new Response('Not found', { status: 404 });
      }
    } catch (err) {
      console.error(err);
      return page(500, 'Something went wrong', 'Your message could not be sent. Please try again in a few minutes.', '/contact/');
    }
  },
};

// ── Forms ────────────────────────────────────────────────────────────────

async function readForm(request, env, url) {
  // Reject cross-site posts: browsers always send Origin on form POSTs.
  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) return { rejected: true };

  const form = await request.formData();
  const get = (k) => String(form.get(k) ?? '').trim();

  // Honeypot: real visitors never see or fill this field.
  if (get('bot-field')) return { spam: true };

  if (env.TURNSTILE_SECRET) {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET,
        response: get('cf-turnstile-response'),
        remoteip: request.headers.get('CF-Connecting-IP') ?? '',
      }),
    });
    const { success } = await res.json();
    if (!success) return { spam: true };
  }
  return { get };
}

async function contact(request, env, url) {
  const { get, spam, rejected } = await readForm(request, env, url);
  if (rejected) return new Response('Forbidden', { status: 403 });
  if (spam) return thanks(url, 'contact');

  const name = get('name').slice(0, 200);
  const email = get('email').slice(0, 320);
  const subject = get('subject').slice(0, 200);
  const message = get('message').slice(0, 10000);
  if (!name || !EMAIL_RE.test(email) || !message) {
    return page(400, 'Please check the form', 'A name, a valid email address and a message are all required.', '/contact/');
  }

  await ensureSchema(env.DB);
  const { meta } = await env.DB.prepare('INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)')
    .bind(name, email, subject, message)
    .run();

  if (env.RESEND_API_KEY) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: [env.CONTACT_TO],
        reply_to: email,
        subject: `Yona Tree contact: ${subject || 'New message'} — ${name}`,
        text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}\n\n— Sent from the contact form on ${url.host}. Reply to this email to answer ${name}.`,
      }),
    });
    if (res.ok) {
      await env.DB.prepare('UPDATE contacts SET emailed = 1 WHERE id = ?').bind(meta.last_row_id).run();
    } else {
      // The message is safe in D1 even if email delivery fails.
      console.error('Resend error', res.status, await res.text());
    }
  }
  return thanks(url, 'contact');
}

async function newsletter(request, env, url) {
  const { get, spam, rejected } = await readForm(request, env, url);
  if (rejected) return new Response('Forbidden', { status: 403 });
  if (spam) return thanks(url, 'newsletter');

  const email = get('email').toLowerCase().slice(0, 320);
  if (!EMAIL_RE.test(email)) {
    return page(400, 'Please check your email address', 'Enter a valid email address, like name@example.com.', '/');
  }
  await ensureSchema(env.DB);
  await env.DB.prepare(
    `INSERT INTO subscribers (email, source) VALUES (?, ?)
     ON CONFLICT(email) DO UPDATE SET status = 'subscribed'`,
  )
    .bind(email, get('source').slice(0, 100))
    .run();
  return thanks(url, 'newsletter');
}

const thanks = (url, form) => Response.redirect(`${url.origin}/thank-you/?form=${form}`, 303);

function page(status, title, text, back) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title} | Yona Tree</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b1a33;color:#f4ecd8;font:18px/1.6 Georgia,serif;padding:16px}main{max-width:32rem}h1{color:#e7ad4f;font-weight:600}a{color:#f1c75b}</style></head>
<body><main><h1>${title}</h1><p>${text}</p><p><a href="${back}">Go back</a></p></main></body></html>`;
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// ── CMS sign-in (Decap CMS ↔ GitHub OAuth) ───────────────────────────────

function auth(env, url) {
  if (!env.GITHUB_CLIENT_ID) return new Response('CMS sign-in is not configured yet (GITHUB_CLIENT_ID missing).', { status: 501 });
  const state = crypto.randomUUID();
  const github = new URL('https://github.com/login/oauth/authorize');
  github.search = new URLSearchParams({
    client_id: env.GITHUB_CLIENT_ID,
    redirect_uri: `${url.origin}/api/callback`,
    scope: 'repo,user',
    state,
  });
  return new Response(null, {
    status: 302,
    headers: {
      Location: github.toString(),
      'Set-Cookie': `cms_oauth_state=${state}; Path=/api; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
    },
  });
}

async function callback(request, env, url) {
  const state = url.searchParams.get('state');
  const cookie = request.headers.get('Cookie') ?? '';
  const expected = /(?:^|;\s*)cms_oauth_state=([^;]+)/.exec(cookie)?.[1];
  if (!state || state !== expected) return oauthResult(url, 'error', { message: 'Sign-in expired. Please try again.' });

  const res = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'User-Agent': 'yonatree-cms' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: url.searchParams.get('code'),
      redirect_uri: `${url.origin}/api/callback`,
    }),
  });
  const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
  if (!data.access_token) {
    console.error('GitHub token exchange failed', res.status, data.error, data.error_description);
    return oauthResult(url, 'error', { message: data.error_description || data.error || 'GitHub sign-in failed.' });
  }
  return oauthResult(url, 'success', { token: data.access_token, provider: 'github' });
}

// Decap's sign-in popup protocol: announce, wait for the CMS window to answer,
// then post the result back — only to this site's own origin.
function oauthResult(url, status, payload) {
  const message = JSON.stringify(`authorization:github:${status}:${JSON.stringify(payload)}`).replace(/</g, '\\u003c');
  const origin = JSON.stringify(url.origin);
  const html = `<!doctype html><html><body><p>Signing in…</p><script>
(function () {
  function receive(e) {
    if (e.origin !== ${origin}) return;
    window.opener.postMessage(${message}, e.origin);
    window.removeEventListener('message', receive);
  }
  window.addEventListener('message', receive);
  window.opener && window.opener.postMessage('authorizing:github', ${origin});
})();
</script></body></html>`;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Set-Cookie': 'cms_oauth_state=; Path=/api; Max-Age=0', 'Cache-Control': 'no-store' },
  });
}
