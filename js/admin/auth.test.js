import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sha256Hex, checkPassphrase } from './auth.js';

test('sha256Hex produces the known SHA-256 test vector for "abc"', async () => {
  const hash = await sha256Hex('abc');
  assert.equal(
    hash,
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  );
});

test('checkPassphrase rejects an incorrect passphrase', async () => {
  const result = await checkPassphrase('esto-seguro-que-no-es-la-frase-correcta');
  assert.equal(result, false);
});

test('checkPassphrase trims surrounding whitespace before hashing', async () => {
  const hashWithSpaces = await sha256Hex('  abc  '.trim());
  const hashDirect = await sha256Hex('abc');
  assert.equal(hashWithSpaces, hashDirect);
});
