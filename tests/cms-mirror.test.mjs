import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { BRANCH_PREFIX, LABEL, RERUN_INSTRUCTIONS, SEED_PATH, decodeContent, describeChange, runMirror } from '../src/cms/mirror.ts';
import { mirrorPages, serializeSeed } from '../src/content/cms-shape.ts';

const seedText = readFileSync(new URL('../seed/seed.json', import.meta.url), 'utf8');
const seed = JSON.parse(seedText);
const REPO = 'saari-co/repoglance-site';
const live = () => seed.content.pages.map((page) => ({ slug: page.slug, data: structuredClone(page.data) }));
const encode = (text) => Buffer.from(text, 'utf8').toString('base64').replace(/(.{60})/g, '$1\n');

/** A fake GitHub: records every call and answers like the REST API would. */
function fakeGitHub({ mainSeedText = seedText, openPulls = [], failOn } = {}) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    const { pathname, search } = new URL(url);
    const method = init.method ?? 'GET';
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ method, path: pathname + search, body, headers: init.headers });
    const json = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
    if (failOn && failOn(method, pathname)) return new Response(JSON.stringify({ message: 'Bad credentials' }), { status: 401 });
    if (method === 'GET' && pathname === `/repos/${REPO}/git/ref/heads/main`) return json({ object: { sha: 'main000' } });
    if (method === 'GET' && pathname === `/repos/${REPO}/contents/${SEED_PATH}`) return json({ content: encode(mainSeedText), encoding: 'base64' });
    if (method === 'GET' && pathname === `/repos/${REPO}/pulls`) return json(openPulls);
    if (method === 'GET' && pathname.startsWith(`/repos/${REPO}/git/commits/`)) return json({ tree: { sha: `tree-of-${pathname.split('/').pop()}` } });
    if (method === 'POST' && pathname === `/repos/${REPO}/git/blobs`) return json({ sha: 'blob111' });
    if (method === 'POST' && pathname === `/repos/${REPO}/git/trees`) return json({ sha: 'tree222' });
    if (method === 'POST' && pathname === `/repos/${REPO}/git/commits`) return json({ sha: 'commit333' });
    if (method === 'POST' && pathname === `/repos/${REPO}/git/refs`) return json({ ref: body.ref }, 201);
    if (method === 'PATCH' && pathname.startsWith(`/repos/${REPO}/git/refs/heads/`)) return json({ object: { sha: body.sha } });
    if (method === 'POST' && pathname === `/repos/${REPO}/pulls`) return json({ number: 42, html_url: 'https://github.com/saari-co/repoglance-site/pull/42', head: { ref: body.head, sha: 'commit333' } }, 201);
    if (method === 'PATCH' && pathname.startsWith(`/repos/${REPO}/pulls/`)) return json({});
    if (method === 'DELETE' && pathname.startsWith(`/repos/${REPO}/git/refs/heads/`)) return new Response(null, { status: 204 });
    if (method === 'POST' && pathname.startsWith(`/repos/${REPO}/issues/`)) return json([{ name: LABEL }]);
    return new Response('not found', { status: 404 });
  };
  return { calls, fetch: fetchImpl };
}

const env = { GITHUB_MIRROR_TOKEN: 'ghp_test', GITHUB_MIRROR_REPO: REPO, GITHUB_API_BASE: 'https://api.example.invalid', MIRROR_EMAIL_TO: 'agent@example.invalid' };
const at = new Date('2026-10-07T15:00:00Z');
const quiet = () => {};
const channel = async () => {};

test('unconfigured: a missing token, repo or email channel means no calls, a log line naming what is missing, nothing else', async () => {
  const github = fakeGitHub();
  const lines = [];
  const outcome = await runMirror({ collection: 'pages', id: 'home', action: 'publish' }, { env: { GITHUB_MIRROR_REPO: REPO }, fetch: github.fetch, readLivePages: async () => live(), log: (line) => lines.push(line) });
  assert.equal(outcome.status, 'unconfigured');
  assert.equal(github.calls.length, 0);
  assert.match(lines[0], /GITHUB_MIRROR_TOKEN, the send_email binding, MIRROR_EMAIL_TO missing/);
  assert.match(lines[0], /npm run cms:mirror/);
  const noChannel = await runMirror({ collection: 'pages', id: 'home', action: 'publish' }, { env: { ...env, MIRROR_EMAIL_TO: undefined }, fetch: github.fetch, readLivePages: async () => live(), sendEmail: channel, log: quiet });
  assert.equal(noChannel.status, 'unconfigured');
  assert.match(noChannel.detail, /MIRROR_EMAIL_TO missing/);
  const noBinding = await runMirror({ collection: 'pages', id: 'home', action: 'publish' }, { env, fetch: github.fetch, readLivePages: async () => live(), log: quiet });
  assert.equal(noBinding.status, 'unconfigured');
  assert.match(noBinding.detail, /the send_email binding missing/);
  const noRepo = await runMirror({ collection: 'pages', id: 'home', action: 'publish' }, { env: { ...env, GITHUB_MIRROR_REPO: ' ' }, fetch: github.fetch, readLivePages: async () => live(), sendEmail: channel, log: quiet });
  assert.equal(noRepo.status, 'unconfigured');
  assert.match(noRepo.detail, /\(GITHUB_MIRROR_REPO missing\)/);
  assert.equal(github.calls.length, 0, 'never silent: without a channel the mirror does not run at all');
});

