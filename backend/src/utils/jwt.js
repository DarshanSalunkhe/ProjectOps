import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import config from '../config/index.js';
import { query } from '../config/database.js';

export const generateToken = (userId, includeJti = true) => {
  const payload = { userId };

  if (includeJti) {
    payload.jti = randomUUID();
  }

  return jwt.sign(
    payload,
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    return null;
  }
};

export const createSession = async (jti, userId, expiresAt, userAgent = null, ipAddress = null) => {
  await query(
    `INSERT INTO auth_sessions (jti, user_id, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [jti, userId, expiresAt, userAgent, ipAddress]
  );
};

export const revokeSession = async (jti) => {
  await query(
    `UPDATE auth_sessions SET revoked_at = NOW() WHERE jti = $1 AND revoked_at IS NULL`,
    [jti]
  );
};

export const revokeAllUserSessions = async (userId) => {
  await query(
    `UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
    [userId]
  );
};

export const isSessionRevoked = async (jti) => {
  const result = await query(
    `SELECT revoked_at FROM auth_sessions WHERE jti = $1`,
    [jti]
  );

  if (result.rows.length === 0) {
    // Session not found (old JWT without jti) - allow it
    return false;
  }

  return result.rows[0].revoked_at !== null;
};

export const getSessionExpiry = () => {
  // Derive expiry from JWT library
  const dummyToken = jwt.sign({ dummy: true }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
  const decoded = jwt.decode(dummyToken);
  return new Date(decoded.exp * 1000);
};
