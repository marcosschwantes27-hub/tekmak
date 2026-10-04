const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { parseInstagram, verifySignature } = require('../server');

test('ignora eco de mensagem enviada pelo Instagram', () => {
  const result = parseInstagram({ object: 'instagram', entry: [{ messaging: [
    { sender: { id: 'cliente' }, message: { mid: 'ig.1', text: 'Oi' }, timestamp: 1760000000000 },
    { sender: { id: 'empresa' }, message: { mid: 'ig.2', text: 'Olá', is_echo: true }, timestamp: 1760000001000 }
  ] }] });
  assert.equal(result.length, 1);
  assert.equal(result[0].channel, 'instagram');
  assert.equal(result[0].text, 'Oi');
});

test('exige assinatura HMAC válida', () => {
  const raw = Buffer.from('{"object":"instagram"}');
  const correct = `sha256=${crypto.createHmac('sha256', 'segredo').update(raw).digest('hex')}`;
  assert.equal(verifySignature(raw, correct, 'segredo'), true);
  assert.equal(verifySignature(raw, correct, 'outro'), false);
  assert.equal(verifySignature(raw, '', 'segredo'), false);
});
