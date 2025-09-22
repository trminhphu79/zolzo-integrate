import * as crypto from 'crypto';

import {
  aesDecryptBase64,
  aesEncryptBase64,
  aesGenerateKey,
  rsaOaepEncryptBase64,
  rsaSha256SignBase64,
  rsaSha256VerifyBase64,
} from './crypto.helper';

describe('rsaOaepEncryptBase64', () => {
  const { publicKey: pubPem, privateKey: privPem } = crypto.generateKeyPairSync(
    'rsa',
    {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    },
  );

  const message = Buffer.from('hello-zoloz', 'utf8');
  const decrypt = (b64: string) => {
    const data = Buffer.from(b64, 'base64');
    const plain = crypto.privateDecrypt(
      {
        key: privPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      data,
    );
    return plain.toString('utf8');
  };

  const pubPemB64 = Buffer.from(pubPem, 'utf8').toString('base64');
  const privPemB64 = Buffer.from(privPem, 'utf8').toString('base64');

  describe('AES-256-CBC helpers', () => {
    it('generates a 256-bit key', () => {
      const k = aesGenerateKey(256);
      expect(k).toBeInstanceOf(Buffer);
      expect(k.length).toBe(32); // 256/8
    });

    it('encrypts and decrypts round-trip (256-bit key)', () => {
      const key = aesGenerateKey(256);
      const plaintext = 'hello zoloz!';
      const payload = aesEncryptBase64(key, plaintext);

      const [ivB64, ctB64] = payload.split(':');
      expect(ivB64).toBeTruthy();
      expect(ctB64).toBeTruthy();
      expect(Buffer.from(ivB64, 'base64')).toHaveLength(16);

      const dec = aesDecryptBase64(key, payload);
      expect(dec).toBe(plaintext);
    });

    it('throws/decrypts wrong with a different key', () => {
      const key1 = aesGenerateKey(256);
      const key2 = aesGenerateKey(256);
      const payload = aesEncryptBase64(key1, 'secret');

      expect(() => aesDecryptBase64(key2, payload)).toThrow();
    });

    it('throws on malformed payload', () => {
      const key = aesGenerateKey(256);
      expect(() =>
        aesDecryptBase64(key, 'not_base64_iv:not_base64_ct'),
      ).toThrow();
      expect(() => aesDecryptBase64(key, 'onlyOnePart')).toThrow();
    });
  });

  it('encrypts with PEM provided as env string with \\n escapes', () => {
    const pemEnvWithEscapes = pubPem.replace(/\n/g, '\\n'); // simulate .env style
    const cipherB64 = rsaOaepEncryptBase64(pemEnvWithEscapes, message);
    expect(decrypt(cipherB64)).toBe('hello-zoloz');
  });

  it('encrypts with base64 of PEM text', () => {
    const base64OfPem = Buffer.from(pubPem, 'utf8').toString('base64');
    const cipherB64 = rsaOaepEncryptBase64(base64OfPem, message);
    expect(decrypt(cipherB64)).toBe('hello-zoloz');
  });

  it('encrypts with base64 of DER (SPKI) public key', () => {
    const derSpki = crypto
      .createPublicKey(pubPem)
      .export({ format: 'der', type: 'spki' }) as Buffer;
    const base64Der = derSpki.toString('base64');
    const cipherB64 = rsaOaepEncryptBase64(base64Der, message);
    expect(decrypt(cipherB64)).toBe('hello-zoloz');
  });

  it('throws for invalid key material', () => {
    expect(() => rsaOaepEncryptBase64('not-a-valid-key', message)).toThrow();
  });

  describe('rsaSha256SignBase64 (robust key formats)', () => {
    const { publicKey: pubPem, privateKey: privPem } =
      crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, // PKCS#8
      });

    const pubPemB64 = Buffer.from(pubPem, 'utf8').toString('base64');
    const privPemB64 = Buffer.from(privPem, 'utf8').toString('base64');
    const msg = 'sign-me';

    const verify = (pubAny: string, content: string, sigB64: string) =>
      rsaSha256VerifyBase64(pubAny, content, sigB64);

    it('signs with PEM (\\n escaped) and verifies with PEM', () => {
      const pemEscaped = privPem.replace(/\n/g, '\\n'); // simulate .env
      const sig = rsaSha256SignBase64(pemEscaped, msg);
      expect(verify(pubPem, msg, sig)).toBe(true);
    });

    it('signs with base64-PEM and verifies with base64-PEM', () => {
      const sig = rsaSha256SignBase64(privPemB64, msg);
      expect(verify(pubPemB64, msg, sig)).toBe(true);
    });

    it('signs with base64-DER PKCS#8 and verifies with base64-DER SPKI', () => {
      const derPrivPkcs8 = crypto
        .createPrivateKey(privPem)
        .export({ format: 'der', type: 'pkcs8' }) as Buffer;
      const derPubSpki = crypto
        .createPublicKey(pubPem)
        .export({ format: 'der', type: 'spki' }) as Buffer;

      const sig = rsaSha256SignBase64(derPrivPkcs8.toString('base64'), msg);
      expect(verify(derPubSpki.toString('base64'), msg, sig)).toBe(true);
    });

    it('verify fails on content tamper', () => {
      const sig = rsaSha256SignBase64(privPemB64, msg);
      expect(verify(pubPem, msg + 'x', sig)).toBe(false);
    });
  });
});
