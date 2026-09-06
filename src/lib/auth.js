import { writable } from 'svelte/store';

// Same localStorage keys as v1 so existing sessions carry over.
function load() {
  const token = localStorage.getItem('suno_token');
  if (!token) return null;
  return {
    token,
    username: localStorage.getItem('suno_username') || '',
    role: localStorage.getItem('suno_role') || 'user',
  };
}

export const user = writable(load());

function save(d) {
  localStorage.setItem('suno_token', d.token);
  localStorage.setItem('suno_username', d.username);
  localStorage.setItem('suno_role', d.role);
  user.set({ token: d.token, username: d.username, role: d.role });
}

async function call(body) {
  const r = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const d = await r.json();
  if (!d.ok) throw new Error(d.error || 'error');
  return d;
}

export async function login(username, password) {
  save(await call({ action: 'login', username, password }));
}

export async function register(username, password, email) {
  save(await call({ action: 'register', username, password, email }));
}

export function logout() {
  ['suno_token', 'suno_username', 'suno_role'].forEach(k => localStorage.removeItem(k));
  user.set(null);
}

/** Verify token in background; only log out on an explicit rejection. */
export async function verify() {
  const u = load();
  if (!u) return;
  try {
    const r = await fetch('/api/auth?action=verify&token=' + encodeURIComponent(u.token));
    const d = await r.json();
    if (d && d.ok === false) logout();
  } catch {}
}
