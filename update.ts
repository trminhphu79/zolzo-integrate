// verify-sign-verify.js
// Usage examples:
//   PUBLIC_KEY_STRING="-----BEGIN PUBLIC KEY-----\n..." node verify-sign-verify.js
//   node verify-sign-verify.js --private ./private.pem --public ./public.pem

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function readFile(p) {
  try {
    return fs.readFileSync(p, 'utf8').trim();
  } catch (e) {
    console.error(`Cannot read file: ${p}`);
    process.exit(2);
  }
}

// --- CLI args ---
const argv = process.argv.slice(2);
let privatePath = './private.pem';
let publicPath = './public.pem';
for (let i = 0; i < argv.length; i++) {
  if ((argv[i] === '--private' || argv[i] === '-p') && argv[i+1]) { privatePath = argv[i+1]; i++; }
  else if ((argv[i] === '--public' || argv[i] === '-u') && argv[i+1]) { publicPath = argv[i+1]; i++; }
}

// --- load keys ---
if (!fs.existsSync(privatePath)) {
  console.error(`Private key not found at ${privatePath}`);
  process.exit(2);
}
const privatePem = readFile(privatePath);

// public can come from env or file
let publicRaw = process.env.PUBLIC_KEY_STRING;
if (!publicRaw) {
  if (!fs.existsSync(publicPath)) {
    console.error(`Public key not found. Provide PUBLIC_KEY_STRING env or file at ${publicPath}`);
    process.exit(2);
  }
  publicRaw = readFile(publicPath);
}

// If env provided as single-line with \n escapes, convert those to real newlines
if (publicRaw.includes('\\n') && !publicRaw.includes('-----BEGIN')) {
  publicRaw = publicRaw.replace(/\\n/g, '\n');
}

// --- sign & verify ---
try {
  const message = Buffer.from('node-sign-verify-test:' + Date.now());
  // sign using sha256
  const signature = crypto.sign('sha256', message, privatePem);

  const ok = crypto.verify('sha256', message, publicRaw, signature);

  if (ok) {
    console.log('OK: signature verified — public and private keys match.');
    process.exit(0);
  } else {
    console.error('FAIL: signature verification failed — keys do NOT match.');
    process.exit(1);
  }
} catch (err) {
  console.error('ERROR during sign/verify:', err && err.message ? err.message : err);
  process.exit(3);
}