test('equal: when main already equals the live CMS and no mirror PR is open, nothing is pushed', async () => {
  const github = fakeGitHub();
  const outcome = await runMirror({ collection: 'pages', id: 'home', action: 'publish' }, { env, fetch: github.fetch, readLivePages: async () => live(), sendEmail: channel, log: quiet, now: () => at });
  assert.equal(outcome.status, 'equal');
  assert.deepEqual(github.calls.map((call) => call.method), ['GET', 'GET', 'GET'], 'only the ref, the file and the open PRs were read');
});

test('closed: when live comes back to what main holds, the open mirror PR is closed and its branch deleted', async () => {
  const open = [{ number: 7, html_url: 'https://github.com/saari-co/repoglance-site/pull/7', head: { ref: `${BRANCH_PREFIX}20261007-140000z`, sha: 'head777', repo: { full_name: REPO } } }];
  const github = fakeGitHub({ openPulls: open });
  const outcome = await runMirror({ collection: 'pages', id: '01ABC', slug: 'home', action: 'publish', editor: 'Bobby' }, { env, fetch: github.fetch, readLivePages: async () => live(), sendEmail: channel, log: quiet, now: () => at });
  assert.equal(outcome.status, 'closed');
  assert.equal(outcome.prUrl, open[0].html_url);
  const methods = github.calls.map((call) => `${call.method} ${call.path.split('?')[0]}`);
  assert.deepEqual(methods.slice(3), [`PATCH /repos/${REPO}/pulls/7`, `DELETE /repos/${REPO}/git/refs/heads/${open[0].head.ref}`]);
  const patch = github.calls.find((call) => call.method === 'PATCH').body;
  assert.equal(patch.state, 'closed');
  assert.match(patch.body, /`main` already equals the live CMS/);
  assert.ok(!methods.some((call) => /merge|blobs|commits$/.test(call)), 'nothing committed, nothing merged');
});

test('opened: an admin edit becomes a branch, a commit of the mirrored seed, a labelled PR; the token never merges', async () => {
  const github = fakeGitHub();
  const pages = live();
  pages[0].data.layout[0].heading = 'Edited in the admin';
  const outcome = await runMirror({ collection: 'pages', id: 'home', action: 'publish', editor: 'Bobby' }, { env, fetch: github.fetch, readLivePages: async () => pages, sendEmail: channel, log: quiet, now: () => at });
  assert.equal(outcome.status, 'opened');
  assert.equal(outcome.prUrl, 'https://github.com/saari-co/repoglance-site/pull/42');
  assert.ok(outcome.branch.startsWith(BRANCH_PREFIX));
  const methods = github.calls.map((call) => `${call.method} ${call.path.split('?')[0]}`);
  assert.deepEqual(methods, [
    `GET /repos/${REPO}/git/ref/heads/main`,
    `GET /repos/${REPO}/contents/${SEED_PATH}`,
    `GET /repos/${REPO}/pulls`,
    `GET /repos/${REPO}/git/commits/main000`,
    `POST /repos/${REPO}/git/blobs`,
    `POST /repos/${REPO}/git/trees`,
    `POST /repos/${REPO}/git/commits`,
    `POST /repos/${REPO}/git/refs`,
    `POST /repos/${REPO}/pulls`,
    `POST /repos/${REPO}/issues/42/labels`,
  ]);
  assert.ok(!methods.some((call) => /merge/.test(call)), 'no merge call');
  const blob = github.calls.find((call) => call.path === `/repos/${REPO}/git/blobs`).body;
  assert.equal(blob.encoding, 'utf-8');
  assert.equal(blob.content, serializeSeed(mirrorPages(seed, pages)), 'the blob is the mirrored seed built on main');
  assert.equal(JSON.parse(blob.content).content.pages[0].data.layout[0].heading, 'Edited in the admin');
  const tree = github.calls.find((call) => call.path === `/repos/${REPO}/git/trees`).body;
  assert.deepEqual(tree, { base_tree: 'tree-of-main000', tree: [{ path: SEED_PATH, mode: '100644', type: 'blob', sha: 'blob111' }] });
  const commit = github.calls.find((call) => call.path === `/repos/${REPO}/git/commits`).body;
  assert.deepEqual(commit.parents, ['main000']);
  assert.match(commit.message, /^CMS edit: home \(publish by Bobby, 2026-10-07\)/);
  const pr = github.calls.find((call) => call.path === `/repos/${REPO}/pulls` && call.method === 'POST').body;
  assert.equal(pr.base, 'main');
  assert.equal(pr.head, outcome.branch);
  assert.match(pr.body, /published in the EmDash admin by Bobby/);
  assert.match(pr.body, /`home`: content \(layout\[0\]\.heading\)/);
  assert.deepEqual(github.calls.at(-1).body, { labels: [LABEL] });
  for (const call of github.calls) assert.equal(call.headers.authorization, 'Bearer ghp_test');
});

