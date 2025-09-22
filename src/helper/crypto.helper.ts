import * as crypto from 'crypto';

export function aesGenerateKey(bits: 128 | 192 | 256): Buffer {
  return crypto.randomBytes(bits / 8);
}
export function aesEncryptBase64(
  aesKey: Buffer,
  plaintextUtf8: string,
): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
  const enc = Buffer.concat([
    cipher.update(Buffer.from(plaintextUtf8, 'utf8')),
    cipher.final(),
  ]);
  // store iv + ciphertext (both base64) as iv:ciphertext
  return `${iv.toString('base64')}:${enc.toString('base64')}`;
}
export function aesDecryptBase64(aesKey: Buffer, payload: string): string {
  const [ivB64, dataB64] = payload.split(':');
  const iv = Buffer.from(ivB64, 'base64');
  const data = Buffer.from(dataB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
  const dec = Buffer.concat([decipher.update(data), decipher.final()]);
  return dec.toString('utf8');
}

export function rsaOaepDecrypt(
  privateKeyPemB64: string,
  base64Data: string,
): Buffer {
  const privPem = Buffer.from(privateKeyPemB64, 'base64').toString('utf8');
  const buf = Buffer.from(base64Data, 'base64');
  return crypto.privateDecrypt(
    {
      key: privPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buf,
  );
}

export function rsaSha256SignBase64(
  privateKeyPemB64: string,
  content: string,
): string {
  const privPem = Buffer.from(privateKeyPemB64, 'base64').toString('utf8');
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(content);
  signer.end();
  return signer.sign(privPem).toString('base64');
}

export function rsaSha256VerifyBase64(
  publicKeyPemB64: string,
  content: string,
  signatureB64: string,
): boolean {
  const pubPem = Buffer.from(publicKeyPemB64, 'base64').toString('utf8');
  const verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(content);
  verifier.end();
  return verifier.verify(pubPem, Buffer.from(signatureB64, 'base64'));
}

export function normalizePublicKey(input: string): {
  key: string | Buffer;
  isPem: boolean;
} {
  if (!input) throw new Error('Zoloz public key missing');

  const trimmed = input.trim();

  // Case A: raw PEM pasted in env (maybe with \n)
  if (
    trimmed.includes('BEGIN PUBLIC KEY') ||
    trimmed.includes('BEGIN RSA PUBLIC KEY') ||
    trimmed.includes('BEGIN CERTIFICATE')
  ) {
    // convert "\n" (escaped) to real newlines
    const pem = trimmed.replace(/\\n/g, '\n');
    return { key: pem, isPem: true };
  }

  // Try base64-decode (could be base64 of PEM or base64 of DER)
  let decoded: string;
  try {
    decoded = Buffer.from(trimmed, 'base64').toString('utf8');
  } catch {
    throw new Error('Zoloz public key is not valid base64/PEM');
  }

  // Case B: base64 of PEM text
  if (
    decoded.includes('BEGIN PUBLIC KEY') ||
    decoded.includes('BEGIN RSA PUBLIC KEY') ||
    decoded.includes('BEGIN CERTIFICATE')
  ) {
    return { key: decoded, isPem: true };
  }

  // Case C: base64 of **DER** SubjectPublicKeyInfo (SPKI) or PKCS#1
  // Return Buffer; we’ll load it as DER later.
  const der = Buffer.from(trimmed, 'base64');
  return { key: der, isPem: false };
}

export function rsaOaepEncryptBase64(
  publicKeyEnvValue: string,
  data: Buffer,
): string {
  const { key, isPem } = normalizePublicKey(publicKeyEnvValue);

  // Build a KeyObject that Node can use
  let keyObject: crypto.KeyObject;
  try {
    if (isPem) {
      keyObject = crypto.createPublicKey(key as string);
    } else {
      // Treat as DER SubjectPublicKeyInfo (SPKI). If your key is PKCS#1 DER, change type to 'pkcs1'.
      keyObject = crypto.createPublicKey({
        key: key as Buffer,
        format: 'der',
        type: 'spki',
      });
    }
  } catch (e) {
    throw new Error(`Failed to parse public key: ${(e as Error).message}`);
  }

  const out = crypto.publicEncrypt(
    {
      key: keyObject,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    data,
  );
  return out.toString('base64');
}
