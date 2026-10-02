import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CANONICAL_ORIGIN, canonicalLocation, isRedirectedHost, normaliseHost, permanentRedirect, redirectTarget } from '../src/host-canonical.ts';

const request = (url, headers = {}) => new Request(url, { headers });

test('host normalisation lowers case and drops ports and trailing dots', () => {
  assert.equal(normaliseHost(' WWW.RepoGlance.com '), 'www.repoglance.com');
  assert.equal(normaliseHost('www.repoglance.com:443'), 'www.repoglance.com');
  assert.equal(normaliseHost('www.repoglance.com.'), 'www.repoglance.com');
  assert.equal(normaliseHost('[::1]:8787'), '');
  assert.equal(normaliseHost(''), '');
  assert.equal(normaliseHost(null), '');
});

test('only www.repoglance.com is redirected', () => {
  for (const host of ['www.repoglance.com', 'WWW.REPOGLANCE.COM', 'www.repoglance.com:8787', 'www.repoglance.com.']) {
    assert.equal(isRedirectedHost(host), true, host);
  }
  for (const host of ['repoglance.com', 'repoglance.com:443', '127.0.0.1:8787', 'localhost', 'repoglance-site.example.workers.dev', 'wwww.repoglance.com', 'www.repoglance.com.evil.example', 'www-repoglance.com', undefined]) {
    assert.equal(isRedirectedHost(host), false, String(host));
  }
});

test('the target keeps the path and query on the constant apex origin', () => {
  assert.equal(CANONICAL_ORIGIN, 'https://repoglance.com');
  assert.equal(canonicalLocation(new URL('http://www.repoglance.com/')), 'https://repoglance.com/');
  assert.equal(canonicalLocation(new URL('https://www.repoglance.com/testers?x=1&y=2#frag')), 'https://repoglance.com/testers?x=1&y=2');
  assert.equal(canonicalLocation(new URL('https://www.repoglance.com/_emdash/admin')), 'https://repoglance.com/_emdash/admin');
  assert.equal(canonicalLocation(new URL('https://www.repoglance.com/a%20b/?q=%C3%A9')), 'https://repoglance.com/a%20b/?q=%C3%A9');
});

test('the redirect target follows the Host header first, then the URL', () => {
  assert.equal(redirectTarget(request('http://127.0.0.1:8787/testers?x=1', { host: 'www.repoglance.com' })), 'https://repoglance.com/testers?x=1');
  assert.equal(redirectTarget(request('https://www.repoglance.com/')), 'https://repoglance.com/');
  assert.equal(redirectTarget(request('https://repoglance.com/testers')), null);
  assert.equal(redirectTarget(request('http://127.0.0.1:8787/', { host: 'repoglance.com' })), null);
  assert.equal(redirectTarget(request('http://127.0.0.1:8787/')), null);
  // Spoofed forwarding headers never change the decision or the origin.
  assert.equal(redirectTarget(request('https://www.repoglance.com/x', { 'x-forwarded-host': 'evil.example', 'x-forwarded-proto': 'http' })), 'https://repoglance.com/x');
  assert.equal(redirectTarget(request('https://repoglance.com/x', { 'x-forwarded-host': 'www.repoglance.com' })), null);
});

test('the redirect response is a bodiless 301 with only a location', async () => {
  const response = permanentRedirect('https://repoglance.com/testers');
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://repoglance.com/testers');
  assert.equal(await response.text(), '');
  assert.equal(response.headers.get('cache-control'), null);
});
