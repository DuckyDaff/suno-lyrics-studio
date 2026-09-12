const kv = require('./_kv.cjs');
(async () => {
  const keys = await kv('KEYS', 'user:*');
  if (!keys.length) return console.log('(no users)');
  for (const k of keys) {
    const u = JSON.parse(await kv('GET', k));
    console.log(`${u.username}\trole=${u.role}\temail=${u.email || '-'}\tcreated=${new Date(u.createdAt).toISOString().slice(0,10)}`);
  }
  console.log('---');
  console.log('admin_created =', await kv('GET', 'system:admin_created'));
  console.log('open_registration =', await kv('GET', 'system:open_registration'));
})().catch(e => { console.error(e.message); process.exit(1); });
