const ApiError = require('./ApiError');

const isObjectId = (v) => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);

const isEmpty = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

const requireId = (v, field) => {
  if (!isObjectId(typeof v === 'string' ? v : String(v ?? ''))) {
    throw new ApiError(400, `${field} is not a valid identifier`);
  }
  return String(v);
};

const str = (v, field, { required = true, max = 200 } = {}) => {
  if (isEmpty(v)) {
    if (required) throw new ApiError(400, `${field} is required`);
    return null;
  }
  if (typeof v !== 'string') throw new ApiError(400, `${field} must be text`);
  const s = v.trim();
  if (s.length > max) throw new ApiError(400, `${field} must be at most ${max} characters`);
  return s;
};

const num = (v, field, { required = true, min, max, integer = false } = {}) => {
  if (isEmpty(v)) {
    if (required) throw new ApiError(400, `${field} is required`);
    return null;
  }
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) throw new ApiError(400, `${field} must be a number`);
  if (integer && !Number.isInteger(n)) throw new ApiError(400, `${field} must be a whole number`);
  if (min !== undefined && n < min) throw new ApiError(400, `${field} must be at least ${min}`);
  if (max !== undefined && n > max) throw new ApiError(400, `${field} must be at most ${max}`);
  return n;
};

const date = (v, field, { required = true } = {}) => {
  if (isEmpty(v)) {
    if (required) throw new ApiError(400, `${field} is required`);
    return null;
  }
  const d = new Date(v);
  if (Number.isNaN(d.getTime()) || d.getUTCFullYear() < 1990 || d.getUTCFullYear() > 2100) {
    throw new ApiError(400, `${field} is not a valid date`);
  }
  return d;
};

const oneOf = (v, field, allowed, { required = true } = {}) => {
  if (isEmpty(v)) {
    if (required) throw new ApiError(400, `${field} is required`);
    return null;
  }
  if (!allowed.includes(v)) throw new ApiError(400, `${field} must be one of: ${allowed.join(', ')}`);
  return v;
};

const email = (v, field = 'Email') => {
  const s = str(v, field, { max: 254 }).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(s)) throw new ApiError(400, `${field} is not a valid email address`);
  return s;
};

const password = (v, field = 'Password') => {
  if (typeof v !== 'string' || v.length < 8) {
    throw new ApiError(400, `${field} must be at least 8 characters`);
  }
  if (v.length > 128) throw new ApiError(400, `${field} must be at most 128 characters`);
  return v;
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

module.exports = { isObjectId, isEmpty, requireId, str, num, date, oneOf, email, password, escapeRegex };