test('updated: an open cms-edit PR receives the new commit instead of a second PR', async () => {
  const open = [{ number: 7, html_url: 'https://github.com/saari-co/repoglance-site/pull/7', head: { ref: `${BRANCH_PREFIX}20261007-140000z`, sha: 'head777', repo: { full_name: REPO } } }];
  const github = fakeGitHub({ openPulls: open });
  const pages = live();
  pages[1].data.description = 'Changed again';
  const outcome = await runMirror({ collection: 'pages', id: 'testers', action: 'publish' }, { env, fetch: github.fetch, readLivePages: async () => pages, sendEmail: channel, log: quiet, now: () => at });
  assert.equal(outcome.status, 'updated');
  assert.equal(outcome.branch, open[0].head.ref);
  const methods = github.calls.map((call) => `${call.method} ${call.path.split('?')[0]}`);
  assert.ok(methods.includes(`GET /repos/${REPO}/git/commits/head777`), 'the tree is based on the PR head');
  assert.ok(methods.includes(`PATCH /repos/${REPO}/git/refs/heads/${open[0].head.ref}`));
  assert.ok(methods.includes(`PATCH /repos/${REPO}/pulls/7`));
  assert.ok(!methods.some((call) => call === `POST /repos/${REPO}/pulls` || call === `POST /repos/${REPO}/git/refs`), 'no new branch or PR');
  const commit = github.calls.find((call) => call.path === `/repos/${REPO}/git/commits`).body;
  assert.deepEqual(commit.parents, ['head777']);
});

test('failed: a GitHub error sends the failure email with the page, the error and the re-run, and never throws', async () => {
  const github = fakeGitHub({ failOn: (method, path) => method === 'POST' && path.endsWith('/git/blobs') });
  const pages = live();
  pages[0].data.title = 'Changed';
  const sent = [];
  const outcome = await runMirror({ collection: 'pages', id: '01ABC', slug: 'home', action: 'unpublish', editor: 'Bobby' }, { env, fetch: github.fetch, readLivePages: async () => pages, sendEmail: async (message) => sent.push(message), log: quiet, now: () => at });
  assert.equal(outcome.status, 'failed');
  assert.equal(outcome.emailed, true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'agent@example.invalid');
  assert.equal(sent[0].from, 'mirror@repoglance.com');
  assert.match(sent[0].subject, /CMS mirror failed for home \(unpublish\)/);
  assert.match(sent[0].text, /Page: pages\/home \(id 01ABC\)/);
  assert.match(sent[0].text, /GitHub POST \/repos\/saari-co\/repoglance-site\/git\/blobs answered 401: Bad credentials/);
  assert.ok(sent[0].text.includes(RERUN_INSTRUCTIONS));
});

test('failed when the email itself cannot be sent: the failure and the email error are logged, the outcome says it was not emailed', async () => {
  const github = fakeGitHub({ failOn: (method) => method === 'GET' });
  const lines = [];
  const outcome = await runMirror({ collection: 'pages', id: 'home', action: 'publish' }, { env, fetch: github.fetch, readLivePages: async () => live(), sendEmail: async () => { throw new Error('Email Routing refused the destination'); }, log: (line) => lines.push(line), now: () => at });
  assert.equal(outcome.status, 'failed');
  assert.equal(outcome.emailed, false);
  assert.ok(lines.some((line) => /the failure email could not be sent: Email Routing refused the destination/.test(line)));
});

test('failed: a page reader error is reported the same way', async () => {
  const github = fakeGitHub();
  const sent = [];
  const outcome = await runMirror({ collection: 'pages', id: 'home', action: 'publish' }, { env, fetch: github.fetch, readLivePages: async () => { throw new Error('the DB binding is missing'); }, sendEmail: async (message) => sent.push(message), log: quiet, now: () => at });
  assert.equal(outcome.status, 'failed');
  assert.match(sent[0].text, /Error: the DB binding is missing/);
});

test('describeChange names the pages and the manual run; decodeContent handles GitHub line breaks and UTF-8', () => {
  const pages = live();
  pages[0].data.layout[0].heading = 'Ünïcode heading';
  const change = describeChange(seed, pages, { collection: 'pages', id: 'home', action: 'manual' }, at);
  assert.equal(change.title, 'CMS edit: home (mirrored by hand, 2026-10-07)');
  assert.match(change.body, /Mirrored by `npm run cms:mirror`/);
  const trashed = describeChange(seed, pages.slice(0, 1), { collection: 'pages', id: '01ABC', slug: 'testers', action: 'delete', editor: 'Bobby' }, at);
  assert.match(trashed.body, /A page was deleted in the EmDash admin by Bobby/);
  assert.match(trashed.title, /^CMS edit: home, testers \(delete by Bobby, 2026-10-07\)/);
  assert.deepEqual(change.slugs, ['home']);
  assert.equal(decodeContent(encode('héllo\n{"a":1}')), 'héllo\n{"a":1}');
});
