const crypto = require('crypto');

const tokenSecret = process.env.AUTH_SECRET || 'glowcart-development-secret-change-me';

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) return reject(error);
      resolve(`scrypt:${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

function verifyPassword(password, storedPassword) {
  if (!storedPassword) return Promise.resolve(false);
  if (!storedPassword.startsWith('scrypt:')) {
    return Promise.resolve(storedPassword === password);
  }

  const [, salt, storedHash] = storedPassword.split(':');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) return reject(error);
      const expected = Buffer.from(storedHash, 'hex');
      const actual = derivedKey;
      resolve(expected.length === actual.length && crypto.timingSafeEqual(expected, actual));
    });
  });
}

function createToken(user) {
  const payload = Buffer.from(JSON.stringify({
    email: user.email,
    role: user.role,
    name: user.name,
    issuedAt: Date.now()
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', tokenSecret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = crypto.createHmac('sha256', tokenSecret).update(payload).digest('base64url');
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length ||
      !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!decoded.email || !decoded.role) return null;
    return decoded;
  } catch {
    return null;
  }
}

function getBearerToken(req) {
  const header = req.get('Authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

module.exports = {
  hashPassword,
  verifyPassword,
  createToken,
  verifyToken,
  getBearerToken
};
