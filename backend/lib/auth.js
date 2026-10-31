import crypto from 'crypto';

const AUTH_SECRET = process.env.AUTH_SECRET || 'dev-auth-secret-change-me';
const PASSWORD_ALGORITHM = 'scrypt';
const PASSWORD_KEY_LENGTH = 64;

function base64urlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64urlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex');
  return `${PASSWORD_ALGORITHM}$${salt}$${derivedKey}`;
}

export function verifyPassword(password, storedValue) {
  if (!storedValue) {
    return false;
  }

  const [algorithm, salt, storedKey] = String(storedValue).split('$');
  if (algorithm !== PASSWORD_ALGORITHM || !salt || !storedKey) {
    return false;
  }

  const derivedKey = crypto.scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex');
  const storedBuffer = Buffer.from(storedKey, 'hex');
  const derivedBuffer = Buffer.from(derivedKey, 'hex');

  if (storedBuffer.length !== derivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, derivedBuffer);
}

export function createAuthToken(user) {
  const payload = {
    sub: String(user.id),
    email: user.email,
    name: user.name,
    role: user.role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };

  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

export function verifyAuthToken(token) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = String(token).split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64urlDecode(encodedPayload));
    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getBearerToken(authorizationHeader) {
  if (!authorizationHeader) {
    return '';
  }

  const [scheme, token] = String(authorizationHeader).split(' ');
  if (scheme !== 'Bearer' || !token) {
    return '';
  }

  return token;
}
