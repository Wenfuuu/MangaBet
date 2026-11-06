import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseSessionToken } from './sessionToken.ts';

test('accepts a bare cookie value', () => {
	assert.equal(parseSessionToken('  abc.def-123  '), 'abc.def-123');
});

test('decodes a URL-encoded cookie value', () => {
	assert.equal(parseSessionToken('abc%3D%3D'), 'abc==');
});

test('extracts the token from a pasted cookie header', () => {
	assert.equal(parseSessionToken('theme=dark; token=abc123; other=1'), 'abc123');
	assert.equal(parseSessionToken('token=abc123'), 'abc123');
});

test('rejects empty input', () => {
	assert.equal(parseSessionToken('   '), null);
	assert.equal(parseSessionToken('token='), null);
});

test('rejects malformed percent encoding', () => {
	assert.equal(parseSessionToken('abc%E0%A4%A'), null);
});

test('rejects values that could inject upstream headers', () => {
	assert.equal(parseSessionToken('abc%0d%0aX-Injected: 1'), null);
	assert.equal(parseSessionToken('abc def'), null);
});

test('rejects oversized values', () => {
	assert.equal(parseSessionToken('a'.repeat(4097)), null);
});
